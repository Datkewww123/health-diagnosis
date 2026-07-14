const Express = require('express');
const router = Express.Router();
const adminController = require('../controller/adminController');
const{isAdmin} = require('../middleware/isAdmin');
const{verifyToken} = require('../middleware/auth');

const validateBody = (requiredFields) => (req, res, next) => {
  const missing = requiredFields.filter(field => !req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim()));
  if (missing.length > 0) {
    return res.status(400).json({ message: `Thiếu trường bắt buộc: ${missing.join(', ')}` });
  }
  next();
};

    //ham lay tat ca cac benh
    router.get('/all', verifyToken, isAdmin, adminController.getAllDiseases);
    router.get('/disease/:id', verifyToken, isAdmin, adminController.getDiseaseById);

    // Thống kê tổng quan
    router.get('/stats', verifyToken, isAdmin, adminController.getAdminStats);

    // Bác sĩ
    router.get('/doctors', verifyToken, isAdmin, adminController.getAllDoctors);
    router.post('/doctors', verifyToken, isAdmin, validateBody(['first_name', 'last_name']), adminController.createDoctor);
    router.put('/doctors/:id', verifyToken, isAdmin, adminController.updateDoctor);
    router.delete('/doctors/:id', verifyToken, isAdmin, adminController.deleteDoctor);

    // Bệnh viện
    router.get('/hospitals', verifyToken, isAdmin, adminController.getAllHospitals);
    router.post('/hospitals', verifyToken, isAdmin, validateBody(['name']), adminController.createHospital);
    router.put('/hospitals/:id', verifyToken, isAdmin, adminController.updateHospital);
    router.delete('/hospitals/:id', verifyToken, isAdmin, adminController.deleteHospital);
    router.post('/hospitals/sync-overpass', verifyToken, isAdmin, adminController.syncHospitalsFromOverpass);

    // Kho thuốc
    router.get('/medicines', verifyToken, isAdmin, adminController.getAllMedicines);
    router.post('/medicines', verifyToken, isAdmin, validateBody(['name']), adminController.addMedicine);
    router.patch('/medicines/:id', verifyToken, isAdmin, adminController.updateMedicineStock);
    router.delete('/medicines/:id', verifyToken, isAdmin, adminController.deleteMedicine);

    // Lịch hẹn khám
    router.get('/appointments', verifyToken, isAdmin, adminController.getAllAppointments);

    // Tự động đồng bộ hoá AI
    router.post('/diseases/sync-auto', verifyToken, isAdmin, adminController.syncAutoDisease);

module.exports = router;
