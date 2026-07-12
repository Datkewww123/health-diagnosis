const Medicine = require('../model/medicine');
const { Op } = require('sequelize');
const { escapeLike } = require('../utils/sanitize');

class MedicineController {
  // Lấy danh sách thuốc hoặc tìm kiếm theo tên (Lọc theo bệnh viện của Bác sĩ/Admin đăng nhập)
  async searchMedicines(req, res) {
    try {
      const { q } = req.query;
      const Doctor = require('../model/doctor');
      const User = require('../model/user');
      
      const userId = req.user.userId;
      let hospitalId = null;

      // 1. Kiểm tra xem người gọi có phải bác sĩ không
      const doctor = await Doctor.findOne({ where: { user_id: userId } });
      if (doctor) {
        hospitalId = doctor.hospital_id;
      } else {
        // 2. Nếu không phải bác sĩ, kiểm tra xem có phải admin bệnh viện không
        const user = await User.findByPk(userId);
        if (user && user.hospital_id) {
          hospitalId = user.hospital_id;
        }
      }

      const whereClause = {};
      if (hospitalId) {
        whereClause.hospital_id = hospitalId;
      }

      if (q) {
        whereClause.name = {
          [Op.like]: `%${escapeLike(q)}%`
        };
      }

      const medicines = await Medicine.findAll({
        where: whereClause,
        limit: 25,
        order: [['name', 'ASC']]
      });

      return res.json({
        message: "Danh sách thuốc bệnh viện",
        count: medicines.length,
        data: medicines
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách thuốc:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi tìm kiếm thuốc." });
    }
  }

  // Thêm thuốc mới (cho admin/bác sĩ nếu cần)
  async createMedicine(req, res) {
    try {
      const { name, unit, default_instruction } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Tên thuốc là bắt buộc!" });
      }

      const [medicine, created] = await Medicine.findOrCreate({
        where: { name },
        defaults: { unit, default_instruction }
      });

      return res.status(201).json({
        message: created ? "Thêm thuốc thành công!" : "Thuốc đã tồn tại trong danh mục.",
        data: medicine
      });
    } catch (err) {
      console.error("Lỗi thêm thuốc:", err);
      return res.status(500).json({ message: "Lỗi hệ thống khi thêm thuốc." });
    }
  }
}

module.exports = new MedicineController();
