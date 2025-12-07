const Diseases = require('../model/diseases');
function parseField(field) {
    if (!field) return "";
    if (Array.isArray(field)) return field.join(", "); // lưu dạng string dấu phẩy
    if (typeof field === "string") return field; // giữ nguyên string
    return "";
}

function formatField(field) {
    if (!field) return [];
    return field.split(",").map(s => s.trim());
}
class adminController{
    async createDiseases(req, res){
        try{
            const{name,
                overview,
                symptoms,
                causes,
                diagnosis,
                treatment,
                doctors,
                departments,
                image_url,
                Precaution_1,
                Precaution_2,
                Precaution_3,
                Precaution_4
        } = req.body;
        if(!name){
            return res.status(400).json({message:"Tên bệnh là bắt buộc!"});
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

            res.json({ message: "Bệnh đã được tạo", disease });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
// lay ra benh
    async getAllDiseases(req, res) {
        try {
            const diseases = await Diseases.find();
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

            res.json({ count: formatted.length, diseases: formatted });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
    // cap nhat thong tin benh
    // ----- GET BY ID -----
    async getDiseaseById(req, res) {
        try {
            const diseaseId = req.params.id;
            const d = await Diseases.findById(diseaseId);
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
    // ----- DELETE -----
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