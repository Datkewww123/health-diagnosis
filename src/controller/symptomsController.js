const Diseases = require('../model/diseases');
const {
    processInputSymptoms,
    translateMatchedList,
    translateDiseaseName
} = require("../controller/mapTransaction");
const History = require('../model/history');

// [FIX] Cache diseases trong memory 5 phút
// Trước đây mỗi request gọi Diseases.find({}) tải ALL documents từ DB
// Giờ chỉ load 1 lần, cache 5 phút, giảm tải DB đáng kể
let diseasesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedDiseases() {
    const now = Date.now();
    if (!diseasesCache || (now - cacheTimestamp) > CACHE_TTL_MS) {
        diseasesCache = await Diseases.find({}).select("name symptoms").lean();
        cacheTimestamp = now;
    }
    return diseasesCache;
}

class SymptomsController {
    async symptomsCheck(req, res) {
        try {
            const { symptoms } = req.body;

            if (!symptoms) {
                return res.status(400).json({ message: "Vui lòng nhập triệu chứng!", data: [], count: 0 });
            }

            const translatedKeywords = processInputSymptoms(symptoms);
            if (!translatedKeywords || translatedKeywords.length === 0) {
                return res.json({ message: "Không thể nhận diện triệu chứng", data: [], count: 0 });
            }

            const all = await getCachedDiseases();

            // [FIX] Bỏ Promise.all + map không cần thiết vì translateDiseaseName synchronous
            const scoreList = all.map(d => {
                let score = 0;
                let matched = [];
                const text = (d.name + " " + d.symptoms).toLowerCase();

                for (const k of translatedKeywords) {
                    if (text.includes(k)) {
                        score++;
                        matched.push(k);
                    }
                }

                if (score === 0) return null;

                return {
                    name: translateDiseaseName(d.name),
                    score,
                    matched: translateMatchedList(matched)
                };
            });

            const filtered = scoreList
                .filter(Boolean)
                .sort((a, b) => b.score - a.score);

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
