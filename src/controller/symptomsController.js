    const Diseases = require('../model/diseases');
    const { 
        processInputSymptoms,
        translateMatchedList,
        translateDiseaseName
    } = require("../controller/mapTransaction");
    const History = require('../model/history');

    class SymptomsController {
        async symptomsCheck(req, res){
            try{
                const { symptoms } = req.body;

                if (!symptoms) {
                    return res.status(400).json({ message: "Vui lòng nhập triệu chứng!" });
                }

                const translatedKeywords = processInputSymptoms(symptoms);

                const all = await Diseases.find({})
                    .select("name symptoms")
                    .lean();

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

                const filtered = scoreList
                    .filter(Boolean)
                    .sort((a, b) => b.score - a.score);


                // SAVE HISTORY
                if (req.user && req.user.userId) {
                try {
                    await History.create({
                    user: req.user.userId,
                    type: "predict",
                    inputSymptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
                    diseaseName: filtered[0]?.name || "unknown"
});
                } catch (err) {
                    console.error("Lỗi lưu history predict:", err.message);
                }
            }
                return res.json({
                    message: "Kết quả chuẩn đoán",
                    count: filtered.length,
                    data: filtered
                });

            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
        }

        async getHistory(req, res) {
            try {
                if (!req.user) return res.status(401).json({ message: "Bạn chưa đăng nhập!" });

                const history = await History.find({
                    user: req.user.userId, 
                    type: "predict"
                }).sort({ createdAt: -1 });

                return res.json({ 
                    message: "Lịch sử dự đoán", 
                    count: history.length, 
                    data: history 
                });

            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
        }
    }

    module.exports = new SymptomsController();
