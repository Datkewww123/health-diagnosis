const express = require('express');
const router = express.Router();
const medicineController = require('../controller/medicineController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// Tìm kiếm thuốc (Yêu cầu đăng nhập)
router.get('/', verifyToken, medicineController.searchMedicines);

// Thêm thuốc mới (Chỉ bác sĩ/admin)
router.post('/', verifyToken, isAdmin, medicineController.createMedicine);

module.exports = router;
