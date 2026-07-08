/**
 * newsService.js
 *
 * Hybrid news fetcher:
 *  - PRIMARY:  RSS trực tiếp qua rss-parser
 *  - FALLBACK: rss2json.com proxy (khi RSS bị chặn bởi server)
 *  - OPTIONAL: NewsData.io API (nếu có NEWSDATA_API_KEY)
 *
 * Sources: VnExpress Sức khỏe, Sức khỏe & Đời sống, Tuổi Trẻ, Báo Mới
 */

const https   = require('https');
const http    = require('http');
const News    = require('../model/news');

// ─── RSS_SOURCES ───────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  { url: 'https://vnexpress.net/rss/suc-khoe.rss',              source: 'VnExpress Sức khỏe',   category: 'sức khỏe' },
  { url: 'https://suckhoedoisong.vn/rss/suc-khoe-doi-song.rss', source: 'Sức khỏe & Đời sống', category: 'sức khỏe' },
  { url: 'https://tuoitre.vn/rss/suc-khoe.rss',                 source: 'Tuổi Trẻ Sức khỏe',   category: 'sức khỏe' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanText(text, maxLen = 300) {
  if (!text) return null;
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ')
    .trim().slice(0, maxLen);
}

function extractImageFromHtml(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function httpsGetRaw(url, followRedirects = 3) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HealthDiagBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    }, (res) => {
      // Follow redirect
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && followRedirects > 0) {
        return resolve(httpsGetRaw(res.headers.location, followRedirects - 1));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function httpsGetJson(url) {
  return httpsGetRaw(url).then(r => {
    try { return { status: r.status, body: JSON.parse(r.body) }; }
    catch (e) { return { status: r.status, body: r.body }; }
  });
}

// ─── Parse RSS XML thủ công (không dùng rss-parser package) ──────────────────
function parseRssXml(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
             || block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : null;
    };
    const getAttr = (tag, attr) => {
      const m = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i'));
      return m ? m[1] : null;
    };
    const title = get('title');
    const link  = get('link') || get('guid');
    if (!title || !link) continue;
    const imageUrl = getAttr('enclosure', 'url')
                  || getAttr('media:content', 'url')
                  || extractImageFromHtml(get('description') || get('content:encoded'));
    items.push({
      title:       cleanText(title, 300),
      description: cleanText(get('description') || get('content:encoded')),
      url:         link.trim(),
      image_url:   imageUrl,
      published_at: get('pubDate') ? new Date(get('pubDate')) : new Date(),
    });
  }
  return items;
}

// ─── Fetch RSS trực tiếp ──────────────────────────────────────────────────────
async function fetchRssDirect(src) {
  try {
    const { status, body } = await httpsGetRaw(src.url);
    if (status !== 200 || !body.includes('<item>')) return [];
    const items = parseRssXml(body);
    console.log(`[RSS-Direct] ${src.source}: ${items.length} bài`);
    return items.map(i => ({ ...i, source: src.source, category: src.category }));
  } catch (err) {
    console.warn(`[RSS-Direct] ${src.source} lỗi: ${err.message}`);
    return [];
  }
}

// ─── Fetch qua rss2json proxy (fallback) ──────────────────────────────────────
async function fetchRssViaProxy(src) {
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}&count=20`;
    const { status, body } = await httpsGetJson(proxyUrl);
    if (status !== 200 || body?.status !== 'ok' || !Array.isArray(body.items)) return [];
    const items = body.items.map(item => ({
      title:       cleanText(item.title, 300),
      description: cleanText(item.description || item.content),
      url:         item.link || item.guid,
      image_url:   item.enclosure || item.thumbnail || extractImageFromHtml(item.content) || null,
      source:      src.source,
      category:    src.category,
      published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
    })).filter(i => i.title && i.url);
    console.log(`[RSS-Proxy] ${src.source}: ${items.length} bài`);
    return items;
  } catch (err) {
    console.warn(`[RSS-Proxy] ${src.source} lỗi: ${err.message}`);
    return [];
  }
}

// ─── Save to DB ────────────────────────────────────────────────────────────────
async function saveItems(items) {
  let total = 0;
  for (const item of items) {
    if (!item.title || !item.url) continue;
    try {
      const [, created] = await News.findOrCreate({
        where: { url: item.url },
        defaults: item,
      });
      if (created) total++;
    } catch (_) {}
  }
  return total;
}

// ─── NewsData.io (optional) ───────────────────────────────────────────────────
async function fetchFromNewsData() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return 0;
  let total = 0;
  for (const category of ['health']) {
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&category=${category}&language=vi&country=vn&size=20`;
      const { status, body } = await httpsGetJson(url);
      if (status !== 200 || !body?.results) continue;
      const items = body.results
        .filter(a => a.title && a.link)
        .map(a => ({
          title:       a.title,
          description: cleanText(a.description),
          url:         a.link,
          image_url:   a.image_url || null,
          source:      a.source_id || 'NewsData',
          category:    'sức khỏe',
          published_at: a.pubDate ? new Date(a.pubDate) : new Date(),
        }));
      total += await saveItems(items);
    } catch (err) {
      console.warn(`[NewsData] lỗi: ${err.message}`);
    }
  }
  return total;
}

// ─── Main export ──────────────────────────────────────────────────────────────
async function fetchAndSaveNews() {
  console.log('[News] Bắt đầu cập nhật tin tức y tế...');
  let total = 0;

  for (const src of RSS_SOURCES) {
    // Thử direct trước, nếu không có bài thì dùng proxy
    let items = await fetchRssDirect(src);
    if (items.length === 0) {
      console.log(`[News] ${src.source}: thử proxy...`);
      items = await fetchRssViaProxy(src);
    }
    total += await saveItems(items);
  }

  // NewsData.io (nếu có API key)
  total += await fetchFromNewsData();

  console.log(`[News] Hoàn thành: +${total} bài mới.`);
  return total;
}

module.exports = { fetchAndSaveNews };
