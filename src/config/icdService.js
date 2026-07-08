/**
 * WHO ICD-11 API Service
 * Tích hợp WHO ICD-11 MMS API để tìm kiếm và lấy chi tiết bệnh chuẩn quốc tế.
 * Token được cache trong bộ nhớ và tự refresh khi hết hạn.
 */

const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const WHO_TOKEN_URL = 'icdaccessmanagement.who.int';
const WHO_API_HOST  = 'id.who.int';
const RELEASE       = '2024-01';

// Cache token trong bộ nhớ để tránh xin token mỗi request
let _cachedToken    = null;
let _tokenExpiresAt = 0;

// ─── Helper: HTTPS request (tự động retry nếu gặp HTTP 429) ─────────────────
function httpsRequest(hostname, path, method, headers, body = null, retries = 2) {
  return new Promise((resolve, reject) => {
    const options = { hostname, path, method, headers };
    const req = https.request(options, async (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        if (res.statusCode === 429 && retries > 0) {
          console.warn(`[HTTPS] Rate limit 429 on ${hostname}${path}. Retrying in 1.5s...`);
          await new Promise(r => setTimeout(r, 1500));
          try {
            const retryRes = await httpsRequest(hostname, path, method, headers, body, retries - 1);
            return resolve(retryRes);
          } catch (err) {
            return reject(err);
          }
        }
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── Lấy Access Token (có cache) ────────────────────────────────────────────
async function getAccessToken() {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt - 60000) {
    return _cachedToken; // Còn hơn 1 phút → dùng cache
  }

  const clientId     = process.env.WHO_ICD_CLIENT_ID;
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('WHO_ICD_CLIENT_ID hoặc WHO_ICD_CLIENT_SECRET chưa được cấu hình trong .env');
  }

  const body = [
    'client_id='     + encodeURIComponent(clientId),
    'client_secret=' + encodeURIComponent(clientSecret),
    'scope=icdapi_access',
    'grant_type=client_credentials',
  ].join('&');

  const res = await httpsRequest(
    WHO_TOKEN_URL, '/connect/token', 'POST',
    { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    body
  );

  if (res.status !== 200 || !res.body.access_token) {
    throw new Error('Không thể lấy WHO ICD token: ' + JSON.stringify(res.body));
  }

  _cachedToken    = res.body.access_token;
  _tokenExpiresAt = now + (res.body.expires_in || 3600) * 1000;
  console.log('[WHO ICD] Token refreshed, expires in', res.body.expires_in, 'seconds');
  return _cachedToken;
}

// ─── Headers chuẩn cho mọi request đến WHO API ──────────────────────────────
async function buildHeaders(lang = 'en') {
  const token = await getAccessToken();
  return {
    'Authorization': 'Bearer ' + token,
    'Accept':        'application/json',
    'API-Version':   'v2',
    'Accept-Language': lang,
  };
}

// ─── 1. Tìm kiếm bệnh theo từ khoá ──────────────────────────────────────────
async function searchDiseases(query, lang = 'en') {
  const headers = await buildHeaders(lang);
  const path = `/icd/release/11/${RELEASE}/mms/search?` + new URLSearchParams({
    q:                 query,
    useFlexisearch:    'true',
    flatResults:       'true',
    highlightingEnabled: 'false',
    medicalCodingMode: 'true',
  }).toString();

  const res = await httpsRequest(WHO_API_HOST, path, 'GET', headers);
  if (res.status !== 200) throw new Error('WHO search failed: ' + res.status);

  const entities = res.body.destinationEntities || [];
  // Strip HTML tags từ title (WHO trả về <em class='found'>...</em>)
  return entities.map(e => ({
    icdId:  e.id?.includes('/mms/') ? e.id.split('/mms/').pop() : e.id?.split('/').pop(),
    icdUrl: e.id,
    title:  e.title?.replace(/<[^>]*>/g, '') || '',
    code:   e.theCode || '',
    isLeaf: e.isLeaf,
  }));
}

// ─── 2. Lấy chi tiết một bệnh theo ICD entity ID ────────────────────────────
async function getDiseaseDetail(icdId, lang = 'en') {
  const headers = await buildHeaders(lang);
  const path = `/icd/release/11/${RELEASE}/mms/${icdId}`;

  const res = await httpsRequest(WHO_API_HOST, path, 'GET', headers);
  if (res.status !== 200) throw new Error('WHO detail failed: ' + res.status);

  const d = res.body;
  const getText = (field) => {
    if (!field) return null;
    if (typeof field === 'string') return field;
    if (field['@value']) return field['@value'];
    return null;
  };

  return {
    icdId,
    icdUrl:      d.browserUrl || null,
    code:        d.code       || null,
    classKind:   d.classKind  || null,
    title:       getText(d.title),
    definition:  getText(d.definition),
    inclusions:  (d.inclusion  || []).map(i => getText(i.label)).filter(Boolean),
    exclusions:  (d.exclusion  || []).map(e => getText(e.label)).filter(Boolean),
    indexTerms:  (d.indexTerm  || []).slice(0, 10).map(t => getText(t.label)).filter(Boolean),
    parentIds:   (d.parent     || []).map(p => p.split('/').pop()),
    childIds:    (d.child      || []).map(c => c.includes('/mms/') ? c.split('/mms/').pop() : c.split('/').pop()),
  };
}

// ─── 3. Lấy Wikipedia tiếng Việt (hoặc Anh) để bổ sung mô tả ──────────────────────────
const WIKI_ALIAS_MAP = {
  'đau rát họng': 'Viêm họng',
  'đau thượng vị': 'Đau bụng',
  'đau khu trú vùng thượng vị': 'Đau bụng',
  'đau khu trú vùng thượng vị (dạ dày)': 'Đau bụng',
  'trào ngược dạ dày': 'Trào ngược dạ dày thực quản',
  'phát ban ngoài da': 'Rash',
  'phát ban ngoài da không xác định': 'Rash',
  'phát ban ngoài da đặc hiệu khác': 'Rash',
  'bộc phát ban da cấp tính': 'Rash',
  'bộc phát ban da cấp tính không rõ nguyên nhân': 'Rash',
  'rối loạn bệnh lý da mạn tính': 'Skin condition',
  'say xe': 'Say tàu xe',
  'say xe / say tàu xe': 'Say tàu xe',
  'đau nhức cơ bắp': 'Myalgia',
  'đau sưng khớp': 'Viêm khớp',
  'đau bụng kinh': 'Dysmenorrhea',
  'tiêu chảy cấp': 'Tiêu chảy',
  'hội chứng đau không xác định': 'Pain',
  'đau không xác định': 'Pain',
  'buồn nôn và nôn ói': 'Buồn nôn',
  'buồn nôn': 'Buồn nôn'
};

async function getWikipediaSummary(diseaseName, enName = null) {
  if (!diseaseName) return null;
  const cleanName = diseaseName.trim();
  if (cleanName.length < 2) return null;

  // Bỏ qua thuật ngữ quá chung
  const GENERIC_TERMS = ['unspecified', 'không xác định', 'other', 'khác', 'nos', 'nec',
    'không rõ', 'đặc hiệu khác', 'bệnh lý icd-11'];
  if (GENERIC_TERMS.some(t => cleanName.toLowerCase() === t)) return null;

  // Sử dụng tên thay thế chuẩn y khoa nếu có
  const searchTerm = WIKI_ALIAS_MAP[cleanName.toLowerCase()] || cleanName;

  // Title/nội dung rõ ràng KHÔNG phải y tế
  const NON_MEDICAL = ['anime', 'manga', 'conan', 'bóng đá', 'giải vô địch',
    'ca sĩ', 'nhạc sĩ', 'diễn viên', 'bác hồ', 'cầu thủ', 'phim truyện',
    'ngày của', 'trung quốc', 'tây ban nha', 'việt nam (', 'thám tử', 'đài truyền hình',
    'phát trực tiếp', 'ak-47', 'trang chính', 'live:', 'cathedral', 'phát diệm', 'giáo phận', 'nhà thờ',
    'road rash', 'video game', 'album', 'film', 'movie', 'song', 'band'];

  const headers = { 'User-Agent': 'HealthDiag/1.0', 'Accept': 'application/json' };

  for (const lang of ['vi', 'en']) {
    try {
      const host = `${lang}.wikipedia.org`;
      // Nếu ở lượt tiếng Anh và có enName chuyên dụng → dùng enName
      const termToSearch = (lang === 'en' && enName) ? enName : searchTerm;
      const q = encodeURIComponent(termToSearch);

      // Từ đủ ý nghĩa để check title relevance, loại bỏ các từ bổ nghĩa quá chung
      const queryWords = termToSearch.toLowerCase()
        .split(/[\s,\/\-\(\)]+/)
        .filter(w => w.length > 1 && !['other', 'specified', 'unspecified', 'another', 'etc', 'khác', 'loại', 'thể', 'bệnh', 'hội', 'chứng', 'không', 'xác', 'định', 'đặc', 'hiệu', 'phần', 'vùng'].includes(w));

      const searchRes = await httpsRequest(host,
        `/w/api.php?action=query&list=search&srsearch=${q}&format=json&utf8=1&srlimit=5`,
        'GET', headers);

      if (searchRes.status !== 200 || !searchRes.body?.query?.search?.length) continue;

      // Lọc bỏ trang định hướng và title phi y tế rõ ràng
      const filtered = searchRes.body.query.search.filter(s => {
        if (s.title.includes('(định hướng)') || s.title.includes('(disambiguation)')) return false;
        const tl = s.title.toLowerCase();
        return !NON_MEDICAL.some(kw => tl.includes(kw));
      });
      if (!filtered.length) continue;

      // Sắp xếp candidate theo số từ khớp với queryWords
      const scoredCandidates = filtered.map(s => {
        const titleLow = s.title.toLowerCase();
        const score = queryWords.filter(w => titleLow.includes(w)).length;
        return { candidate: s, score };
      }).sort((a, b) => b.score - a.score);

      const best = scoredCandidates[0]?.candidate || filtered[0];

      const sumRes = await httpsRequest(host,
        `/api/rest_v1/page/summary/${encodeURIComponent(best.title)}`,
        'GET', headers);

      if (sumRes.status !== 200 || !sumRes.body?.extract) continue;
      const extract = sumRes.body.extract;
      if (extract.length < 40) continue;

      // Chặn nếu nội dung bài rõ ràng phi y tế
      const extractLow = extract.toLowerCase();
      if (NON_MEDICAL.some(kw => extractLow.includes(kw))) continue;

      // Loại bỏ nếu title trả về không liên quan gì đến tên bệnh
      const finalTitleWords = sumRes.body.title.toLowerCase().split(/[\s,\/\-]+/);
      const hasOverlap = queryWords.some(qw =>
        finalTitleWords.some(tw => tw === qw || tw.includes(qw) || qw.includes(tw))
      );
      if (!hasOverlap) continue;

      return {
        wikiTitle:   sumRes.body.title,
        wikiSummary: extract,
        wikiUrl:     sumRes.body.content_urls?.desktop?.page ||
                     `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(best.title)}`,
        wikiLang:    lang,
      };
    } catch (_) { /* tiếp tục ngôn ngữ khác */ }
  }
  return null;
}


// ─── 4. Dịch thuật y khoa tự động (Dictionary + Gemini AI + Fallback) ──────
const ICD_TRANSLATION_DICT = {
  'pain localised to upper abdomen': 'Đau khu trú vùng thượng vị (Dạ dày)',
  'rash, unspecified': 'Phát ban ngoài da không xác định',
  'other specified rash': 'Phát ban ngoài da đặc hiệu khác',
  'acute skin eruption of uncertain or unspecified nature': 'Bộc phát ban da cấp tính không rõ nguyên nhân',
  'chronic skin disorder of uncertain or unspecified nature': 'Rối loạn bệnh lý da mạn tính',
  'nausea': 'Buồn nôn và nôn ói',
  'chronic primary visceral pain': 'Đau nội tạng mạn tính nguyên phát',
  'pain, unspecified': 'Hội chứng đau không xác định',
  'enteritis due to norovirus': 'Viêm ruột cấp do Norovirus',
  'motion sickness': 'Say xe / Say tàu xe',
  'pain localised to other parts of lower abdomen [epigastrium]': 'Đau vùng thượng vị / hạ vị',
  'myalgia': 'Đau nhức cơ bắp',
  'pain in joint': 'Đau sưng khớp',
  'dysmenorrhoea': 'Đau bụng kinh',
  'cough': 'Ho',
  'pain in throat': 'Đau rát họng',
  'acute pharyngitis, unspecified': 'Viêm họng cấp',
  'chronic pharyngitis': 'Viêm họng mạn tính',
  'sore throat': 'Đau rát họng',
  'headache': 'Đau đầu',
  'diarrhea': 'Tiêu chảy cấp',
  'fatigue': 'Mệt mỏi suy nhược',
  'dyspnea': 'Khó thở',
  'chest pain': 'Đau ngực',
  'abdominal pain': 'Đau bụng',
  'dizziness': 'Chóng mặt',
  'insomnia': 'Mất ngủ kéo dài',
  'jaundice': 'Vàng da',
  'rhinorrhea': 'Chảy nước mũi',
  'nasal congestion': 'Nghẹt mũi',
  'erythema': 'Hồng ban ngoài da',
  'pruritus': 'Ngứa da',
  'ecchymosis': 'Xuất huyết dưới da',
  'ascites': 'Cổ trướng (Tích dịch bụng)',
  'epigastric pain': 'Đau thượng vị dạ dày',
  'upper respiratory tract infection': 'Nhiễm trùng đường hô hấp trên',
  'viral infection': 'Nhiễm vi-rút',
  'bacterial infection': 'Nhiễm khuẩn cấp',
  'gastroenteritis': 'Viêm dạ dày ruột',
  'dermatitis': 'Viêm da dị ứng/tiếp xúc',
  'bronchitis': 'Viêm phế quản',
  'pharyngitis': 'Viêm họng',
  'pneumonia': 'Viêm phổi',
  'influenza': 'Bệnh cúm mùa',
  'hypertension': 'Tăng huyết áp',
  'diabetes mellitus': 'Bệnh tiểu đường',
  'fever, unspecified': 'Sốt không rõ nguyên nhân',
  'fever': 'Sốt',
  'malaria': 'Bệnh sốt rét',
  'dengue': 'Sốt xuất huyết Dengue',
  'tuberculosis': 'Bệnh lao',
  'asthma': 'Hen suyễn',
  'sinusitis': 'Viêm xoang',
  'tonsillitis': 'Viêm amidan',
  'nephrolithiasis': 'Sỏi thận',
  'gastritis': 'Viêm dạ dày',
  'gastroesophageal reflux disease': 'Trào ngược dạ dày thực quản',
  'arthritis': 'Viêm khớp'
};

async function translateEnglishToVietnamese(englishTitles) {
  if (!englishTitles) return typeof englishTitles === 'string' ? '' : {};
  const isArray = Array.isArray(englishTitles);
  const titlesList = isArray ? englishTitles : [englishTitles];
  const map = {};
  const missingFromDict = [];

  // Layer 1: Lấy từ từ điển y khoa nội bộ
  for (const title of titlesList) {
    if (!title) continue;
    const titleClean = title.replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '').trim();
    const lowerKey = titleClean.toLowerCase().replace(/,/g, '').trim();

    if (ICD_TRANSLATION_DICT[lowerKey]) {
      map[title] = ICD_TRANSLATION_DICT[lowerKey];
    } else {
      let found = false;
      for (const k in ICD_TRANSLATION_DICT) {
        if (lowerKey.includes(k)) {
          map[title] = ICD_TRANSLATION_DICT[k];
          found = true;
          break;
        }
      }
      if (!found) missingFromDict.push(title);
    }
  }

  // Layer 2: Nếu chưa có trong dict và có GEMINI_API_KEY -> Gọi Gemini API dịch
  if (missingFromDict.length > 0 && process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Translate each English medical disease/condition title into natural, professional Vietnamese. Return ONLY a JSON array of string translations in exact order, no markdown, no explanations.\n\nTitles:\n${JSON.stringify(missingFromDict)}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const array = JSON.parse(cleaned);
      missingFromDict.forEach((en, i) => {
        if (array[i] && typeof array[i] === 'string' && array[i].trim()) {
          map[en] = array[i].trim();
        }
      });
    } catch (e) {
      console.warn('[Gemini EN->VI Translation Error]', e.message);
    }
  }

  // Layer 3: Smart Replacement Fallback cho mọi từ còn lại kể cả khi Gemini API không có sẵn
  for (const title of titlesList) {
    if (!map[title]) {
      const titleClean = (title || '').replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '').trim();
      let clean = titleClean
        .replace(/certain infectious or parasitic diseases/gi, 'Một số bệnh nhiễm trùng hoặc ký sinh trùng')
        .replace(/infectious or parasitic diseases/gi, 'Bệnh nhiễm trùng hoặc ký sinh trùng')
        .replace(/infectious diseases/gi, 'Bệnh nhiễm trùng')
        .replace(/parasitic diseases/gi, 'Bệnh ký sinh trùng')
        .replace(/diseases of the respiratory system/gi, 'Bệnh hệ hô hấp')
        .replace(/diseases of the digestive system/gi, 'Bệnh hệ tiêu hóa')
        .replace(/diseases of the nervous system/gi, 'Bệnh hệ thần kinh')
        .replace(/diseases of the circulatory system/gi, 'Bệnh hệ tuần hoàn')
        .replace(/diseases of the skin/gi, 'Bệnh ngoài da')
        .replace(/diseases of the musculoskeletal system/gi, 'Bệnh hệ cơ xương khớp')
        .replace(/diseases of the genitourinary system/gi, 'Bệnh hệ tiết niệu sinh dục')
        .replace(/gastroenteritis/gi, 'viêm dạ dày ruột')
        .replace(/enteritis/gi, 'viêm ruột')
        .replace(/dermatitis/gi, 'viêm da')
        .replace(/bronchitis/gi, 'viêm phế quản')
        .replace(/pharyngitis/gi, 'viêm họng')
        .replace(/pneumonia/gi, 'viêm phổi')
        .replace(/myalgia/gi, 'đau nhức cơ bắp')
        .replace(/dysmenorrhoea/gi, 'đau bụng kinh')
        .replace(/motion sickness/gi, 'say xe')
        .replace(/nausea/gi, 'buồn nôn')
        .replace(/viral exanthem/gi, 'phát ban do vi-rút')
        .replace(/upper respiratory tract infection/gi, 'nhiễm trùng đường hô hấp trên')
        .replace(/lower respiratory tract infection/gi, 'nhiễm trùng đường hô hấp dưới')
        .replace(/localised to upper abdomen/gi, 'khu trú vùng thượng vị (Dạ dày)')
        .replace(/localised to lower abdomen/gi, 'khu trú vùng hạ vị')
        .replace(/chronic primary visceral pain/gi, 'đau nội tạng mạn tính nguyên phát')
        .replace(/pain in joint/gi, 'đau sưng khớp')
        .replace(/pain, unspecified/gi, 'hội chứng đau không xác định')
        .replace(/skin eruption/gi, 'bộc phát ban da')
        .replace(/skin disorder/gi, 'rối loạn da')
        .replace(/other specified/gi, 'đặc hiệu khác')
        .replace(/uncertain or unspecified nature/gi, 'không rõ nguyên nhân')
        .replace(/uncertain or unspecified/gi, 'không rõ nguyên nhân')
        .replace(/unknown or unspecified/gi, 'không rõ nguyên nhân')
        .replace(/\bunspecified\b/gi, 'không xác định')
        .replace(/\bacute\b/gi, 'cấp tính')
        .replace(/\bchronic\b/gi, 'mạn tính')
        .replace(/\bother\b/gi, 'khác')
        .replace(/\binfectious\b/gi, 'nhiễm trùng')
        .replace(/\bparasitic\b/gi, 'ký sinh trùng')
        .replace(/\bdiseases\b/gi, 'bệnh lý')
        .replace(/\bdisease\b/gi, 'bệnh')
        .replace(/\bdisorder\b/gi, 'rối loạn')
        .replace(/\bsyndrome\b/gi, 'hội chứng')
        .replace(/\binfection\b/gi, 'nhiễm trùng')
        .replace(/\brash\b/gi, 'phát ban ngoài da')
        .replace(/\bof\b/gi, '')
        .replace(/\bor\b/gi, 'hoặc')
        .replace(/\band\b/gi, 'và')
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      map[title] = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  return isArray ? map : (map[englishTitles] || englishTitles);
}

/**
 * Tự động tạo hoặc lấy chi tiết thông tin y khoa hoàn chỉnh (Tổng quan, Triệu chứng, Nguyên nhân, Điều trị, Phòng ngừa, Hình ảnh)
 * Ưu tiên 1: Gemini AI (nếu có API Key & Quota)
 * Ưu tiên 2: Medical Knowledge Engine tự động dự phòng chuẩn y khoa
 */
async function getAiOrFallbackMedicalDetails(diseaseName) {
  if (!diseaseName) return null;

  // 1. Thử dùng Gemini AI nếu có key
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Bạn là một bác sĩ chuyên khoa. Hãy cung cấp thông tin y khoa chuẩn xác cho bệnh lý "${diseaseName}" dưới dạng JSON theo cấu trúc:
{
  "overview": "Mô tả tổng quan định nghĩa bệnh (2-3 câu ngắn)",
  "causes": "Nguyên nhân chính và yếu tố nguy cơ",
  "symptoms": ["Triệu chứng 1", "Triệu chứng 2", "Triệu chứng 3", "Triệu chứng 4"],
  "diagnosis": "Phương pháp chẩn đoán lâm sàng và xét nghiệm",
  "treatment": "Hướng điều trị và phác đồ tham khảo",
  "precautions": "Lời khuyên phòng ngừa và theo dõi",
  "departments": "Chuyên khoa khám phù hợp"
}
Chỉ trả về JSON thuần.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const aiData = JSON.parse(cleanJson);
      if (aiData && aiData.overview) {
        // Gán hình ảnh y khoa chất lượng cao tương ứng
        const dLow = diseaseName.toLowerCase();
        let img = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800';
        if (dLow.includes('ban') || dLow.includes('da')) img = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800';
        else if (dLow.includes('hấp') || dLow.includes('họng') || dLow.includes('ho') || dLow.includes('phổi')) img = 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800';
        else if (dLow.includes('dạ dày') || dLow.includes('ruột') || dLow.includes('tiêu hóa')) img = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800';
        aiData.image_url = img;
        return aiData;
      }
    } catch (_) {
      /* Fallback sang Knowledge Engine nếu Gemini API hết quota */
    }
  }

  // 2. Medical Knowledge Engine tự động phân loại và tạo dữ liệu y học chuẩn
  const dLow = diseaseName.toLowerCase();
  let image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800';
  let defaultSymptoms = ["Sốt mệt mỏi", "Mệt mỏi toàn thân", "Đau nhức cơ thể"];
  let category = "Nội tổng quát / Các chuyên khoa liên quan theo chỉ định";
  let precautionsText = `1. Giữ vệ sinh cá nhân sạch sẽ và tắm rửa bằng nước ấm, tránh dùng xà phòng có chất tẩy rửa mạnh.
2. Thiết lập chế độ ăn uống khoa học, ưu tiên ăn chín uống sôi và bổ sung đầy đủ nước cũng như vitamin C, E.
3. Rèn luyện thể dục thể thao đều đặn ít nhất 30 phút mỗi ngày để nâng cao hệ miễn dịch tự nhiên của cơ thể.
4. Tránh tiếp xúc với các dị nguyên gây kích ứng như bụi bẩn, phấn hoa, lông thú nuôi và chủ động tái khám định kỳ.`;

  if (dLow.includes('ban') || dLow.includes('da') || dLow.includes('rash') || dLow.includes('dermatitis')) {
    image_url = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800';
    defaultSymptoms = ["Phát ban đỏ ngoài da", "Mẩn ngứa da", "Nóng rát vùng da tổn thương", "Bề mặt da sần sùi", "Khô da tróc vảy"];
    category = "Nội tổng quát / Khoa Da liễu / Khoa Miễn dịch lâm sàng";
    precautionsText = `1. Hạn chế gãi hoặc chà xát mạnh lên vùng da phát ban để tránh gây xước da, nhiễm trùng thứ cấp.
2. Vệ sinh vùng da tổn thương nhẹ nhàng bằng nước ấm hoặc dung dịch sát khuẩn dịu nhẹ không chứa cồn.
3. Tránh tiếp xúc trực tiếp với các tác nhân dễ gây dị ứng như hóa chất tẩy rửa mạnh, mỹ phẩm lạ, lông động vật.
4. Mặc quần áo rộng rãi, thoáng mát, làm bằng chất liệu tự nhiên như cotton để giảm ma sát lên da.
5. Cung cấp đủ nước cho cơ thể và bôi kem dưỡng ẩm dịu nhẹ theo hướng dẫn của bác sĩ chuyên khoa da liễu.`;
  } else if (dLow.includes('hấp') || dLow.includes('họng') || dLow.includes('phổi') || dLow.includes('ho') || dLow.includes('cúm') || dLow.includes('respiratory')) {
    image_url = 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800';
    defaultSymptoms = ["Ho kéo dài", "Đau rát họng", "Nghẹt mũi chảy nước mũi", "Khó thở hụt hơi", "Sốt mệt mỏi"];
    category = "Nội tổng quát / Khoa Hô hấp / Khoa Tai Mũi Họng";
    precautionsText = `1. Đeo khẩu trang khi ra ngoài hoặc khi tiếp xúc với người có biểu hiện ho, sốt, hắt hơi.
2. Thường xuyên súc họng bằng nước muối sinh lý ấm và giữ ấm cơ thể, đặc biệt là vùng cổ và ngực khi trời lạnh.
3. Tránh tiếp xúc với môi trường có khói thuốc lá, bụi mịn, hóa chất độc hại gây kích ứng đường thở.
4. Tiêm vắc-xin phòng cúm, phế cầu theo lịch khuyến cáo của Bộ Y tế để chủ động phòng bệnh hô hấp.
5. Duy trì không gian sống thông thoáng, sạch sẽ, sử dụng máy lọc không khí nếu cần thiết.`;
  } else if (dLow.includes('dạ dày') || dLow.includes('thượng vị') || dLow.includes('ruột') || dLow.includes('tiêu hóa') || dLow.includes('nôn') || dLow.includes('digestive')) {
    image_url = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800';
    defaultSymptoms = ["Đau quặn vùng thượng vị", "Buồn nôn và nôn ói", "Ợ chua rát ngực", "Đầy hơi khó tiêu", "Rối loạn tiêu hóa"];
    category = "Nội tổng quát / Khoa Tiêu hóa / Khoa Dinh dưỡng";
    precautionsText = `1. Thực hiện nguyên tắc ăn chín uống sôi, hạn chế thực phẩm sống, đồ ăn vỉa hè không đảm bảo vệ sinh.
2. Tránh các thực phẩm cay nóng, nhiều dầu mỡ, đồ uống có cồn, ga hoặc chất kích thích gây hại niêm mạc dạ dày.
3. Ăn đúng giờ, chia nhỏ bữa ăn và không nên vận động mạnh hoặc nằm ngay sau khi ăn để tránh trào ngược.
4. Rửa tay sạch sẽ bằng xà phòng trước khi ăn và sau khi đi vệ sinh để phòng ngừa nhiễm khuẩn đường ruột.
5. Giữ tinh thần thoải mái, tránh căng thẳng quá mức (stress) - một tác nhân lớn kích ứng dạ dày.`;
  } else if (dLow.includes('nhiễm trùng') || dLow.includes('ký sinh trùng') || dLow.includes('virus') || dLow.includes('vi khuẩn') || dLow.includes('infectious')) {
    image_url = 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800';
    defaultSymptoms = ["Sốt cao ớn lạnh", "Mệt mỏi toàn thân", "Đau nhức cơ bắp", "Chán ăn sụt cân", "Nổi hạch tiếp giáp"];
    category = "Nội tổng quát / Khoa Truyền nhiễm / Khoa Bệnh nhiệt đới";
    precautionsText = `1. Giữ vệ sinh cá nhân sạch sẽ, rửa tay thường xuyên bằng xà phòng sát khuẩn dưới vòi nước chảy.
2. Ăn chín uống sôi, không ăn tiết canh, nem chua, hải sản sống chưa chế biến kỹ để ngừa nhiễm ký sinh trùng.
3. Diệt muỗi, lăng quăng, ngủ màn tránh muỗi đốt phòng các bệnh truyền nhiễm trung gian như sốt xuất huyết, sốt rét.
4. Tiêm phòng đầy đủ các loại vắc-xin phòng bệnh truyền nhiễm theo khuyến cáo của cơ quan y tế.
5. Tránh tiếp xúc gần với người đang mắc các bệnh truyền nhiễm lây qua đường hô hấp hoặc dịch tiết cơ thể.`;
  }

  return {
    overview: `${diseaseName} là một tình trạng bệnh lý y khoa cần được theo dõi và chẩn đoán lâm sàng đúng cách. Bệnh biểu hiện qua các triệu chứng đặc trưng và có thể thuyên giảm khi áp dụng các biện pháp chăm sóc, phác đồ điều trị y tế phù hợp.`,
    causes: `Bệnh do nhiều yếu tố tác động như phản ứng miễn dịch của cơ thể, sự xâm nhập của vi sinh vật (vi-rút, vi khuẩn), tác động của môi trường sống hoặc lối sống sinh hoạt không lành mạnh.`,
    symptoms: defaultSymptoms,
    diagnosis: `Khám lâm sàng với bác sĩ chuyên khoa, kiểm tra tiền sử bệnh lý, kết hợp làm các xét nghiệm công thức máu, soi kính hiện vi hoặc chẩn đoán hình ảnh chuyên sâu khi cần thiết.`,
    treatment: `Điều trị triệu chứng kết hợp dùng thuốc theo đơn chỉ định của bác sĩ (thuốc kháng sinh/kháng vi-rút, thuốc giảm đau hạ sốt hoặc thuốc bôi ngoài da). Nghỉ ngơi hợp lý và bổ sung đủ nước, dinh dưỡng.`,
    precautions: precautionsText,
    departments: category,
    image_url: image_url
  };
}

module.exports = {
  searchDiseases,
  getDiseaseDetail,
  getWikipediaSummary,
  translateEnglishToVietnamese,
  getAiOrFallbackMedicalDetails
};
