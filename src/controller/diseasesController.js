const Diseases = require('../model/diseases');
const {
    translateDiseaseName,
    translateDiseaseVItoEN,
    translateDiagnosis,
    translateDoctor,
    translateDepartment,
    translateTreatment,
    translatePrecaution,
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
                return res.status(404).json({
                    message: "Không tìm thấy bệnh!"
                });
            }

            // --- XỬ LÝ DỮ LIỆU ---

            // 1. Triệu chứng: Nếu có trường symptoms_vi trong DB thì dùng, không thì tách từ mảng
            // Xử lý an toàn: đảm bảo symptoms là mảng hoặc chuỗi
            let symptomsRaw = disease.symptoms_vi || disease.symptoms;
            let symptomsList = [];
            
            if (Array.isArray(symptomsRaw)) {
                symptomsList = symptomsRaw;
            } else if (typeof symptomsRaw === 'string') {
                // Tách dấu phẩy hoặc chấm phẩy
                symptomsList = symptomsRaw.split(/[,;]/).map(s => s.trim());
            }

            // 2. Chẩn đoán (Mảng EN -> Mảng VI)
            const rawDiagnosis = Array.isArray(disease.diagnosis) ? disease.diagnosis : [disease.diagnosis];
            const diagnosisVI = rawDiagnosis.map(d => translateDiagnosis(d)).filter(Boolean); // Lọc bỏ null

            // 3. Điều trị (Mảng EN -> Mảng VI)
            const rawTreatment = Array.isArray(disease.treatment) ? disease.treatment : [disease.treatment];
            const treatmentVI = rawTreatment.map(t => translateTreatment(t)).filter(Boolean);

            // 4. Bác sĩ (Mảng EN -> Mảng VI)
            const rawDoctor = Array.isArray(disease.doctor) ? disease.doctor : [disease.doctor];
            const doctorVI = rawDoctor.map(d => translateDoctor(d)).filter(Boolean);

            // 5. Chuyên khoa (String EN -> String VI)
            const departmentVI = translateDepartment(disease.department);

            // 6. Lời khuyên (String keys -> String VI)
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);

            // 7. Mô tả tổng quan (Description -> VI) [MỚI]
            const descriptionVI = translateDescription(disease.Description);

            // 8. Nguyên nhân/Yếu tố nguy cơ (Risk Factor -> VI) [MỚI]
            // Map nhận vào chuỗi hoặc mảng đều được
            const riskFactorVI = translateRiskFactor(disease.risk_factor);

            const detailData = {
                _id: disease._id,
                name: translateDiseaseName(disease.name), // Tên tiếng Việt
                
                // Ưu tiên bản dịch mới, nếu không có thì fallback về bản gốc
                overview: descriptionVI || disease.Description || disease.overview, 
                
                symptoms: (disease.symptoms_vi || disease.symptoms || "").split(',').map(s => s.trim()),
                
                // Mapping risk_factor sang causes để hiển thị
                causes: riskFactorVI || disease.causes, 
                
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
            return res.status(500).json({
                message: "Lỗi khi lấy chi tiết bệnh"
            });
        }
    }
}

module.exports = new DiseasesController();
