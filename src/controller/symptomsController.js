const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sequelize } = require('../config/database');
const Symptom = require('../model/symptoms');
const Disease = require('../model/diseases');
const DiseaseSymptom = require('../model/disease_symptoms');
const History = require('../model/history');
const { searchDiseases, translateEnglishToVietnamese } = require('../config/icdService');
const { Op } = require('sequelize');

// ─── Helper: Biên dịch VN → English (ưu tiên Gemini, fallback enMap) ──────────
async function translateSymptomsToEnglish(symptomNames) {
  const enMap = {
    'sốt cao': 'fever', 'ho khan': 'cough', 'đau họng': 'sore throat',
    'phát ban': 'rash', 'đau thượng vị': 'epigastric pain',
    'buồn nôn': 'nausea', 'khó thở': 'dyspnea', 'đau đầu': 'headache',
    'mệt mỏi': 'fatigue', 'ớn lạnh': 'chills', 'vã mồ hôi': 'sweating',
    'chóng mặt': 'dizziness', 'đau ngực': 'chest pain', 'hồi hộp': 'palpitations',
    'phù': 'edema', 'tê bì': 'numbness', 'tiêu chảy': 'diarrhea',
    'táo bón': 'constipation', 'đau bụng': 'abdominal pain', 'chán ăn': 'anorexia',
    'sụt cân': 'weight loss', 'khát nước': 'thirst', 'tiểu nhiều': 'polyuria',
    'đau khớp': 'joint pain', 'cứng khớp sáng': 'morning stiffness',
    'đau cơ': 'myalgia', 'đau lưng': 'back pain', 'đau nhức xương': 'bone pain',
    'ho có đờm': 'productive cough', 'khò khè': 'wheezing',
    'nghẹt mũi': 'nasal congestion', 'chảy nước mũi': 'rhinorrhea',
    'mất ngủ': 'insomnia', 'ù tai': 'tinnitus', 'vàng da': 'jaundice',
    'nước tiểu sẫm': 'dark urine', 'ngứa da': 'pruritus', 'phát ban đỏ': 'erythema',
    'tăng cảm xúc': 'emotional lability', 'rụng tóc': 'hair loss',
    'da khô': 'dry skin', 'tăng cân': 'weight gain', 'khô mắt': 'dry eyes',
    'tiểu buốt': 'dysuria', 'đau hạ sườn phải': 'right upper quadrant pain',
    'cổ trướng': 'ascites', 'xuất huyết dưới da': 'ecchymosis',
    'đau sau xương ức': 'retrosternal pain', 'ợ chua': 'heartburn', 'mờ mắt': 'blurred vision',
  };

  const unknowns = symptomNames.filter(n => !enMap[n.toLowerCase()]);
  if (unknowns.length === 0 || !process.env.GEMINI_API_KEY) {
    return symptomNames.map(n => enMap[n.toLowerCase()] || n).join(' ');
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Translate each Vietnamese medical symptom below to English medical term (ICD-compatible). Return ONLY a comma-separated list, no explanations.\n\nSymptoms: ${unknowns.join(', ')}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const translated = text.split(',').map(s => s.trim()).filter(Boolean);
    const map = {};
    unknowns.forEach((vn, i) => { map[vn] = translated[i] || vn; });
    return symptomNames.map(n => enMap[n.toLowerCase()] || map[n] || n).join(' ');
  } catch {
    return symptomNames.map(n => enMap[n.toLowerCase()] || n).join(' ');
  }
}

// ─── Controller Logic ─────────────────────────────────────────────────────────

class SymptomsController {

  // ─── 1. Chẩn đoán: local DB + WHO ICD-11 ─────────────────────────────
  async symptomsCheck(req, res) {
    const { symptoms } = req.body;
    if (!symptoms) {
      return res.status(400).json({ message: "Vui lòng nhập triệu chứng!", data: [], count: 0 });
    }

    const symptomsText = Array.isArray(symptoms) ? symptoms.join(' ') : symptoms;
    const allSymptomsInDb = await Symptom.findAll({ attributes: ['id', 'name'] });
    const matchedNames = [];

    const keywordMap = {
      'sốt cao': ['sốt', 'sot', 'nóng'],
      'ho khan': ['ho', 'ho khan', 'ho có đờm'],
      'đau họng': ['đau họng', 'rát họng', 'rát cổ', 'nuốt vướng'],
      'phát ban': ['phát ban', 'nổi mẩn', 'nốt đỏ', 'mẩn đỏ', 'ngứa da'],
      'đau thượng vị': ['thượng vị', 'đau dạ dày', 'đau bao tử', 'đau bụng'],
      'buồn nôn': ['nôn', 'mắc ói', 'buồn nôn', 'nôn mửa'],
      'khó thở': ['khó thở', 'hụt hơi', 'thở dốc', 'ngạt thở'],
      'đau đầu': ['đau đầu', 'nhức đầu', 'đau nửa đầu']
    };

    const inputText = symptomsText.toLowerCase();
    for (const sym of allSymptomsInDb) {
      const sn = sym.name.toLowerCase();
      const kws = keywordMap[sn] || [sn];
      if (inputText.includes(sn) || sn.includes(inputText) || kws.some(kw => inputText.includes(kw))) {
        if (!matchedNames.includes(sym.name)) matchedNames.push(sym.name);
      }
    }

    if (matchedNames.length === 0) {
      return res.json({
        message: "Không thể nhận diện triệu chứng. Nhập rõ hơn (vd: sốt cao, ho khan, đau họng...)",
        data: [], count: 0
      });
    }

    // A) TRA CỨU LOCAL: tính điểm dựa trên disease_symptoms
    const matchedSymptomRows = await Symptom.findAll({
      where: { name: { [Op.in]: matchedNames } },
      attributes: ['id', 'name'],
    });
    const matchedSymptomIds = matchedSymptomRows.map(s => s.id);

    let localResults = [];
    if (matchedSymptomIds.length > 0) {
      const joined = matchedSymptomIds.join(',');
      const [matchedRows] = await sequelize.query(`
        SELECT ds.disease_id, ds.symptom_id, s.name AS symptom_name, ds.weight
        FROM disease_symptoms ds
        JOIN symptoms s ON ds.symptom_id = s.id
        WHERE ds.symptom_id IN (${joined})
      `);

      const diseaseMatchedMap = {};
      const matchMap = {};
      for (const m of matchedRows) {
        if (!diseaseMatchedMap[m.disease_id]) diseaseMatchedMap[m.disease_id] = [];
        if (!diseaseMatchedMap[m.disease_id].includes(m.symptom_name)) {
          diseaseMatchedMap[m.disease_id].push(m.symptom_name);
        }
        matchMap[m.disease_id] = (matchMap[m.disease_id] || 0) + (parseFloat(m.weight) || 0);
      }

      const diseaseIds = matchedRows.map(r => r.disease_id);
      if (diseaseIds.length === 0) diseaseIds.push(0);
      const idsJoined = [...new Set(diseaseIds)].join(',');

      const [totalRows] = await sequelize.query(`
        SELECT disease_id, SUM(weight) AS total_weight
        FROM disease_symptoms
        WHERE disease_id IN (${idsJoined})
        GROUP BY disease_id
      `);

      const totalMap = {};
      for (const t of totalRows) totalMap[t.disease_id] = parseFloat(t.total_weight) || 1;

      const diseases = await Disease.findAll({
        where: { id: { [Op.in]: [...new Set(diseaseIds)] } },
        attributes: ['id', 'name'],
      });

      localResults = diseases
        .map(d => ({
          id: d.id,
          name: d.name,
          name_vi: d.name,
          icdCode: '',
          score: Math.round(((matchMap[d.id] || 0) / (totalMap[d.id] || 1)) * 100),
          matched: diseaseMatchedMap[d.id] || matchedNames,
          source: 'local',
        }))
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
    }

    // B) TRA CỨU WHO ICD-11 (dịch động qua Gemini)
    let icdResults = [];
    try {
      const enQuery = await translateSymptomsToEnglish(matchedNames);
      let results = await searchDiseases(enQuery, 'en');
      const seen = new Set();
      const rawIcd = (results || [])
        .filter(r => r.title && !seen.has(r.icdId) && seen.add(r.icdId))
        .slice(0, 10);

      const englishTitles = rawIcd.map(r => r.title);
      const viTranslationMap = await translateEnglishToVietnamese(englishTitles);

      icdResults = rawIcd.map(r => {
        const titleVi = viTranslationMap[r.title] || r.title;
        return {
          id: r.icdId,
          name: titleVi,
          name_vi: titleVi,
          name_en: r.title,
          icdCode: r.code || '',
          icdUrl: r.icdUrl || '',
          score: 70, // Mức độ tương thích chuẩn ICD
          matched: matchedNames,
          source: 'icd',
        };
      });
    } catch (e) {
      console.warn(`[ICD] Lỗi: ${e.message}`);
    }

    // C) KẾT HỢP: local lên đầu, ICD bổ sung
    const existingIds = new Set(localResults.map(r => r.icdCode || r.id));
    const combined = [
      ...localResults,
      ...icdResults.filter(r => !existingIds.has(r.icdCode || r.id)),
    ];

    // Lưu lịch sử
    if (req.user && req.user.userId && combined.length > 0) {
      History.create({
        user_id: req.user.userId, type: "predict",
        query_text: symptomsText, disease_name: combined[0].name,
        input_symptoms: matchedNames
      }).catch(() => {});
    }

    const hasIcd = icdResults.length > 0;
    return res.json({
      message: hasIcd
        ? `Tìm thấy ${combined.length} bệnh (${localResults.length} từ cơ sở dữ liệu, ${icdResults.length} từ WHO ICD-11)`
        : `Tìm thấy ${combined.length} bệnh từ cơ sở dữ liệu`,
      count: combined.length,
      data: combined,
    });
  }

  // ─── 2. Lịch sử chẩn đoán ─────────────────────────────────────────────
  async getHistory(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
      }

      const histories = await History.findAll({
        where: { user_id: req.user.userId, type: 'predict' },
        order: [['created_at', 'DESC']],
        limit: 20
      });

      return res.json({
        message: "Lịch sử chẩn đoán",
        count: histories.length,
        data: histories.map(h => ({
          _id: h.id,
          diseaseName: h.disease_name,
          createdAt: h.created_at,
          inputSymptoms: h.input_symptoms,
          queryText: h.query_text
        }))
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy lịch sử chẩn đoán" });
    }
  }

  async savePredictHistory(req, res) {
    try {
      const { inputSymptoms, result, createdAt } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
      }
      let diseaseName = "Không xác định";
      if (Array.isArray(result) && result.length > 0) {
        diseaseName = result[0].name || "Không xác định";
      } else if (result && result.name) {
        diseaseName = result.name;
      }
      await History.create({
        user_id: req.user.userId,
        type: "predict",
        query_text: Array.isArray(inputSymptoms) ? inputSymptoms.join(', ') : String(inputSymptoms || ""),
        disease_name: diseaseName,
        input_symptoms: inputSymptoms || [],
        created_at: createdAt || new Date()
      });
      return res.status(201).json({ ok: true, message: "Lưu lịch sử thành công" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lưu lịch sử chẩn đoán" });
    }
  }

  async getAllSymptoms(req, res) {
    try {
      const symptoms = await Symptom.findAll({
        attributes: ['id', 'name', 'description']
      });
      return res.json({ ok: true, data: symptoms });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách triệu chứng" });
    }
  }
}

module.exports = new SymptomsController();
