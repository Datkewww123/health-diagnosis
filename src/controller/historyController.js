    const History = require('../model/history'); // import model history tu file history.js

    class HistoryController{
        // lay lich su tim kiem cua user = search
    async getUserHistory(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Vui lòng đăng nhập để xem lịch sử!' });
            }

            const histories = await History.find({
                user: req.user.userId,
                type: 'search'                 
            })
            .sort({ createdAt: -1 })              
            .limit(50);

            return res.json({
                count: histories.length,
                data: histories
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
        // lay lich su du doan cua user = predict
        async getPredictHistory(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Vui lòng đăng nhập để xem lịch sử !' });
            }

            const histories = await History.find({
                user: req.user.userId,
                type: 'predict'                
            })
            .sort({ createdAt: -1 })              
            .limit(50);

            return res.json({
                count: histories.length,
                data: histories
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
    }
        }
    }

    module.exports = new HistoryController();