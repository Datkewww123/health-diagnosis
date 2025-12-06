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


            // luu lịch sử dự đoán
            if(req.user){
                await History.create({
                userId: req.user.id,
                type: "predict",
                inputSymptoms: symptoms,
                });
            }

            // tra ve ket qua
            return res.json({
                message: "Kết quả chuẩn đoán",
                count: filtered.length,
                data: filtered
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    async getHistory(req, res){
        try{
            if(!req.user){
                return res.status(401).json({message:"Bạn chưa đăng nhập!"});
            }
            const history = (await History.find({userID: req.user.id})).sort({createAt: -1});
            return res.json({
                message: "Lịch sử dự đoán",
                count: history.length,
                data: history
            })
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
    }
}

module.exports = new SymptomsController();
