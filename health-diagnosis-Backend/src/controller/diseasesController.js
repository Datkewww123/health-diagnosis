const { Op } = require('sequelize');
const Disease = require('../model/diseases');
const Symptom = require('../model/symptoms');
const History = require('../model/history');
const { escapeLike } = require('../utils/sanitize');
require('../model/disease_symptoms');

class DiseasesController {
  // 1. Tìm bệnh theo tên tiếng Việt (không cần dịch nữa)
  async searchDisease(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Vui lòng nhập tên bệnh bạn muốn tìm!", count: 0, data: [] });
      }

      // Tìm kiếm bệnh theo tên có chứa từ khóa tiếng Việt
      const diseases = await Disease.findAll({
        where: {
          name: {
            [Op.like]: `%${escapeLike(name)}%`
          }
        },
        attributes: ['id', 'name'],
        limit: 10
      });

      // Lưu lịch sử tìm kiếm nếu đã đăng nhập
      if (req.user && diseases.length > 0) {
        try {
          await History.create({
            user_id: req.user.userId,
            type: "search",
            query_text: name,
            disease_name: diseases[0].name
          });
        } catch (err) {
          console.error("Lỗi lưu lịch sử tìm kiếm:", err.message);
        }
      }

      return res.json({
        message: 'Kết quả tìm kiếm',
        count: diseases.length,
        data: diseases.map(d => ({
          id: d.id,
          _id: d.id,
          name: d.name
        }))
      });
    } catch (err) {
      console.error('[Disease] Lỗi:', err);
      return res.status(500).json({ message: 'Lỗi lấy tin tức' });
    }
  }

  // 1.5. Lấy toàn bộ danh sách bệnh để gợi ý tìm kiếm (autocomplete)
  async listDiseases(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const { count, rows: diseases } = await Disease.findAndCountAll({
        attributes: { exclude: ['precaution_1', 'precaution_2', 'precaution_3', 'precaution_4'] },
        limit,
        offset,
        order: [['name', 'ASC']]
      });
      return res.json({
        diseases: diseases.map(d => ({
          id: d.id,
          _id: d.id,
          name: d.name
        })),
        total: count,
        page,
        limit
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách gợi ý" });
    }
  }

  // 2. Lấy chi tiết bệnh lý (kèm danh sách triệu chứng liên kết nhiều-nhiều)
  async getDetailed(req, res) {
    try {
      const { id } = req.params;

      let disease = null;
      if (!isNaN(id) && Number.isInteger(Number(id))) {
        disease = await Disease.findByPk(id, {
          include: [{
            model: Symptom,
            as: 'symptomsList',
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }]
        });
      }

      if (disease) {
        const { getWikipediaSummary, translateEnglishToVietnamese } = require('../config/icdService');

        // Dịch tên bệnh sang tiếng Việt
        let nameVi = disease.name;
        try {
          const translated = await translateEnglishToVietnamese(disease.name);
          if (translated && translated !== disease.name) nameVi = translated;
        } catch (_) {}

        // Tìm Wikipedia (thử tiếng Anh trước, rồi tiếng Việt)
        let wiki = null;
        try {
          wiki = await getWikipediaSummary(disease.name);
          if (!wiki && nameVi !== disease.name) {
            wiki = await getWikipediaSummary(nameVi, disease.name);
          }
        } catch (_) {}

        // Dịch overview nếu không có wiki và overview là tiếng Anh
        let overviewVi = null;
        if (!wiki?.wikiSummary && disease.overview) {
          try {
            const ov = await translateEnglishToVietnamese(disease.overview);
            if (ov && ov !== disease.overview) overviewVi = ov;
          } catch (_) {}
        }

        return res.json({
          id: disease.id,
          name: disease.name,
          name_vi: nameVi,
          overview: wiki?.wikiSummary || overviewVi || disease.overview,
          overview_vi: wiki?.wikiSummary || overviewVi || null,
          causes: disease.causes,
          diagnosis: disease.diagnosis,
          treatment: disease.treatment,
          precautions: disease.precautions,
          departments: disease.departments,
          image_url: disease.image_url,
          symptoms: disease.symptomsList,
          wikipedia: wiki ? {
            title: wiki.wikiTitle,
            url: wiki.wikiUrl,
            summary: wiki.wikiSummary
          } : null
        });
      }



      // Fallback: Nếu ID không có trong DB MySQL (ví dụ ID từ WHO ICD-11) -> Tra cứu từ WHO ICD-11 + Wikipedia + AI/Knowledge Engine
      const { getDiseaseDetail, getWikipediaSummary, translateEnglishToVietnamese, getAiOrFallbackMedicalDetails } = require('../config/icdService');
      try {
        let detail = null;
        try {
          detail = await getDiseaseDetail(id, 'en');
        } catch (_) {}

        let titleVi = id;
        if (detail && detail.title) {
          const rawKey = detail.title.toLowerCase().replace(/<[^>]*>/g, '').trim();
          const GENERIC_TITLES = ['unspecified', 'other', 'nos', 'nec', 'unclassified', 'not elsewhere classified'];
          
          if (GENERIC_TITLES.includes(rawKey)) {
            const altName = detail.inclusions?.[0] || detail.indexTerms?.[0];
            if (altName) {
              titleVi = await translateEnglishToVietnamese(altName);
            } else {
              titleVi = 'Bệnh lý ICD-11 (không xác định cụ thể)';
            }
          } else {
            titleVi = await translateEnglishToVietnamese(detail.title);
          }
        }

        let wiki = null;
        if (titleVi) {
          // Lấy keyword sạch để tìm Wikipedia (bỏ cụm từ quá chung)
          let searchKeyword = titleVi
            .split('(')[0]
            .replace(/không xác định|đặc hiệu khác|cụ thể|bệnh lý icd-11/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          // Chỉ tìm Wikipedia nếu keyword đủ ý nghĩa (>= 3 ký tự)
          if (searchKeyword.length >= 3) {
            wiki = await getWikipediaSummary(searchKeyword, detail?.title);
          }
        }

        if (detail || wiki) {
          const finalTitle = titleVi || wiki?.wikiTitle || id;
          const aiDetails = await getAiOrFallbackMedicalDetails(finalTitle);

          return res.json({
            id: id,
            name: finalTitle,
            name_vi: finalTitle,
            overview: wiki?.wikiSummary || detail?.definition || aiDetails?.overview,
            causes: aiDetails?.causes || detail?.definition || 'Thông tin nguyên nhân chuẩn y khoa ghi nhận trong cơ sở dữ liệu ICD-11.',
            diagnosis: aiDetails?.diagnosis || 'Khám lâm sàng và chẩn đoán theo phác đồ tiêu chuẩn của Tổ chức Y tế Thế giới (WHO).',
            treatment: aiDetails?.treatment || 'Điều trị y khoa theo chỉ định trực tiếp từ bác sĩ chuyên khoa.',
            precautions: aiDetails?.precautions || 'Theo dõi triệu chứng lâm sàng và thăm khám định kỳ theo hướng dẫn y tế.',
            departments: aiDetails?.departments || 'Nội tổng quát / Da liễu / Bệnh nhiệt đới',
            image_url: aiDetails?.image_url || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
            symptoms: aiDetails?.symptoms || [],
            wikipedia: wiki ? {
              title: wiki.wikiTitle,
              url: wiki.wikiUrl,
              summary: wiki.wikiSummary
            } : null
          });
        }
      } catch (icdErr) {
        console.warn('[ICD Detail Fallback Error]', icdErr.message);
      }

      return res.status(404).json({ message: "Không tìm thấy bệnh lý y khoa này!" });
    } catch (err) {
      console.error("Lỗi lấy chi tiết bệnh lý:", err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết bệnh lý" });
    }
  }

  // 3. Lấy chi tiết triệu chứng y tế & danh sách tất cả các bệnh đi kèm triệu chứng đó (Liên kết chéo)
  async getSymptomDetailed(req, res) {
    try {
      const { id } = req.params;

      const symptom = await Symptom.findByPk(id, {
        include: [{
          model: Disease,
          as: 'diseasesList',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }]
      });

      if (!symptom) {
        return res.status(404).json({ message: "Không tìm thấy triệu chứng y tế này!" });
      }

      return res.json({
        id: symptom.id,
        name: symptom.name,
        description: symptom.description,
        diseases: symptom.diseasesList // Mảng các bệnh lý liên quan [{id, name}] để click quay ngược về trang bệnh lý
      });

    } catch (err) {
      console.error("Lỗi lấy chi tiết triệu chứng:", err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết triệu chứng" });
    }
  }

  // 4. Lấy lịch sử tìm kiếm của người dùng
  async getSearchHistory(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
      }

      const histories = await History.findAll({
        where: {
          user_id: req.user.userId,
          type: 'search'
        },
        order: [['created_at', 'DESC']],
        limit: 20
      });

      return res.json({
        message: "Lịch sử tìm kiếm",
        count: histories.length,
        data: histories.map(h => ({
          _id: h.id, // giữ nguyên _id cho frontend cũ nếu cần tương thích
          diseaseName: h.disease_name,
          createdAt: h.created_at,
          queryText: h.query_text
        }))
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy lịch sử tìm kiếm" });
    }
  }

  async saveSearchHistory(req, res) {
    try {
      const { searchName, diseaseName, createdAt } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
      }
      await History.create({
        user_id: req.user.userId,
        type: "search",
        query_text: searchName,
        disease_name: diseaseName,
        createdAt: createdAt || new Date()
      });
      return res.status(201).json({ ok: true, message: "Lưu lịch sử thành công" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lưu lịch sử tìm kiếm" });
    }
  }

}

module.exports = new DiseasesController();