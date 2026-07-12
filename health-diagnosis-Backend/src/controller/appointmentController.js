const { sequelize } = require('../config/database');
const Hospital = require('../model/hospital');
const Doctor = require('../model/doctor');
const Appointment = require('../model/appointment');
const Disease = require('../model/diseases');
const { escapeLike } = require('../utils/sanitize');

// Hàm helper tính STT khám: Ưu tiên Service trước, Insurance sau
async function _calculateSTT(appointment) {
  const { doctor_id, appointment_date, appointment_time, payment_type, id } = appointment;
  const { Op } = require('sequelize');

  if (payment_type === 'service') {
    const count = await Appointment.count({
      where: {
        doctor_id,
        appointment_date,
        appointment_time,
        payment_type: 'service',
        id: { [Op.lte]: id },
        status: { [Op.ne]: 'cancelled' }
      }
    });
    return count;
  } else {
    const serviceCount = await Appointment.count({
      where: {
        doctor_id,
        appointment_date,
        appointment_time,
        payment_type: 'service',
        status: { [Op.ne]: 'cancelled' }
      }
    });
    const insuranceCount = await Appointment.count({
      where: {
        doctor_id,
        appointment_date,
        appointment_time,
        payment_type: 'insurance',
        id: { [Op.lte]: id },
        status: { [Op.ne]: 'cancelled' }
      }
    });
    return serviceCount + insuranceCount;
  }
}

class AppointmentController {
  // 1. Tìm bệnh viện gần nhất — gọi Overpass nếu chưa có trong DB
  async getNearbyHospitals(req, res) {
    try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Thiếu tọa độ GPS' });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'Tọa độ GPS không hợp lệ' });
    }

    const { Op } = require('sequelize');

    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 1) Tìm trong DB trước
    try {
      const dbHospitals = await Hospital.findAll({
        where: {
          latitude: { [Op.between]: [userLat - 1, userLat + 1] },
          longitude: { [Op.between]: [userLng - 1, userLng + 1] }
        }
      });
      if (dbHospitals.length > 0) {
        let list = dbHospitals.map(h => ({
          id: h.id, name: h.name, address: h.address,
          latitude: parseFloat(h.latitude), longitude: parseFloat(h.longitude),
          phone: h.phone || '', image_url: h.image_url || '', description: h.description || '',
          distance: Math.round(haversine(userLat, userLng, parseFloat(h.latitude), parseFloat(h.longitude)) * 10) / 10
        }));
        list.sort((a, b) => a.distance - b.distance);
        return res.json({ message: `Tìm thấy ${list.length} bệnh viện`, count: list.length, data: list });
      }
    } catch (dbErr) {
      console.error('[DB] Lỗi query hospital:', dbErr.message);
    }

    // 2) DB trống → gọi Overpass
    const https = require('https');
    const fetchOverpass = (url, queryBody, ms) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), ms);
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname, path: u.pathname + u.search,
        method: 'POST', timeout: ms,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          clearTimeout(timer);
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('JSON: ' + e.message)); }
        });
      });
      req.on('timeout', () => { req.destroy(); clearTimeout(timer); reject(new Error('Socket timeout')); });
      req.on('error', (e) => { clearTimeout(timer); reject(e); });
      req.write(queryBody);
      req.end();
    });

    const buildQuery = (radius) =>
      `[out:json][timeout:10];(node["amenity"="hospital"](around:${radius},${userLat},${userLng});way["amenity"="hospital"](around:${radius},${userLat},${userLng});node["healthcare"="hospital"](around:${radius},${userLat},${userLng});way["healthcare"="hospital"](around:${radius},${userLat},${userLng}););out center 100;`;

    const queryOverpass = async (radius) => {
      const body = `data=${encodeURIComponent(buildQuery(radius))}`;
      // Thử lần lượt từng server, không chạy song song
      const servers = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
      for (const server of servers) {
        try {
          const result = await fetchOverpass(server, body, 10000);
          if (result?.elements?.length > 0) {
            console.log(`[Overpass] ${server} trả về ${result.elements.length} elements (radius ${radius}m)`);
            return result.elements;
          }
        } catch (e) {
          console.warn(`[Overpass] ${server} lỗi: ${e.message}`);
        }
      }
      return [];
    };

    let elements = await queryOverpass(10000);
    if (elements.length === 0) {
      console.log('[Overpass] 10km trống, thử 50km...');
      elements = await queryOverpass(50000);
    }
    console.log(`[Overpass] Tổng elements hợp lệ: ${elements.length}`);

    if (elements.length === 0) {
      return res.json({ message: 'Không tìm thấy bệnh viện nào', count: 0, data: [] });
    }

    // 3) Lưu vào DB + build response
    const list = [];
    for (const el of elements) {
      if (!el.tags) continue;
      const name = el.tags.name || el.tags['name:vi'] || el.tags['name:en'] || 'Cơ sở y tế';
      const rawLat = el.lat ?? el.center?.lat;
      const rawLng = el.lon ?? el.center?.lon;
      if (rawLat == null || rawLng == null) continue;
      const lat = parseFloat(rawLat);
      const lng = parseFloat(rawLng);
      if (isNaN(lat) || isNaN(lng)) continue;

      const phone = el.tags.phone || el.tags['contact:phone'] || '';
      const address = [el.tags['addr:housenumber'], el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') || '';

      try {
        const [hospital] = await Hospital.findOrCreate({
          where: { name, latitude: Math.round(lat * 1e4) / 1e4, longitude: Math.round(lng * 1e4) / 1e4 },
          defaults: { name, address, latitude: lat, longitude: lng, location: sequelize.fn('ST_GeomFromText', `POINT(${lng} ${lat})`), phone }
        });
        list.push({
          id: hospital.id, name: hospital.name, address: hospital.address,
          latitude: parseFloat(hospital.latitude), longitude: parseFloat(hospital.longitude),
          phone: hospital.phone || '', image_url: hospital.image_url || '', description: hospital.description || '',
          distance: Math.round(haversine(userLat, userLng, lat, lng) * 10) / 10
        });
      } catch (dbErr) {
        console.warn(`[DB] Lỗi lưu hospital "${name}": ${dbErr.message}`);
      }
    }

    list.sort((a, b) => a.distance - b.distance);
    console.log(`[Overpass] Trả về ${list.length} bệnh viện cho user`);
    return res.json({ message: `Tìm thấy ${list.length} bệnh viện`, count: list.length, data: list });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi tìm bệnh viện gần' });
    }
  }

  // 2. Lấy danh sách bác sĩ của bệnh viện theo khoa
  async getDoctorsByHospital(req, res) {
    try {
      const { hospitalId } = req.params;
      const { specialty } = req.query;
      const { Op } = require('sequelize');

      const whereClause = { hospital_id: hospitalId };
      if (specialty) {
        const depts = specialty.split(/[\/,;\n]+/).map(s => s.trim()).filter(Boolean);
        if (depts.length > 0) {
          whereClause[Op.or] = depts.map(dept => ({
            specialty: { [Op.like]: `%${escapeLike(dept)}%` }
          }));
        }
      }

      const doctors = await Doctor.findAll({
        where: whereClause,
        include: [{ model: Hospital, attributes: ['name', 'address'] }]
      });

      return res.json({
        message: "Danh sách bác sĩ",
        count: doctors.length,
        data: doctors
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách bác sĩ:", err);
      return res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ" });
    }
  }



  // 3. Đặt lịch hẹn khám bệnh mới
  async bookAppointment(req, res) {
    try {
      const { 
        doctor_id, hospital_id, disease_id, disease_name, 
        appointment_date, appointment_time, notes, 
        payment_type, insurance_card_number 
      } = req.body;
      const userId = req.user.userId; // lấy từ middleware verifyToken

      if (!doctor_id || !hospital_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin đặt lịch khám!" });
      }

      // Giới hạn tối đa 10 ca khám cho cùng một khung giờ của bác sĩ
      const currentCount = await Appointment.count({
        where: {
          doctor_id,
          appointment_date,
          appointment_time,
          status: { [require('sequelize').Op.ne]: 'cancelled' } // Không tính ca đã hủy
        }
      });

      if (currentCount >= 10) {
        return res.status(400).json({
          message: "Khung giờ này của bác sĩ đã tiếp nhận đủ 10 bệnh nhân đăng ký. Vui lòng chọn khung giờ hoặc ngày khác!"
        });
      }

      // Xử lý an toàn: Chỉ gán disease_id vào DB MySQL nếu đó là số nguyên hợp lệ và thực sự tồn tại trong bảng diseases.
      // Nếu là chuỗi ICD-11 của WHO, ta sẽ lưu disease_id là null và ghi chú tên bệnh vào cột notes.
      let finalDiseaseId = null;
      let finalNotes = notes || '';
      const isIntegerId = /^\d+$/.test(String(disease_id));
      
      if (isIntegerId) {
        const DiseaseModel = require('../model/diseases');
        const exists = await DiseaseModel.findByPk(Number(disease_id));
        if (exists) {
          finalDiseaseId = Number(disease_id);
        }
      }

      // Nếu không có ID cục bộ nhưng có tên bệnh lý, bổ sung vào ghi chú
      if (!finalDiseaseId && disease_name) {
        if (!finalNotes.includes(disease_name)) {
          finalNotes = `[Bệnh lý: ${disease_name}] ${finalNotes}`.trim();
        }
      }

      // Tạo lịch hẹn mới
      const appointment = await Appointment.create({
        user_id: userId,
        doctor_id,
        hospital_id,
        disease_id: finalDiseaseId,
        appointment_date,
        appointment_time,
        notes: finalNotes,
        status: 'pending',
        payment_type: payment_type || 'service',
        insurance_card_number: payment_type === 'insurance' ? insurance_card_number : null
      });

      // Lấy thông tin chi tiết lịch hẹn vừa đặt để trả về
      const detailedAppointment = await Appointment.findByPk(appointment.id, {
        include: [
          { model: Doctor, attributes: ['name', 'specialty', 'fee'] },
          { model: Hospital, attributes: ['name', 'address'] },
          { model: Disease, attributes: ['name'] }
        ]
      });

      const sttVal = await _calculateSTT(appointment);
      const resData = detailedAppointment.toJSON();
      resData.stt_kham = sttVal;

      return res.status(201).json({
        message: "Đặt lịch khám thành công! Bệnh viện sẽ liên hệ xác nhận sớm nhất.",
        data: resData
      });

    } catch (err) {
      console.error("Lỗi đặt lịch hẹn:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi đặt lịch khám" });
    }
  }

  // 4. Lấy lịch sử khám bệnh của user đăng nhập
  async getMyAppointments(req, res) {
    try {
      const userId = req.user.userId;

      const appointments = await Appointment.findAll({
        where: { user_id: userId },
        include: [
          { model: Doctor, attributes: ['name', 'specialty', 'fee'] },
          { model: Hospital, attributes: ['name', 'address'] },
          { model: Disease, attributes: ['name'] }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
      });

      const dataWithSTT = [];
      for (const app of appointments) {
        const json = app.toJSON();
        json.stt_kham = await _calculateSTT(app);
        dataWithSTT.push(json);
      }

      return res.json({
        message: "Lịch sử đặt lịch khám của tôi",
        count: dataWithSTT.length,
        data: dataWithSTT
      });

    } catch (err) {
      console.error("Lỗi lấy lịch sử đặt lịch:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy lịch sử đặt lịch" });
    }
  }

  // 5. Lấy lịch hẹn của bác sĩ đang đăng nhập
  async getDoctorAppointments(req, res) {
    try {
      const userId = req.user.userId;
      const Doctor = require('../model/doctor');
      const Hospital = require('../model/hospital');
      const User = require('../model/user');
      const Disease = require('../model/diseases');

      // Tìm thông tin bác sĩ ứng với tài khoản đăng nhập này
      const doctor = await Doctor.findOne({ where: { user_id: userId } });
      if (!doctor) {
        return res.status(404).json({ message: "Tài khoản đăng nhập không phải bác sĩ hoặc chưa liên kết thông tin bác sĩ!" });
      }

      // Lấy danh sách lịch hẹn của bác sĩ này
      const appointments = await Appointment.findAll({
        where: { doctor_id: doctor.id },
        include: [
          { model: User, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
          { model: Hospital, attributes: ['name', 'address'], required: false },
          { model: Disease, attributes: ['name'], required: false }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
      });

      const dataWithSTT = [];
      for (const app of appointments) {
        const json = app.toJSON();
        json.stt_kham = await _calculateSTT(app);
        dataWithSTT.push(json);
      }

      return res.json({
        message: "Lịch hẹn dành cho bác sĩ",
        count: dataWithSTT.length,
        data: dataWithSTT
      });

    } catch (err) {
      console.error("Lỗi lấy lịch hẹn bác sĩ:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách lịch hẹn bác sĩ" });
    }
  }

  // 6. Lấy hồ sơ sức khỏe đầy đủ của bệnh nhân (dành cho bác sĩ)
  async getPatientHealthProfile(req, res) {
    try {
      const { userId: patientUserId } = req.params;
      const doctorUserId = req.user.userId;
      const Doctor = require('../model/doctor');
      const User = require('../model/user');
      const History = require('../model/history');
      const Disease = require('../model/diseases');
      const Hospital = require('../model/hospital');

      // Chỉ bác sĩ mới được xem hồ sơ bệnh nhân
      const doctor = await Doctor.findOne({ where: { user_id: doctorUserId } });
      if (!doctor) {
        return res.status(403).json({ message: 'Chỉ bác sĩ mới có quyền xem hồ sơ bệnh nhân.' });
      }

      // Kiểm tra bệnh nhân có lịch hẹn với bác sĩ này không
      const hasAppointment = await Appointment.findOne({
        where: { user_id: patientUserId, doctor_id: doctor.id }
      });
      if (!hasAppointment) {
        return res.status(403).json({ message: "Không có quyền xem hồ sơ bệnh nhân này" });
      }

      // Lấy thông tin cơ bản của bệnh nhân
      const patient = await User.findByPk(patientUserId, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'height', 'weight']
      });
      if (!patient) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin bệnh nhân.' });
      }

      // Lấy lịch sử chẩn đoán/tìm kiếm bệnh của bệnh nhân
      const diagnosisHistory = await History.findAll({
        where: { user_id: patientUserId },
        order: [['createdAt', 'DESC']],
        limit: 20,
        attributes: ['id', 'type', 'query_text', 'disease_name', 'input_symptoms', 'createdAt']
      });

      // Lấy lịch sử lịch hẹn của bệnh nhân với bác sĩ này (hoặc toàn bộ)
      const appointmentHistory = await Appointment.findAll({
        where: { user_id: patientUserId },
        include: [
          { model: Doctor, attributes: ['name', 'specialty'] },
          { model: Hospital, attributes: ['name', 'address'] },
          { model: Disease, attributes: ['name'] }
        ],
        order: [['appointment_date', 'DESC']],
        limit: 10
      });

      // Tính toán BMI nếu có đủ dữ liệu
      let bmi = null;
      if (patient.height && patient.weight && patient.height > 0) {
        const heightM = patient.height / 100;
        bmi = Math.round((patient.weight / (heightM * heightM)) * 10) / 10;
      }

      return res.json({
        message: 'Hồ sơ sức khỏe bệnh nhân',
        data: {
          patient: { ...patient.toJSON(), bmi },
          diagnosisHistory,
          appointmentHistory
        }
      });

    } catch (err) {
      console.error('Lỗi lấy hồ sơ bệnh nhân:', err);
      return res.status(500).json({ message: 'Lỗi hệ thống khi lấy hồ sơ bệnh nhân.' });
    }
  }

  // 7. Cập nhật trạng thái lịch hẹn
  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;
      const Doctor = require('../model/doctor');

      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Trạng thái lịch khám không hợp lệ!" });
      }

      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({ message: "Không tìm thấy lịch hẹn khám!" });
      }

      // Xác thực: Chỉ có bác sĩ của lịch hẹn đó hoặc chính bệnh nhân đã đặt (đối với hành động huỷ) mới được cập nhật
      const doctor = await Doctor.findOne({ where: { user_id: userId } });
      const isDoctorOwner = doctor && appointment.doctor_id === doctor.id;
      const isPatientOwner = appointment.user_id === userId;

      if (!isDoctorOwner && !isPatientOwner) {
        return res.status(403).json({ message: "Bạn không có quyền cập nhật lịch hẹn này!" });
      }

      // Bệnh nhân chỉ được phép huỷ lịch hẹn (status = cancelled)
      if (isPatientOwner && !isDoctorOwner && status !== 'cancelled') {
        return res.status(403).json({ message: "Bệnh nhân chỉ được quyền tự huỷ lịch hẹn!" });
      }

      appointment.status = status;
      await appointment.save();

      return res.json({
        message: "Cập nhật trạng thái lịch khám thành công!",
        data: appointment
      });

    } catch (err) {
      console.error("Lỗi cập nhật trạng thái lịch hẹn:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật lịch khám" });
    }
  }

  // 8. Cập nhật ghi chú kết quả khám và đơn thuốc (Tự động trừ kho thuốc bệnh viện)
  async updateTreatment(req, res) {
    try {
      const { id } = req.params;
      const { result_notes, prescription } = req.body;
      const userId = req.user.userId;
      const Doctor = require('../model/doctor');
      const Medicine = require('../model/medicine');

      const t = await sequelize.transaction();
      try {
        const appointment = await Appointment.findByPk(id, { transaction: t });
        if (!appointment) {
          await t.rollback();
          return res.status(404).json({ message: "Không tìm thấy lịch hẹn!" });
        }

        // Xác thực: Chỉ bác sĩ nhận ca khám này mới được ghi chẩn đoán
        const doctor = await Doctor.findOne({ where: { user_id: userId }, transaction: t });
        if (!doctor || appointment.doctor_id !== doctor.id) {
          await t.rollback();
          return res.status(403).json({ message: "Bạn không có quyền kê đơn/chẩn đoán cho ca khám này!" });
        }

        appointment.result_notes = result_notes || '';
        appointment.prescription = prescription || '';
        appointment.status = 'completed';
        await appointment.save({ transaction: t });

        // --- LOGIC TỰ ĐỘNG KHẤU TRỪ KHO THUỐC BỆNH VIỆN ---
        if (prescription && doctor.hospital_id) {
          try {
            const list = JSON.parse(prescription);
            if (Array.isArray(list)) {
              for (const item of list) {
                const medName = item.name;
                const qtyToDeduct = parseInt(item.qty) || 0;

                if (medName && qtyToDeduct > 0) {
                  await Medicine.update(
                    { quantity: sequelize.literal(`quantity - ${qtyToDeduct}`) },
                    {
                      where: { name: medName, hospital_id: doctor.hospital_id, quantity: { [require('sequelize').Op.gte]: qtyToDeduct } },
                      transaction: t
                    }
                  );
                  console.log(`[Auto-Deduct] Hospital ${doctor.hospital_id}: Deducted ${qtyToDeduct} of ${medName}`);
                }
              }
            }
          } catch (parseErr) {
            console.warn("[Auto-Deduct] Lỗi parse đơn thuốc hoặc trừ kho:", parseErr.message);
          }
        }

        await t.commit();

        return res.json({
          message: "Cập nhật thông tin chẩn đoán và kê đơn thành công! Kho thuốc bệnh viện đã được khấu trừ tự động.",
          data: appointment
        });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      console.error("Lỗi cập nhật điều trị:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông tin điều trị" });
    }
  }

  // 9. Lấy hồ sơ thông tin của bác sĩ đang đăng nhập
  async getDoctorProfile(req, res) {
    try {
      const userId = req.user.userId;
      const Doctor = require('../model/doctor');
      const Hospital = require('../model/hospital');

      const doctor = await Doctor.findOne({
        where: { user_id: userId },
        include: [{ model: Hospital, attributes: ['name', 'address'] }]
      });

      if (!doctor) {
        return res.status(404).json({ message: "Không tìm thấy hồ sơ bác sĩ của tài khoản này!" });
      }

      return res.json({
        message: "Hồ sơ bác sĩ",
        data: doctor
      });
    } catch (err) {
      console.error("Lỗi lấy profile bác sĩ:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin bác sĩ" });
    }
  }

  // 10. Cập nhật hồ sơ thông tin bác sĩ
  async updateDoctorProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { specialty, phone, experience_years, fee, bio } = req.body;
      const Doctor = require('../model/doctor');

      const doctor = await Doctor.findOne({ where: { user_id: userId } });
      if (!doctor) {
        return res.status(404).json({ message: "Không tìm thấy hồ sơ bác sĩ để cập nhật!" });
      }

      if (specialty !== undefined) doctor.specialty = specialty;
      if (phone !== undefined) doctor.phone = phone;
      if (experience_years !== undefined) doctor.experience_years = Number(experience_years);
      if (fee !== undefined) doctor.fee = Number(fee);
      if (bio !== undefined) doctor.bio = bio;

      await doctor.save();

      return res.json({
        message: "Cập nhật thông tin hồ sơ bác sĩ thành công!",
        data: doctor
      });
    } catch (err) {
      console.error("Lỗi cập nhật profile bác sĩ:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật hồ sơ bác sĩ" });
    }
  }
}

module.exports = new AppointmentController();
