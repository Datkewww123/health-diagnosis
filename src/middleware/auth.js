// kiem tra xem la admin hay user
const jwt = require('jsonwebtoken'); //tao token sau khi login
//middle ware de kiem tra token xem user da login chua
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization; //
    if(!authHeader){ // khong co header tra ve 401
        return res.status(401).json({message:"No token provided!"});
    }
    const token = authHeader.split(" ")[1]; // lay phan sau cua bearer de kiem tra token
    try{
        const decoded = jwt.verify(token,"SECRET_KEY"); // kiem tra token co hop le khong voi serect key
        req.user = decoded; // neu hop le thi giai ma payload gan vao req.user
        next(); //chuyen sang middle ware tiep theo hoac route handler
    }
    catch(err){ // neu token khong hop le
        return res.status(401).json({message:"Invalid token"});
    }
};
// optional login de luu lich su
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // neu khong co token thi req.user = null va chuyen tiep
    if(!authHeader){
        req.user = null;
        return next();
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, "SECRET_KEY");
        req.user = decoded;
    }
    catch(err){
        req.user = null;
    }
    next();
}
module.exports = {verifyToken, optionalAuth};
