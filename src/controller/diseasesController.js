const Diseases = require('../model/diseases');
const historySearch = require('../model/historySearch'); // Import model lịch sử
const jwt = require('jsonwebtoken');// lay userID tu token
const {translate} = require('@vitalets/google-translate-api');

// Danh sach nhung tu du thua tieng viet nen loc ra de lay keyword
const Viet_WORD = [
    "tôi", "tao", "tớ", "mình", "bạn", "anh", "chị", "em",
    "bị", "cảm", "thấy", "thấy", "trong", "người",
    "dạo", "này", "gần", "đây", "lâu", "nay",
    "hay", "thường", "xuyên", "có", "vẻ", "hơi", "rất", "quá", "lắm",
    "như", "là", "và", "hoặc", "nhưng", "thì", "mà", "ở", "với",
    "kiểu", "như", "bị", "đau", "nhức", "mỏi" // con co the them nua
];

class DiseasesController{
    // Ham dich tieng anh
    async translateText(text){
        if(!text){
            return "";
        }
        try{
            const res = await translate(text, {to: 'vi'});
            return res.test;
        }
        catch(err){
            return text; // lỗi thi van giu nguyen tieng anh
        }
    }
    async search (req, res){
        try{
            const{ keyword } = req.body;
            if(!keyword){
                return res.status(400).json({message:"Vui lòng nhập triệu chứng"});
            }
            //B1: xu li tu khoa tieng viet va dich input
            const cleanKeyword = keyword.toLowerCase().split("") // chuyen thanh chu thuong va cach nhau 1 khoang trắng
            .filter(word => !Viet_WORD.includes(word)).join; // loc ra nhung tu thua
            let searchKeyword = cleanKeyword;
            try{
                const trans = await translate(cleanKeyword, {to: 'en'});
                searchKeyword = trans.text;
            }
            catch(e){}

            // tim trong database (En)
            const result = await Diseases.find(
                {$text: {$search: searchKeyword}},
                {score: {$meta: "textScore"}}
            ).sort({score: {$meta: "textScore"}}).limit(5); // lay 5 cai de dich cho nhanh
            // Dich lai ket qua tu En sang Vi, dich cac thu con lai
            const translatedResult = await Promise.all(result.map(async (disease) =>{
                const [nameVi, overviewVi] = await Promise.all([
                    this.translateText(disease.name),
                    this.translateText(disease.overview)
                ]);
                return{
                    _id: disease._id,
                    original_name: disease.name,
                    name: nameVi,
                    overview: overviewVi,
                    img_url: disease.image.url,
                    score: disease.score
                };
            }));
            // Luu lich su
            const authHeader = req.headers.authorization;
            if(authHeader){
                try{
                    const token = authHeader.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.SECRET_KEY || "SECRET KEY");
                    historySearch.create({
                        userID:  decoded.userID,
                        originalQuery: keyword,
                        extractedKeyword: searchKeyword
                    });
                }
            catch(err){}
        }
        res.json({
            message: "Kết quả tìm kiếm", data: translatedResult
        })
    }
    catch(err){
        return res.status(500).json({message: err.message});
        }
    }
// Ham xem chi tiet sau khi click vao

    async getDetail(req, res) {
        try {
            const { id } = req.params;
            const disease = await Diseases.findById(id);

            if (!disease) {
                return res.status(404).json({ message: "Không tìm thấy bệnh theo ID!" });
            }

            // --- Gom precaution thành 1 đoạn văn tiếng Anh ---
            const precautionText = [
                disease.Precaution_1,
                disease.Precaution_2,
                disease.Precaution_3,
                disease.Precaution_4
            ]
            .filter(Boolean)
            .join(". ");

            // --- Nếu DB chưa có tiếng Việt → dịch realtime ---
            const fieldsToTranslate = [
                "name",
                "overview",
                "symptoms",
                "causes",
                "diagnosis",
                "treatment",
                "doctors",
                "departments"
            ];

            const result_vi = {};

            for (const field of fieldsToTranslate) {
                const viField = field + "_vi";

                if (disease[viField]) {
                    // Có tiếng Việt sẵn trong DB
                    result_vi[viField] = disease[viField];
                } else {
                    // Chưa có → dịch realtime
                    try {
                        const trans = await translate(disease[field] || "", { to: "vi" });
                        result_vi[viField] = trans.text;
                    } catch {
                        result_vi[viField] = "";
                    }
                }
            }

            // Dịch Precaution sang tiếng Việt
            let precaution_vi = "";
            try {
                const transPrec = await translate(precautionText, { to: "vi" });
                precaution_vi = transPrec.text;
            } catch {
                precaution_vi = "";
            }

            return res.json({
                message: "Thông tin chi tiết bệnh (song ngữ)",
                data: {
                    // --- English ---
                    _id: disease._id,
                    name: disease.name,
                    overview: disease.overview,
                    symptoms: disease.symptoms,
                    causes: disease.causes,
                    diagnosis: disease.diagnosis,
                    treatment: disease.treatment,
                    doctors: disease.doctors,
                    departments: disease.departments,
                    image_url: disease.image_url,
                    precautions: precautionText,

                    // --- Vietnamese (translated or DB) ---
                    name_vi: result_vi.name_vi,
                    overview_vi: result_vi.overview_vi,
                    symptoms_vi: result_vi.symptoms_vi,
                    causes_vi: result_vi.causes_vi,
                    diagnosis_vi: result_vi.diagnosis_vi,
                    treatment_vi: result_vi.treatment_vi,
                    doctors_vi: result_vi.doctors_vi,
                    departments_vi: result_vi.departments_vi,
                    precaution_vi: precaution_vi
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
}

// Bind 'this' de dung duoc ham translateText trong cac method

const controller = new DiseasesController();
controller.translateText = controller.translateText.bind(controller);
controller.search = controller.search.bind(controller);
controller.getDetail = controller.getDetail.bind(controller);

module.exports = controller;