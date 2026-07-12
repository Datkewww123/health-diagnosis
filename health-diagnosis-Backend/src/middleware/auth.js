const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided!" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        // [FIX] Thêm role vào req.user để xử lý admin nhất quán
        req.user = { userId: decoded.id || decoded._id || decoded.userId, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        // [FIX] Thêm role vào req.user cho đồng nhất với verifyToken
        req.user = { userId: decoded.id || decoded._id || decoded.userId, role: decoded.role };
    } catch (err) {
        req.user = null;
    }
    next();
};

module.exports = { verifyToken, optionalAuth };
