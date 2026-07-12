const express = require('express');
const router = express.Router();
const appointmentController = require('../controller/appointmentController');
const verifyToken = require('../middleware/auth').verifyToken;

// Route tìm bệnh viện gần nhất (khoảng cách trong 10km)
router.get('/nearby-hospitals', verifyToken, appointmentController.getNearbyHospitals);

// Lấy danh sách bác sĩ của bệnh viện theo chuyên khoa
router.get('/hospitals/:hospitalId/doctors', verifyToken, appointmentController.getDoctorsByHospital);

// Đặt lịch khám mới (yêu cầu đăng nhập)
router.post('/book', verifyToken, appointmentController.bookAppointment);

// Xem lịch sử đặt lịch của tôi (yêu cầu đăng nhập)
router.get('/my-appointments', verifyToken, appointmentController.getMyAppointments);

// Xem danh sách lịch hẹn của bác sĩ đang đăng nhập
router.get('/doctor-appointments', verifyToken, appointmentController.getDoctorAppointments);

// Cập nhật trạng thái lịch hẹn
router.put('/:id/status', verifyToken, appointmentController.updateAppointmentStatus);

// Xem hồ sơ sức khỏe đầy đủ của bệnh nhân (chỉ bác sĩ)
router.get('/patient-health/:userId', verifyToken, appointmentController.getPatientHealthProfile);

// Lấy profile bác sĩ
router.get('/doctor/profile', verifyToken, appointmentController.getDoctorProfile);

// Cập nhật profile bác sĩ
router.put('/doctor/profile', verifyToken, appointmentController.updateDoctorProfile);

// Cập nhật chẩn đoán/đơn thuốc lịch hẹn
router.put('/:id/treatment', verifyToken, appointmentController.updateTreatment);

module.exports = router;

