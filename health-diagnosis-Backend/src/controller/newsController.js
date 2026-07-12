const News = require('../model/news');
const { fetchAndSaveNews } = require('../config/newsService');

class NewsController {
  async getNews(req, res) {
    try {
      const { category, limit = 20, offset = 0 } = req.query;
      const where = {};
      if (category) where.category = category;

      const news = await News.findAll({
        where,
        order: [['published_at', 'DESC']],
        limit: Math.min(parseInt(limit) || 20, 50),
        offset: parseInt(offset) || 0,
      });

      // Nếu không có bài nào trong DB, trigger fetch nền (non-blocking)
      if (news.length === 0) {
        console.log('[News] DB trống, trigger fetch nền...');
        fetchAndSaveNews().catch(err => console.error('[News] Background fetch error:', err));
        return res.status(200).json({ message: "Đang tải tin tức, vui lòng thử lại sau", articles: [] });
      }

      return res.json({
        message: 'Danh sách tin tức',
        count: news.length,
        data: news.map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          url: n.url,
          image_url: n.image_url,
          source: n.source,
          category: n.category,
          published_at: n.published_at,
        })),
      });
    } catch (err) {
      console.error('[News] Lỗi:', err);
      return res.status(500).json({ message: 'Lỗi lấy tin tức' });
    }
  }

  // Force refresh bài báo ngay lập tức
  async refreshNews(req, res) {
    try {
      console.log('[News] Force refresh được yêu cầu...');
      const count = await fetchAndSaveNews();
      return res.json({ ok: true, message: `Đã cập nhật +${count} bài mới`, newArticles: count });
    } catch (err) {
      console.error('[News] Refresh lỗi:', err);
      return res.status(500).json({ ok: false, message: 'Lỗi khi refresh tin tức' });
    }
  }
}

module.exports = new NewsController();
