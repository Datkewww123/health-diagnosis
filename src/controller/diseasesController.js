const Diseases = require('../model/diseases');
const {
    translateDiseaseName,
    translateDiseaseVItoEN,
    translateDiagnosis,
    translateDoctor,
    translateDepartment,
    translateTreatment,
    translatePrecaution
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
            const symptomsList = disease.symptoms_vi
                ? disease.symptoms_vi.split(";").map(s => s.trim())
                : (disease.symptoms || []); 

            // 2. Chẩn đoán (Mảng EN -> Mảng VI)
            // Kiểm tra xem database lưu string hay array. Code này giả định là Array.
            // Nếu DB lưu string "A, B, C" thì cần split trước.
            const rawDiagnosis = Array.isArray(disease.diagnosis) ? disease.diagnosis : [disease.diagnosis];
            const diagnosisVI = rawDiagnosis.map(d => translateDiagnosis(d));

            // 3. Điều trị (Mảng EN -> Mảng VI)
            const rawTreatment = Array.isArray(disease.treatment) ? disease.treatment : [disease.treatment];
            const treatmentVI = rawTreatment.map(t => translateTreatment(t));

            // 4. Bác sĩ (Mảng EN -> Mảng VI)
            const rawDoctor = Array.isArray(disease.doctor) ? disease.doctor : [disease.doctor];
            const doctorVI = rawDoctor.map(d => translateDoctor(d));

            // 5. Chuyên khoa (String EN -> String VI)
            const departmentVI = translateDepartment(disease.department);

            // 6. Lời khuyên (String keys -> String VI)
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);

            const detailData = {
                _id: disease._id,
                name: translateDiseaseName(disease.name), // Tên tiếng Việt
                overview: disease.overview_vi || disease.overview, // Ưu tiên overview tiếng Việt nếu có
                symptoms: symptomsList,
                causes: disease.causes_vi || disease.causes,
                
                diagnosis: diagnosisVI,
                treatment: treatmentVI,
                doctor: doctorVI,
                department: departmentVI,

                precaution: [precaution1, precaution2, precaution3, precaution4].filter(p => p), // Gom thành mảng cho gọn

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
