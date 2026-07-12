const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided!" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        // [FIX] Set req.user đồng bộ với auth.js (userId + role) thay vì gán cả decoded object
        req.user = { userId: decoded.id || decoded._id || decoded.userId, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = { isAdmin }
