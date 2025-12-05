const Diseases = require('../model/diseases');
const {
    translateDiseaseName,
    translateDiseaseVItoEN,
    translateDiagnosis,
    translateTreatment,
    translateDoctor,
    translateDepartment,
    translatePrecaution,
    translateMatchedList,
    translateDescription,
    translateRiskFactor,
} = require("../controller/mapTransaction");
const History = require('../model/history');

class DiseasesController{


    // --- HÀM PHỤ: CẮT CHUỖI VÀ DỊCH (Đưa ra ngoài để tái sử dụng) ---
        _processListField(data, translateFunc) {
        if (!data) return [];
        let list = [];
        
        // 1. Chuẩn hóa thành mảng
        if (Array.isArray(data)) {
            list = data;
        } else if (typeof data === 'string') {
            // Tách theo phẩy, chấm phẩy, xuống dòng
            list = data.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
        }

        // 2. Dịch từng món
        return list.map(item => {
            const translated = translateFunc(item);
            return translated || item; // Giữ gốc nếu không dịch được
        });
    }


     // Tìm bệnh theo tên (input tiếng Việt, output id + tên tiếng Việt)
        async searchDisease(req, res) {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ message: "Vui lòng nhập tên bệnh bạn muốn tìm!", count: 0, data: [] });
            }

            // Chuyển tên bệnh tiếng Việt sang tiếng Anh để query database
            const nameEN = translateDiseaseVItoEN(name);

            // Tạo regex tìm kiếm không phân biệt hoa thường
            const searchRegex = new RegExp(nameEN, 'i');

            const diseases = await Diseases.find({
                name: { $regex: searchRegex }
            })
            .select('name') // Chỉ lấy trường name (tiếng Anh)
            .limit(5);

            // Chuyển lại tên bệnh sang tiếng Việt để trả cho client
            const formattedData = diseases.map(d => ({
                _id: d._id,
                name: translateDiseaseName(d.name)
            }));
            // Lưu lịch sử tìm kiếm
            if(req.user){
                await History.create({
                    userId: req.user._id,
                    type: "search",
                    diseaseName: name,
                    time: new Date()
                })
            }

            return res.json({
                message: 'Kết quả tìm kiếm',
                count: formattedData.length,
                data: formattedData
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }


        // Lấy chi tiết bệnh
        async getDetailed(req, res) {
        try {
            const { id } = req.params;
            const disease = await Diseases.findById(id);

            if (!disease) return res.status(404).json({ message: "Không tìm thấy bệnh!" });

            // A. Xử lý Symptoms (Triệu chứng)
            let symptomsVI = [];
            if (disease.symptoms_vi) {
                symptomsVI = disease.symptoms_vi.split(/[,;]/).map(s => s.trim());
            } else {
                let rawSymptoms = disease.symptoms;
                if (typeof rawSymptoms === 'string') {
                    rawSymptoms = rawSymptoms.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
                }
                symptomsVI = translateMatchedList(rawSymptoms || []);
            }

            // B. Xử lý các trường danh sách (Dùng hàm phụ _processListField)
            // Lưu ý: Phải dùng this._processListField vì đã đưa hàm vào class
            const diagnosisVI = this._processListField(disease.diagnosis, translateDiagnosis);
            const treatmentVI = this._processListField(disease.treatment, translateTreatment);
            const doctorVI    = this._processListField(disease.doctor, translateDoctor); 

            // C. Các trường văn bản/đơn
            const descriptionVI = translateDescription(disease.Description || disease.overview);
            const causesVI = translateRiskFactor(disease.risk_factor || disease.causes);
            const departmentVI = translateDepartment(disease.department);

            // D. Precaution
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);

            return res.json({
                _id: disease._id,
                name: translateDiseaseName(disease.name),
                overview: descriptionVI || disease.Description || disease.overview,
                symptoms: symptomsVI,
                causes: causesVI || disease.risk_factor || disease.causes,
                diagnosis: diagnosisVI,
                treatment: treatmentVI,
                doctor: doctorVI,
                department: departmentVI,
                Precaution_1: precaution1,
                Precaution_2: precaution2,
                Precaution_3: precaution3,
                Precaution_4: precaution4,
                image_url: disease.image_url
            });

        } catch (err) {
            console.error("Lỗi lấy chi tiết:", err);
            return res.status(500).json({ message: "Lỗi server khi lấy chi tiết bệnh" });
        }
    }
}
module.exports = new DiseasesController();
