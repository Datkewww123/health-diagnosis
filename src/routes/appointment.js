const express = require('express');
const router = express.Router();
const appointmentController = require('../controller/appointmentController');
const verifyToken = require('../middleware/auth').verifyToken;

// Route tìm bệnh viện gần nhất (khoảng cách trong 10km)
router.get('/nearby-hospitals', appointmentController.getNearbyHospitals);

// Lấy danh sách bác sĩ của bệnh viện theo chuyên khoa
router.get('/hospitals/:hospitalId/doctors', appointmentController.getDoctorsByHospital);

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

module.exports = router;

