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

            // --- XỬ LÝ DỮ LIỆU ---

            // A. Xử lý Triệu chứng (Symptoms)
            // Lấy mảng gốc tiếng Anh, nếu là string thì tách ra
            let rawSymptoms = disease.symptoms || [];
            if (typeof rawSymptoms === 'string') {
                rawSymptoms = rawSymptoms.split(/[,;]/).map(s => s.trim());
            }
            // Gọi hàm dịch danh sách (EN -> VI)
            // Lưu ý: Nếu DB có sẵn symptoms_vi thì dùng luôn, còn không thì dịch từ rawSymptoms
            const symptomsVI = disease.symptoms_vi 
                ? disease.symptoms_vi.split(/[,;]/).map(s => s.trim())
                : translateMatchedList(rawSymptoms);


            // B. Xử lý Mô tả (Overview/Description)
            // Lấy text gốc -> Gọi hàm dịch
            const rawDesc = disease.Description || disease.overview;
            const descriptionVI = translateDescription(rawDesc); // Trả về tiếng Việt hoặc null


            // C. Xử lý Nguyên nhân (Causes/Risk Factor)
            // Lấy text gốc -> Gọi hàm dịch
            const rawCauses = disease.risk_factor || disease.causes;
            const causesVI = translateRiskFactor(rawCauses); // Trả về tiếng Việt hoặc null


            // D. Xử lý các mảng khác (Chẩn đoán, Điều trị, Bác sĩ...)
            const diagnosisVI = (Array.isArray(disease.diagnosis) ? disease.diagnosis : [disease.diagnosis])
                                .map(d => translateDiagnosis(d)).filter(Boolean);

            const treatmentVI = (Array.isArray(disease.treatment) ? disease.treatment : [disease.treatment])
                                .map(t => translateTreatment(t)).filter(Boolean);

            const doctorVI = (Array.isArray(disease.doctor) ? disease.doctor : [disease.doctor])
                                .map(d => translateDoctor(d)).filter(Boolean);


            // E. Xử lý các trường đơn lẻ
            const departmentVI = translateDepartment(disease.department);
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);


            // --- ĐÓNG GÓI DỮ LIỆU TRẢ VỀ ---
            const detailData = {
                _id: disease._id,
                name: translateDiseaseName(disease.name),
                
                // Logic: Nếu dịch được (có trong Map) thì lấy tiếng Việt, không thì lấy tiếng Anh gốc
                overview: descriptionVI || rawDesc,
                
                symptoms: symptomsVI,
                
                causes: causesVI || rawCauses,
                
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
