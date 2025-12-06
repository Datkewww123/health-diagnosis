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
          if (req.user) {
        await History.create({
        user: req.user._id,
        type: "search",
        searchName: name,     
        result: formattedData     
    });
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
            // HÀM PHỤ: CẮT CHUỖI VÀ DỊCH DANH SÁCH 
            // Tác dụng: Biến chuỗi "A, B, C." thành mảng [A, B, C] rồi dịch từng cái
            const processListField = (data, translateFunc) => {
                if (!data) return [];
                let list = [];
                // Bước 1: Chuẩn hóa dữ liệu đầu vào thành mảng
                if (Array.isArray(data)) {
                    list = data;
                } else if (typeof data === 'string') {
                    // Cắt theo dấu phẩy (,) hoặc chấm phẩy (;) hoặc xuống dòng (\n)
                    // .filter(Boolean) để loại bỏ các phần tử rỗng do dấu phẩy thừa
                    list = data.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
                }
                // Bước 2: Dịch từng phần tử
                return list.map(item => {
                    const translated = translateFunc(item);
                    return translated || item; // Nếu không dịch được (null) thì trả về gốc

                });

            };
            // --- XỬ LÝ DỮ LIỆU --
            // 1. Symptoms (Triệu chứng) - Xử lý riêng vì logic hơi khác
            let symptomsVI = [];
            if (disease.symptoms_vi) {
                symptomsVI = disease.symptoms_vi.split(/[,;]/).map(s => s.trim());
            } else {
                let rawSymptoms = disease.symptoms;
                if (typeof rawSymptoms === 'string') {
                    rawSymptoms = rawSymptoms.split(/[,;]/).map(s => s.trim()).filter(Boolean);
                }
                symptomsVI = translateMatchedList(rawSymptoms || []);

            }
            // 2. Các trường văn bản dài (Overview, Causes)
            const descriptionVI = translateDescription(disease.Description || disease.overview);
            const causesVI = translateRiskFactor(disease.risk_factor || disease.causes);


            // 3. Các trường danh sách (Dùng hàm processListField ở trên)
            const diagnosisVI = processListField(disease.diagnosis, translateDiagnosis);
            const treatmentVI = processListField(disease.treatment, translateTreatment);
            const doctorVI    = processListField(disease.doctor, translateDoctor); // CSV: "Neurologist, ENT specialist" -> Cắt ra và dịch

            // 4. Các trường đơn
            const departmentVI = translateDepartment(disease.department); // Thường chỉ có 1 khoa chính
            // 5. Precaution (Lời khuyên)
            const precaution1 = translatePrecaution(disease.Precaution_1);
            const precaution2 = translatePrecaution(disease.Precaution_2);
            const precaution3 = translatePrecaution(disease.Precaution_3);
            const precaution4 = translatePrecaution(disease.Precaution_4);
            // --- ĐÓNG GÓI DỮ LIỆU TRẢ VỀ ---
            const detailData = {
                _id: disease._id,
                name: translateDiseaseName(disease.name), // Tên bệnh tiếng Việt
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
            console.error("Lỗi lấy chi tiết:", err);
            return res.status(500).json({ message: "Lỗi server khi lấy chi tiết bệnh" });
        }
    }
 async getSearchHistory(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
        }

        const history = await History.find({
            user: req.user._id,      
            type: "search"
        })
        .sort({ createdAt: -1 });   

        return res.json({
            message: "Lịch sử tìm kiếm bệnh",
            count: history.length,
            data: history
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}
}

module.exports = new DiseasesController();