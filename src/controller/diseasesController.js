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

            if (!disease) {
                return res.status(404).json({ message: "Không tìm thấy bệnh!" });
            }

            // === HÀM PHỤ: CẮT CHUỖI VÀ DỊCH DANH SÁCH ===
            // Giúp xử lý trường hợp DB lưu: "Thuốc A, Thuốc B" thành mảng ["Thuốc A", "Thuốc B"] rồi mới dịch
            const processListField = (data, translateFunc) => {
                if (!data) return [];
                
                let list = [];
                if (Array.isArray(data)) {
                    list = data;
                } else if (typeof data === 'string') {
                    // Tách dấu phẩy (,) hoặc chấm phẩy (;) và xóa khoảng trắng thừa
                    list = data.split(/[,;]/).map(item => item.trim());
                }

                // Dịch từng món
                return list.map(item => {
                    const translated = translateFunc(item);
                    return translated || item; // Nếu không dịch được thì trả về gốc
                });
            };

            // --- XỬ LÝ DỮ LIỆU ---

            // 1. Symptoms (Triệu chứng)
            let symptomsVI = [];
            if (disease.symptoms_vi) {
                symptomsVI = disease.symptoms_vi.split(/[,;]/).map(s => s.trim());
            } else {
                let rawSymptoms = disease.symptoms;
                if (typeof rawSymptoms === 'string') rawSymptoms = rawSymptoms.split(/[,;]/).map(s => s.trim());
                symptomsVI = translateMatchedList(rawSymptoms || []);
            }

            // 2. Mô tả & Nguyên nhân
            const descriptionVI = translateDescription(disease.Description || disease.overview);
            const causesVI = translateRiskFactor(disease.risk_factor || disease.causes);

            // 3. CÁC TRƯỜNG DANH SÁCH (QUAN TRỌNG: Dùng hàm processListField mới)
            const diagnosisVI = processListField(disease.diagnosis, translateDiagnosis);
            const treatmentVI = processListField(disease.treatment, translateTreatment);
            const doctorVI    = processListField(disease.doctor, translateDoctor);

            // 4. Các trường đơn
            const departmentVI = translateDepartment(disease.department);
            
            // 5. Lời khuyên
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);


            // --- TRẢ VỀ KẾT QUẢ ---
            const detailData = {
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
            };

            return res.json(detailData);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Lỗi khi lấy chi tiết bệnh" });
        }
    }
}
module.exports = new DiseasesController();
