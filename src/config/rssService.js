/**
 * rssService.js
 * Fetch RSS feeds từ các nguồn báo y tế tiếng Việt uy tín,
 * parse và lưu vào DB (bảng news). Chạy ngay khi khởi động + mỗi 6 giờ.
 */

const Parser = require('rss-parser');
const cron = require('node-cron');
const News = require('../model/news');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HealthDiagBot/1.0)',
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
    ],
  },
});

// Danh sách nguồn RSS y tế tiếng Việt
const RSS_SOURCES = [
  {
    url: 'https://vnexpress.net/rss/suc-khoe.rss',
    source: 'VnExpress Sức khỏe',
    category: 'sức khỏe',
  },
  {
    url: 'https://suckhoedoisong.vn/rss/suc-khoe-doi-song.rss',
    source: 'Sức khỏe & Đời sống',
    category: 'sức khỏe',
  },
  {
    url: 'https://tuoitre.vn/rss/suc-khoe.rss',
    source: 'Tuổi Trẻ Sức khỏe',
    category: 'sức khỏe',
  },
  {
    url: 'https://www.nguoiduatin.vn/rss/suc-khoe.rss',
    source: 'Người đưa tin Sức khỏe',
    category: 'sức khỏe',
  },
];

/**
 * Lấy ảnh từ item RSS (thử nhiều field khác nhau)
 */
function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.media?.['$']?.url) return item.media['$'].url;

  // Tìm thẻ <img> trong content hoặc description
  const html = item['content:encoded'] || item.content || item.description || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

  return null;
}

/**
 * Strip HTML tags và truncate description
 */
function cleanDescription(text, maxLen = 200) {
  if (!text) return null;
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Fetch 1 nguồn RSS và lưu vào DB
 */
async function fetchSource({ url, source, category }) {
  try {
    const feed = await parser.parseURL(url);
    let savedCount = 0;

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      const imageUrl = extractImage(item);
      const description = cleanDescription(item.contentSnippet || item.description);
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      try {
        // upsert: bỏ qua nếu URL đã tồn tại (unique constraint)
        await News.findOrCreate({
          where: { url: item.link },
          defaults: {
            title: item.title.trim(),
            description,
            url: item.link,
            image_url: imageUrl,
            source,
            category,
            published_at: publishedAt,
          },
        });
        savedCount++;
      } catch (dupErr) {
        // Bỏ qua duplicate
      }
    }

    console.log(`[RSS] ${source}: +${savedCount} bài mới`);
  } catch (err) {
    console.warn(`[RSS] Lỗi fetch ${source} (${url}): ${err.message}`);
  }
}

/**
 * Fetch tất cả nguồn song song
 */
async function fetchAllSources() {
  console.log('[RSS] Bắt đầu cập nhật tin tức y tế...');
  await Promise.allSettled(RSS_SOURCES.map(fetchSource));
  console.log('[RSS] Cập nhật xong.');
}

/**
 * Khởi động: fetch ngay lần đầu rồi đặt cron mỗi 6 giờ
 */
function startRssScheduler() {
  // Fetch ngay khi server khởi động
  fetchAllSources().catch(console.error);

  // Cron: mỗi 6 giờ (0 */6 * * *)
  cron.schedule('0 */6 * * *', () => {
    fetchAllSources().catch(console.error);
  });

  console.log('[RSS] Scheduler đã khởi động — cập nhật mỗi 6 giờ.');
}

module.exports = { startRssScheduler, fetchAllSources };
