const Disease = require('../model/diseases');

function parseField(field) {
  if (!field) return "";
  if (Array.isArray(field)) return field.join(", ");
  if (typeof field === "string") return field;
  return "";
}

function formatField(field) {
  if (!field) return [];
  return field.split(",").map(s => s.trim());
}

class AdminController {
  async createDiseases(req, res) {
    try {
      const {
        name, overview, symptoms, causes, diagnosis, treatment,
        doctors, departments, image_url,
        Precaution_1, Precaution_2, Precaution_3, Precaution_4
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tên bệnh là bắt buộc!" });
      }

      const disease = await Disease.create({
        name,
        overview,
        image_url,
        diagnosis: parseField(diagnosis),
        symptoms: parseField(symptoms),
        causes: parseField(causes),
        treatment: parseField(treatment),
        doctors: parseField(doctors),
        departments: parseField(departments),
        precaution_1: Precaution_1 || null,
        precaution_2: Precaution_2 || null,
        precaution_3: Precaution_3 || null,
        precaution_4: Precaution_4 || null
      });

      return res.status(201).json({ message: "Bệnh đã được tạo", disease });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi tạo bệnh lý" });
    }
  }

  async getAllDiseases(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count: total, rows: diseases } = await Disease.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      const formatted = diseases.map(d => ({
        _id: d.id, // giữ _id tương thích
        name: d.name,
        overview: d.overview,
        image_url: d.image_url,
        diagnosis: formatField(d.diagnosis),
        symptoms: formatField(d.symptoms),
        causes: formatField(d.causes),
        treatment: formatField(d.treatment),
        doctors: formatField(d.doctors),
        departments: formatField(d.departments),
        Precaution_1: d.precaution_1,
        Precaution_2: d.precaution_2,
        Precaution_3: d.precaution_3,
        Precaution_4: d.precaution_4
      }));

      return res.json({
        count: formatted.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        diseases: formatted
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách bệnh lý" });
    }
  }

  async getDiseaseById(req, res) {
    try {
      const diseaseId = req.params.id;
      const d = await Disease.findByPk(diseaseId);
      if (!d) return res.status(404).json({ message: "Bệnh không tồn tại!" });

      const formatted = {
        _id: d.id,
        name: d.name,
        overview: d.overview,
        image_url: d.image_url,
        diagnosis: formatField(d.diagnosis),
        symptoms: formatField(d.symptoms),
        causes: formatField(d.causes),
        treatment: formatField(d.treatment),
        doctors: formatField(d.doctors),
        departments: formatField(d.departments),
        Precaution_1: d.precaution_1,
        Precaution_2: d.precaution_2,
        Precaution_3: d.precaution_3,
        Precaution_4: d.precaution_4
      };

      return res.json({ disease: formatted });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết bệnh lý" });
    }
  }

  async updateDisease(req, res) {
    try {
      const diseaseId = req.params.id;
      const updateData = { ...req.body };

      const disease = await Disease.findByPk(diseaseId);
      if (!disease) return res.status(404).json({ message: "Bệnh không tồn tại!" });

      // Chuyển đổi tên trường cho khớp với MySQL Model (precaution_1 thay cho Precaution_1)
      if ('Precaution_1' in updateData) { updateData.precaution_1 = updateData.Precaution_1; delete updateData.Precaution_1; }
      if ('Precaution_2' in updateData) { updateData.precaution_2 = updateData.Precaution_2; delete updateData.Precaution_2; }
      if ('Precaution_3' in updateData) { updateData.precaution_3 = updateData.Precaution_3; delete updateData.Precaution_3; }
      if ('Precaution_4' in updateData) { updateData.precaution_4 = updateData.Precaution_4; delete updateData.Precaution_4; }

      ['symptoms', 'causes', 'treatment', 'doctors', 'departments', 'diagnosis'].forEach(field => {
        if (field in updateData) updateData[field] = parseField(updateData[field]);
      });

      await Disease.update(updateData, { where: { id: diseaseId } });
      const updated = await Disease.findByPk(diseaseId);

      return res.json({ message: "Cập nhật bệnh thành công", updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bệnh lý" });
    }
  }

  async deleteDisease(req, res) {
    try {
      const diseaseId = req.params.id;
      const deletedCount = await Disease.destroy({ where: { id: diseaseId } });
      if (deletedCount === 0) return res.status(404).json({ message: "Bệnh không tồn tại!" });

      return res.json({ message: "Xóa bệnh thành công" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi xóa bệnh lý" });
    }
  }
}

module.exports = new AdminController();
