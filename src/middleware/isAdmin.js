const jwt = require('jsonwebtoken'); // lay token sau khi dang nhap 


// Kiểm tra token và role = admin
const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided!" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
module.exports = {isAdmin}