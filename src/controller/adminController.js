const Diseases = require('../model/diseases');

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

class adminController {
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

            const disease = await Diseases.create({
                name,
                overview,
                image_url,
                diagnosis: parseField(diagnosis),
                symptoms: parseField(symptoms),
                causes: parseField(causes),
                treatment: parseField(treatment),
                doctors: parseField(doctors),
                departments: parseField(departments),
                Precaution_1: Precaution_1 || null,
                Precaution_2: Precaution_2 || null,
                Precaution_3: Precaution_3 || null,
                Precaution_4: Precaution_4 || null
            });

            res.status(201).json({ message: "Bệnh đã được tạo", disease });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getAllDiseases(req, res) {
        try {
            // [FIX] Thêm pagination: page và limit từ query params
            // Trước đây: Diseases.find() trả về ALL records trong 1 response
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const [diseases, total] = await Promise.all([
                Diseases.find().skip(skip).limit(limit).lean(),
                Diseases.countDocuments()
            ]);

            const formatted = diseases.map(d => ({
                _id: d._id,
                name: d.name,
                overview: d.overview,
                image_url: d.image_url,
                diagnosis: formatField(d.diagnosis),
                symptoms: formatField(d.symptoms),
                causes: formatField(d.causes),
                treatment: formatField(d.treatment),
                doctors: formatField(d.doctors),
                departments: formatField(d.departments),
                Precaution_1: d.Precaution_1,
                Precaution_2: d.Precaution_2,
                Precaution_3: d.Precaution_3,
                Precaution_4: d.Precaution_4
            }));

            // [FIX] Trả thêm total, page, totalPages để FE biết tổng số trang
            res.json({
                count: formatted.length,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                diseases: formatted
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getDiseaseById(req, res) {
        try {
            const diseaseId = req.params.id;
            const d = await Diseases.findById(diseaseId).lean();
            if (!d) return res.status(404).json({ message: "Bệnh không tồn tại!" });

            const formatted = {
                _id: d._id,
                name: d.name,
                overview: d.overview,
                image_url: d.image_url,
                diagnosis: formatField(d.diagnosis),
                symptoms: formatField(d.symptoms),
                causes: formatField(d.causes),
                treatment: formatField(d.treatment),
                doctors: formatField(d.doctors),
                departments: formatField(d.departments),
                Precaution_1: d.Precaution_1,
                Precaution_2: d.Precaution_2,
                Precaution_3: d.Precaution_3,
                Precaution_4: d.Precaution_4
            };

            res.json({ disease: formatted });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateDisease(req, res) {
        try {
            const diseaseId = req.params.id;
            const updateData = { ...req.body };

            ['symptoms', 'causes', 'treatment', 'doctors', 'departments', 'diagnosis'].forEach(field => {
                if (field in updateData) updateData[field] = parseField(updateData[field]);
            });

            const updated = await Diseases.findByIdAndUpdate(diseaseId, updateData, { new: true });
            if (!updated) return res.status(404).json({ message: "Bệnh không tồn tại!" });

            res.json({ message: "Cập nhật bệnh thành công", updated });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async deleteDisease(req, res) {
        try {
            const diseaseId = req.params.id;
            const deleted = await Diseases.findByIdAndDelete(diseaseId);
            if (!deleted) return res.status(404).json({ message: "Bệnh không tồn tại!" });

            res.json({ message: "Xóa bệnh thành công" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new adminController();
