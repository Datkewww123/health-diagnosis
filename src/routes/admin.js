const express = require("express");
const router = express.Router(); // tao 1 router rieng 
const { verifyToken, isAdmin } = require("../middleware/auth");

router.get('/dashboard', verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Welcome admin!", user: req.user });
});

module.exports = router;
