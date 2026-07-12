/**
 * ICD Disease Controller
 * Cung cấp API tìm kiếm và lấy chi tiết bệnh từ WHO ICD-11,
 * kết hợp Wikipedia tiếng Việt để làm phong phú thông tin.
 */

const { searchDiseases, getDiseaseDetail, getWikipediaSummary } = require('../config/icdService');

class IcdController {

  /**
   * GET /api/icd/search?q=influenza
   * Tìm kiếm bệnh theo từ khoá (tiếng Anh hoặc tiếng Việt phiên âm)
   */
  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: 'Vui lòng nhập từ khoá tìm kiếm (ít nhất 2 ký tự).' });
      }

      const results = await searchDiseases(q.trim());

      return res.json({
        ok: true,
        count: results.length,
        data: results,
      });
    } catch (err) {
      console.error('[ICD Search]', err.message);
      return res.status(500).json({ message: 'Lỗi khi tìm kiếm bệnh từ WHO ICD-11' });
    }
  }

  /**
   * GET /api/icd/detail/:icdId
   * Lấy chi tiết bệnh từ WHO ICD-11 + Wikipedia tiếng Việt
   * Ví dụ: GET /api/icd/detail/1235618695
   */
  async detail(req, res) {
    try {
      const { icdId } = req.params;
      if (!icdId) {
        return res.status(400).json({ message: 'Thiếu ICD entity ID.' });
      }

      // Lấy chi tiết từ WHO ICD-11 song song với Wikipedia
      const [icdDetail, wikiData] = await Promise.allSettled([
        getDiseaseDetail(icdId, 'en'),
        getDiseaseDetail(icdId, 'en').then(d => getWikipediaSummary(d.title)),
      ]);

      const detail = icdDetail.status === 'fulfilled' ? icdDetail.value : null;
      const wiki   = wikiData.status   === 'fulfilled' ? wikiData.value   : null;

      if (!detail) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin bệnh với ID: ' + icdId });
      }

      // Ghép dữ liệu ICD-11 + Wikipedia
      const response = {
        icdId:      detail.icdId,
        icdCode:    detail.code,
        icdUrl:     detail.icdUrl,
        name:       detail.title,
        // Nếu có Wikipedia tiếng Việt thì dùng, không thì dùng definition của WHO
        overview:   wiki?.wikiSummary || detail.definition || 'Chưa có mô tả.',
        definition: detail.definition,
        inclusions: detail.inclusions,
        exclusions: detail.exclusions,
        indexTerms: detail.indexTerms,
        // Wikipedia metadata
        wikipedia: wiki ? {
          title:   wiki.wikiTitle,
          url:     wiki.wikiUrl,
          lang:    wiki.wikiLang,
          summary: wiki.wikiSummary,
        } : null,
      };

      return res.json({ ok: true, data: response });
    } catch (err) {
      console.error('[ICD Detail]', err.message);
      return res.status(500).json({ message: 'Lỗi khi lấy chi tiết bệnh' });
    }
  }

  /**
   * GET /api/icd/enrich/:diseaseName
   * Làm giàu thông tin bệnh sẵn có trong DB bằng Wikipedia tiếng Việt
   * Dùng khi hiển thị DiseaseDetail từ DB nội bộ và muốn thêm mô tả wiki
   */
  async enrich(req, res) {
    try {
      const { diseaseName } = req.params;
      if (!diseaseName) {
        return res.status(400).json({ message: 'Thiếu tên bệnh.' });
      }

      // Tìm trên Wikipedia bằng tên bệnh
      const wikiData = await getWikipediaSummary(decodeURIComponent(diseaseName));

      return res.json({
        ok: true,
        data: wikiData || { wikiSummary: null, wikiUrl: null },
      });
    } catch (err) {
      console.error('[ICD Enrich]', err.message);
      return res.status(500).json({ message: 'Lỗi khi làm giàu thông tin bệnh: ' + err.message });
    }
  }
}

module.exports = new IcdController();
