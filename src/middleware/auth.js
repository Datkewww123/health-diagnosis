const jwt = require('jsonwebtoken'); //tao token sau khi login
const { setMaxListeners } = require('../model/user');
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){ // khong co header tra ve 401
        return res.status(401).json({message:"No token provided!"});
    }
    const token = authHeader.split(" ")[1]; //

    try{
        const decoded = jwt.verify(token, "SECRET KEY"); // kiem tra token co hop le khong voi serect key
        req.user = decoded; // neu hop le thi giai ma payload gan vao req.user
        next(); //chuyen sang middle ware tiep theo hoac route handler
    }
    catch(err){ // neu token khong hop le
        return res.status(401).json({message:"Ivalid token"});
    }
};
// admin only
const isAdmin = (req, res, next) => { //kiem tra xem co phai admin khong
    if(req.user.role !== "admin"){
        return res.status(403).json({message:"Access Denine, only for admin!"});
    }
    next();
}

module.exports = {verifyToken, isAdmin};
