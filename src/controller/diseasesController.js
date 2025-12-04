const Diseases = require('../model/diseases');
const {
    translateDiseaseName,
    translateDiseaseVItoEN,
    translateDiagnosis,
    translateTreatment,
    translateDoctor,
    translateDepartment,
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


    // lay thong tin chi tiet benh(phai login moi duoc vao xem chi tiet)
 async getDetailed(req, res) {
        try {
            // verifyToken đảm bảo req.user tồn tại
            const { id } = req.params;

            const disease = await Diseases.findById(id);
            if (!disease) {
                return res.status(404).json({
                    message: "Không tìm thấy bệnh!"
                });
            }

            const symptomsList = disease.symptoms_vi
                ? disease.symptoms_vi.split(";").map(s => s.trim())
                : [];

            const detailData = {
                _id: disease._id,
                name: disease.name_vi || disease.name,
                overview: disease.overview_vi || disease.overview,
                symptoms: symptomsList,
                causes: disease.causes_vi || disease.causes,

                diagnosis: translateDiagnosis(disease.diagnosis),
                treatment: translateTreatment(disease.treatment),
                doctor: translateDoctor(disease.doctor),
                department: translateDepartment(disease.department),

                Precaution_1: translatePrecaution(disease.Precaution_1),
                Precaution_2: translatePrecaution(disease.Precaution_2),
                Precaution_3: translatePrecaution(disease.Precaution_3),
                Precaution_4: translatePrecaution(disease.Precaution_4),

                image_url: disease.image_url
            };
            return res.json(detailData);
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    }
}

module.exports = new DiseasesController();
