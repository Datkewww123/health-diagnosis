const Diseases = require('../model/diseases');
const { 
    processInputSymptoms,
    translateMatchedList,
    translateDiseaseName
} = require("../controller/mapTransaction");

class SymptomsController {
    async symptomsCheck(req, res){
        try{
            const { symptoms } = req.body;

            if (!symptoms) {
                return res.status(400).json({ message: "Vui lòng nhập triệu chứng!" });
            }

            // Xử lý input
            const translatedKeywords = processInputSymptoms(symptoms);

            // Lấy toàn bộ bệnh
            const all = await Diseases.find({})
                .select("name symptoms")
                .lean();

            // Tính điểm
            const scoreList = await Promise.all(
                all.map(async (d) => {

                    let score = 0;
                    let matched = [];

                    const text = (d.name + " " + d.symptoms).toLowerCase();

                    translatedKeywords.forEach(k => {
                        if (text.includes(k)) {
                            score++;
                            matched.push(k);
                        }
                    });

                    if (score === 0) return null;

                    return {
                        name: await translateDiseaseName(d.name),   
                        score,
                        matched: await translateMatchedList(matched) 
                    };
                })
            );

            // Lọc null + sort
            const filtered = scoreList
                .filter(Boolean)
                .sort((a, b) => b.score - a.score);

            return res.json({
                message: "Kết quả chuẩn đoán",
                count: filtered.length,
                data: filtered
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new SymptomsController();
