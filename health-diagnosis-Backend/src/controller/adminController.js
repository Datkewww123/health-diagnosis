const Disease = require('../model/diseases');
const { escapeLike } = require('../utils/sanitize');

function parseField(field) {
  if (!field) return "";
  if (Array.isArray(field)) return field.join(", ");
  if (typeof field === "string") return field;
  return "";
}

function formatField(field) {
  if (!field) return [];
  return field.split(",").map(s => s.trim());
}

class AdminController {
  async getAllDiseases(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count: total, rows: diseases } = await Disease.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      const formatted = diseases.map(d => ({
        _id: d.id, // giữ _id tương thích
        name: d.name,
        overview: d.overview,
        image_url: d.image_url,
        diagnosis: formatField(d.diagnosis),
        symptoms: formatField(d.symptoms),
        causes: formatField(d.causes),
        treatment: formatField(d.treatment),
        doctors: formatField(d.doctors),
        departments: formatField(d.departments),
        Precaution_1: d.precaution_1,
        Precaution_2: d.precaution_2,
        Precaution_3: d.precaution_3,
        Precaution_4: d.precaution_4
      }));

      return res.json({
        count: formatted.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        diseases: formatted
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách bệnh lý" });
    }
  }

  async getDiseaseById(req, res) {
    try {
      const diseaseId = req.params.id;
      const d = await Disease.findByPk(diseaseId);
      if (!d) return res.status(404).json({ message: "Bệnh không tồn tại!" });

      const formatted = {
        _id: d.id,
        name: d.name,
        overview: d.overview,
        image_url: d.image_url,
        diagnosis: formatField(d.diagnosis),
        symptoms: formatField(d.symptoms),
        causes: formatField(d.causes),
        treatment: formatField(d.treatment),
        doctors: formatField(d.doctors),
        departments: formatField(d.departments),
        Precaution_1: d.precaution_1,
        Precaution_2: d.precaution_2,
        Precaution_3: d.precaution_3,
        Precaution_4: d.precaution_4
      };

      return res.json({ disease: formatted });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết bệnh lý" });
    }
  }

  // --- THỐNG KÊ TỔNG QUAN ---
  async getAdminStats(req, res) {
    try {
      const Doctor = require('../model/doctor');
      const Hospital = require('../model/hospital');
      const Medicine = require('../model/medicine');
      const Appointment = require('../model/appointment');
      const User = require('../model/user');

      const user = await User.findByPk(req.user.userId);
      
      let docWhere = {};
      let medWhere = {};
      let appWhere = {};
      let hospCount = 0;

      if (user && user.hospital_id) {
        // Admin của 1 bệnh viện cụ thể
        docWhere = { hospital_id: user.hospital_id };
        medWhere = { hospital_id: user.hospital_id };
        appWhere = { hospital_id: user.hospital_id };
        hospCount = 1; // Chỉ quản lý duy nhất bệnh viện mình
      } else {
        // Admin tổng
        hospCount = await Hospital.count();
      }

      const doctorsCount = await Doctor.count({ where: docWhere });
      const medicinesCount = await Medicine.count({ where: medWhere });

      const { sequelize } = require('../config/database');
      const statusCounts = await Appointment.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: appWhere,
        group: ['status'],
        raw: true
      });
      const stats = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, total: 0 };
      statusCounts.forEach(row => {
        stats[row.status] = parseInt(row.count);
        stats.total += parseInt(row.count);
      });

      return res.json({
        doctors: doctorsCount,
        hospitals: hospCount,
        medicines: medicinesCount,
        appointments: stats.total,
        statusStats: {
          pending: stats.pending,
          confirmed: stats.confirmed,
          completed: stats.completed,
          cancelled: stats.cancelled
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi lấy số liệu thống kê tổng quan" });
    }
  }

  // --- QUẢN LÝ BÁC SĨ ---
  async getAllDoctors(req, res) {
    try {
      const User = require('../model/user');
      const Doctor = require('../model/doctor');
      const Hospital = require('../model/hospital');

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const offset = (page - 1) * limit;

      const user = await User.findByPk(req.user.userId);
      let queryOptions = {
        include: [
          { model: User, attributes: ['first_name', 'last_name', 'email', 'phone', 'username'] },
          { model: Hospital, attributes: ['name'] }
        ],
        limit,
        offset,
        order: [['id', 'DESC']]
      };

      if (user && user.hospital_id) {
        queryOptions.where = { hospital_id: user.hospital_id };
      }

      const { count: total, rows: doctors } = await Doctor.findAndCountAll(queryOptions);
      return res.json({
        doctors,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi lấy danh sách bác sĩ" });
    }
  }

  async createDoctor(req, res) {
    try {
      const User = require('../model/user');
      const Doctor = require('../model/doctor');
      const bcrypt = require('bcrypt');
      const { first_name, last_name, username, email, phone, password, specialty, hospital_id } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ username, password, email!" });
      }

      const exist = await User.findOne({ where: { username } });
      if (exist) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });

      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        first_name,
        last_name,
        username,
        email,
        phone,
        password: hash,
        role: 'doctor',
        address: 'Bệnh viện công tác'
      });

      const doctor = await Doctor.create({
        user_id: user.id,
        name: `${last_name || ''} ${first_name || ''}`.trim() || 'Chưa cập nhật',
        specialty: specialty || "Đa khoa",
        hospital_id: hospital_id || null,
        experience_years: 5
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();
      return res.status(201).json({ message: "Tạo tài khoản Bác sĩ thành công!", user: userWithoutPassword, doctor });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi tạo bác sĩ mới" });
    }
  }

  // --- QUẢN LÝ BỆNH VIỆN ---
  async getAllHospitals(req, res) {
    try {
      const Hospital = require('../model/hospital');
      const User = require('../model/user');

      const user = await User.findByPk(req.user.userId);
      let queryOptions = {};

      if (user && user.hospital_id) {
        queryOptions.where = { id: user.hospital_id };
      }

      const hospitals = await Hospital.findAll(queryOptions);
      return res.json({ hospitals });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi lấy danh sách bệnh viện" });
    }
  }

  async createHospital(req, res) {
    try {
      const Hospital = require('../model/hospital');
      const { name, address, city, location, phone, image_url, latitude, longitude } = req.body;

      if (!name || !address) {
        return res.status(400).json({ message: "Tên bệnh viện và địa chỉ là bắt buộc!" });
      }

      const hospLatitude = parseFloat(latitude) || 10.7769;
      const hospLongitude = parseFloat(longitude) || 106.7009;

      const hospital = await Hospital.create({
        name,
        address,
        phone,
        latitude: hospLatitude,
        longitude: hospLongitude
      });

      return res.status(201).json({ message: "Thêm bệnh viện mới thành công!", hospital });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi thêm bệnh viện mới" });
    }
  }

  async deleteHospital(req, res) {
    try {
      const Hospital = require('../model/hospital');
      const { id } = req.params;

      const deletedCount = await Hospital.destroy({ where: { id } });
      if (deletedCount === 0) {
        return res.status(404).json({ message: "Bệnh viện không tồn tại!" });
      }

      return res.json({ message: "Xóa bệnh viện liên kết thành công!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi xóa bệnh viện" });
    }
  }

  async updateDoctor(req, res) {
    try {
      const Doctor = require('../model/doctor');
      const User = require('../model/user');
      const { id } = req.params;
      const { first_name, last_name, email, phone, specialty, hospital_id } = req.body;

      const doctor = await Doctor.findByPk(id);
      if (!doctor) return res.status(404).json({ message: "Không tìm thấy bác sĩ!" });

      const user = await User.findByPk(doctor.user_id);
      if (user) {
        user.first_name = first_name !== undefined ? first_name : user.first_name;
        user.last_name = last_name !== undefined ? last_name : user.last_name;
        user.email = email !== undefined ? email : user.email;
        user.phone = phone !== undefined ? phone : user.phone;
        await user.save();
      }

      doctor.name = `${last_name || user?.last_name || ''} ${first_name || user?.first_name || ''}`.trim() || doctor.name;
      doctor.specialty = specialty || doctor.specialty;
      doctor.hospital_id = hospital_id !== undefined ? hospital_id : doctor.hospital_id;
      await doctor.save();

      return res.json({ message: "Cập nhật thông tin bác sĩ thành công!", doctor });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bác sĩ" });
    }
  }

  async deleteDoctor(req, res) {
    try {
      const Doctor = require('../model/doctor');
      const User = require('../model/user');
      const { id } = req.params;

      const doctor = await Doctor.findByPk(id);
      if (!doctor) return res.status(404).json({ message: "Không tìm thấy bác sĩ!" });

      await User.destroy({ where: { id: doctor.user_id } });
      return res.json({ message: "Xóa bác sĩ thành công!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi xóa bác sĩ" });
    }
  }

  async updateHospital(req, res) {
    try {
      const Hospital = require('../model/hospital');
      const { id } = req.params;
      const { name, address, phone, latitude, longitude } = req.body;

      const hospital = await Hospital.findByPk(id);
      if (!hospital) return res.status(404).json({ message: "Không tìm thấy bệnh viện!" });

      hospital.name = name || hospital.name;
      hospital.address = address || hospital.address;
      hospital.phone = phone || hospital.phone;
      if (latitude !== undefined) hospital.latitude = parseFloat(latitude);
      if (longitude !== undefined) hospital.longitude = parseFloat(longitude);
      await hospital.save();

      return res.json({ message: "Cập nhật thông tin bệnh viện thành công!", hospital });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bệnh viện" });
    }
  }

  // --- QUẢN LÝ KHO THUỐC ---
  async getAllMedicines(req, res) {
    try {
      const Medicine = require('../model/medicine');
      const User = require('../model/user');
      const { Op } = require('sequelize');
      
      const user = await User.findByPk(req.user.userId);
      
      // Query parameters phục vụ phân trang và tìm kiếm
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      const whereConditions = {};
      
      // Phân quyền: Admin bệnh viện chỉ xem thuốc của bệnh viện mình
      if (user && user.hospital_id) {
        whereConditions.hospital_id = user.hospital_id;
      }

      // Tìm kiếm theo tên hoặc mã thuốc
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.like]: `%${escapeLike(search)}%` } },
          { code: { [Op.like]: `%${escapeLike(search)}%` } }
        ];
      }

      const { count: total, rows: medicines } = await Medicine.findAndCountAll({
        where: whereConditions,
        limit,
        offset,
        order: [['name', 'ASC'], ['id', 'ASC']]
      });

      return res.json({
        medicines,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi lấy danh sách kho thuốc" });
    }
  }

  async updateMedicineStock(req, res) {
    try {
      const Medicine = require('../model/medicine');
      const { id } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ message: "Số lượng phải là số nguyên không âm" });
      }

      const med = await Medicine.findByPk(id);
      if (!med) return res.status(404).json({ message: "Thuốc không tồn tại trong kho!" });

      await Medicine.update({ quantity: Number(quantity) }, { where: { id } });
      return res.json({ message: "Cập nhật tồn kho thuốc thành công!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi cập nhật tồn kho thuốc" });
    }
  }

  async addMedicine(req, res) {
    try {
      const Medicine = require('../model/medicine');
      const User = require('../model/user');

      const adminUser = await User.findByPk(req.user.userId);
      const { name, unit, code, quantity, default_instruction } = req.body;

      if (!name || !unit) {
        return res.status(400).json({ message: "Tên thuốc và đơn vị tính là bắt buộc!" });
      }

      const hospital_id = adminUser?.hospital_id || null;

      const medicine = await Medicine.create({
        name,
        unit: unit || 'vỉ',
        code: code || `VN-${name.toUpperCase().replace(/\s+/g, '-')}-${hospital_id || 'GLOBAL'}`,
        quantity: Number(quantity) || 300,
        default_instruction: default_instruction || 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn.',
        hospital_id
      });

      return res.status(201).json({ message: "Thêm thuốc mới vào kho thành công!", medicine });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi thêm thuốc mới" });
    }
  }

  async deleteMedicine(req, res) {
    try {
      const Medicine = require('../model/medicine');
      const { id } = req.params;

      const deletedCount = await Medicine.destroy({ where: { id } });
      if (deletedCount === 0) return res.status(404).json({ message: "Thuốc không tồn tại trong kho!" });

      return res.json({ message: "Xóa thuốc khỏi kho thành công!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi khi xóa thuốc" });
    }
  }

  // --- TỰ ĐỘNG ĐỒNG BỘ HO HOÁ AI Y TẾ & BỆNH LÝ ---
  async syncAutoDisease(req, res) {
    try {
      const User = require('../model/user');
      const user = await User.findByPk(req.user.userId);

      // Nếu có hospital_id -> Admin bệnh viện (Không được phép dùng API này)
      if (user && user.hospital_id) {
        return res.status(403).json({ message: "Chỉ Super Admin (Quản trị viên tối cao) mới có quyền đồng bộ Y khoa AI!" });
      }

      const { diseaseName } = req.body;

      // Danh mục tri thức y khoa phổ biến tích hợp sẵn
      const simulatedDatabase = {
        "sốt xuất huyết": {
          overview: "Sốt xuất huyết Dengue là bệnh truyền nhiễm cấp tính do virus Dengue gây ra và muỗi vằn là vật trung gian truyền bệnh.",
          symptoms: "Sốt cao đột ngột, Đau đầu, Phát ban, Đau cơ khớp, Xuất huyết dưới da, Chảy máu cam",
          causes: "Do virus Dengue truyền qua vết cắn của muỗi vằn Aedes aegypti nhiễm bệnh.",
          treatment: "Nghỉ ngơi, hạ sốt bằng Paracetamol (tránh Aspirin/Ibuprofen), bù nước điện giải (Oresol) nhiều nhất có thể.",
          precaution_1: "Diệt muỗi, diệt lăng quăng, bọ gậy.",
          precaution_2: "Mặc quần áo dài tay, ngủ màn tránh muỗi đốt."
        },
        "đau dạ dày": {
          overview: "Đau dạ dày là hiện tượng niêm mạc dạ dày bị tổn thương, viêm loét gây đau âm ỉ hoặc thượng vị khó chịu.",
          symptoms: "Đau thượng vị, Đầy hơi, Khó tiêu, Buồn nôn, Ợ chua, Chán ăn",
          causes: "Do vi khuẩn HP, thói quen ăn uống không lành mạnh, stress kéo dài hoặc lạm dụng thuốc giảm đau.",
          treatment: "Sử dụng thuốc kháng acid, thuốc ức chế bơm proton PPI (như Omeprazole), ăn đồ mềm dễ tiêu hóa.",
          precaution_1: "Ăn đúng giờ, tránh bỏ bữa.",
          precaution_2: "Hạn chế đồ ăn cay nóng, nhiều dầu mỡ, tránh căng thẳng."
        },
        "cúm a": {
          overview: "Cúm A là bệnh nhiễm trùng đường hô hấp cấp tính do các chủng virus cúm A (như H1N1, H5N1) gây ra.",
          symptoms: "Sốt, Ho, Đau họng, Nghẹt mũi, Đau mỏi người, Mệt mỏi",
          causes: "Virus lây truyền trực tiếp qua đường hô hấp khi người bệnh ho, hắt hơi.",
          treatment: "Uống nhiều nước, dùng thuốc hạ sốt giảm đau, cách ly nghỉ ngơi, sử dụng Tamiflu khi có chỉ định bác sĩ.",
          precaution_1: "Tiêm vắc xin cúm hàng năm.",
          precaution_2: "Rửa tay thường xuyên bằng xà phòng, đeo khẩu trang nơi đông người."
        },
        "tiểu đường": {
          overview: "Tiểu đường (đái tháo đường) là một bệnh lý mãn tính xảy ra khi tuyến tụy không sản xuất đủ insulin hoặc cơ thể sử dụng không hiệu quả.",
          symptoms: "Khát nước nhiều, Đi tiểu thường xuyên, Sụt cân không rõ lý do, Mắt mờ, Mệt mỏi kéo dài",
          causes: "Do di truyền, lối sống ít vận động, béo phì hoặc rối loạn tự miễn dịch làm phá hủy tế bào beta tuyến tụy.",
          treatment: "Thay đổi chế độ ăn hạn chế đường bột, tập thể dục đều đặn, tiêm insulin hoặc uống thuốc hạ đường huyết theo chỉ định.",
          precaution_1: "Duy trì cân nặng hợp lý.",
          precaution_2: "Hạn chế thức ăn nhiều đường và chất béo bão hòa."
        },
        "tăng huyết áp": {
          overview: "Tăng huyết áp là trạng thái áp lực máu đẩy vào thành động mạch liên tục ở mức quá cao, dễ dẫn đến biến chứng tim mạch.",
          symptoms: "Đau đầu vùng chẩm, Chóng mặt, Ù tai, Hoa mắt, Khó thở nhẹ khi gắng sức",
          causes: "Lối sống ít vận động, căng thẳng thần kinh kéo dài, ăn quá nhiều muối, béo phì hoặc do tuổi tác.",
          treatment: "Sử dụng thuốc hạ áp hàng ngày đều đặn theo đơn bác sĩ, giảm muối trong chế độ ăn, hạn chế bia rượu.",
          precaution_1: "Ăn nhạt (dưới 5g muối/ngày).",
          precaution_2: "Kiểm tra huyết áp định kỳ tại nhà."
        }
      };

      // TH1: Đồng bộ TOÀN BỘ danh mục có sẵn
      if (!diseaseName) {
        let createdCount = 0;
        let updatedCount = 0;

        for (const [name, info] of Object.entries(simulatedDatabase)) {
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
          const [disease, created] = await Disease.findOrCreate({
            where: { name: formattedName },
            defaults: {
              name: formattedName,
              overview: info.overview,
              symptoms: info.symptoms,
              causes: info.causes,
              treatment: info.treatment,
              diagnosis: "Chẩn đoán lâm sàng dựa trên các triệu chứng kết hợp cận lâm sàng tương ứng.",
              precaution_1: info.precaution_1,
              precaution_2: info.precaution_2
            }
          });

          if (!created) {
            await Disease.update({
              overview: info.overview,
              symptoms: info.symptoms,
              causes: info.causes,
              treatment: info.treatment,
              precaution_1: info.precaution_1,
              precaution_2: info.precaution_2
            }, { where: { id: disease.id } });
            updatedCount++;
          } else {
            createdCount++;
          }
        }

        return res.json({ 
          message: `Đồng bộ hệ thống AI hoàn tất! Đã thêm mới ${createdCount} bệnh lý, cập nhật ${updatedCount} bệnh lý y học.`,
          success: true
        });
      }

      // TH2: Đồng bộ duy nhất một bệnh cụ thể do người dùng nhập
      const key = diseaseName.toLowerCase().trim();
      let diseaseData = simulatedDatabase[key];

      if (!diseaseData) {
        diseaseData = {
          overview: `Bệnh ${diseaseName} là một tình trạng y khoa đang được nghiên cứu. Cần theo dõi sát sao sức khỏe lâm sàng của bệnh nhân.`,
          symptoms: "Sốt nhẹ, Mệt mỏi, Đau đầu, Chán ăn",
          causes: `Tác nhân gây bệnh ${diseaseName} đang được chẩn đoán chi tiết qua các xét nghiệm cận lâm sàng.`,
          treatment: "Nghỉ ngơi tại chỗ, bổ sung dinh dưỡng và vitamin tăng sức đề kháng.",
          precaution_1: "Giữ gìn vệ sinh cá nhân sạch sẽ.",
          precaution_2: "Khám sức khỏe định kỳ để phát hiện sớm."
        };
      }

      const formattedName = diseaseName.trim().charAt(0).toUpperCase() + diseaseName.trim().slice(1);
      const [disease, created] = await Disease.findOrCreate({
        where: { name: formattedName },
        defaults: {
          name: formattedName,
          overview: diseaseData.overview,
          symptoms: diseaseData.symptoms,
          causes: diseaseData.causes,
          treatment: diseaseData.treatment,
          diagnosis: "Chẩn đoán lâm sàng dựa trên triệu chứng và xét nghiệm máu công thức.",
          precaution_1: diseaseData.precaution_1,
          precaution_2: diseaseData.precaution_2
        }
      });

      if (!created) {
        await Disease.update({
          overview: diseaseData.overview,
          symptoms: diseaseData.symptoms,
          causes: diseaseData.causes,
          treatment: diseaseData.treatment,
          precaution_1: diseaseData.precaution_1,
          precaution_2: diseaseData.precaution_2
        }, { where: { id: disease.id } });
      }

      return res.json({ 
        message: `Đồng bộ tri thức AI cho bệnh "${formattedName}" thành công!`,
        success: true
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi hệ thống khi tự động đồng bộ hóa AI" });
    }
  }

  // --- QUẢN LÝ LỊCH HẸN KHÁM ---
  async getAllAppointments(req, res) {
    try {
      const Appointment = require('../model/appointment');
      const User = require('../model/user');
      const Doctor = require('../model/doctor');
      const Hospital = require('../model/hospital');
      const { Op, fn, col, where: sqWhere } = require('sequelize');

      const adminUser = await User.findByPk(req.user.userId);

      // Query params
      const page         = parseInt(req.query.page)  || 1;
      const limit        = parseInt(req.query.limit) || 10;
      const offset       = (page - 1) * limit;
      const filterDay    = req.query.day    ? parseInt(req.query.day)   : null;
      const filterMonth  = req.query.month  ? parseInt(req.query.month) : null;
      const filterYear   = req.query.year   ? parseInt(req.query.year)  : null;
      const filterStatus = req.query.status || null;

      // Build where array — dùng Sequelize.where() với fn() cho cột DATE
      const andConditions = [];

      // Phân quyền bệnh viện
      if (adminUser && adminUser.hospital_id) {
        andConditions.push({ hospital_id: adminUser.hospital_id });
      }

      // Lọc theo năm
      if (filterYear) {
        andConditions.push(sqWhere(fn('YEAR', col('Appointment.appointment_date')), filterYear));
      }

      // Lọc theo tháng
      if (filterMonth) {
        andConditions.push(sqWhere(fn('MONTH', col('Appointment.appointment_date')), filterMonth));
      }

      // Lọc theo ngày
      if (filterDay) {
        andConditions.push(sqWhere(fn('DAY', col('Appointment.appointment_date')), filterDay));
      }

      // Lọc theo trạng thái (ENUM: pending | confirmed | completed | cancelled)
      if (filterStatus && filterStatus !== 'all') {
        if (filterStatus === 'approved') {
          // "approved" trong UI tương ứng "confirmed" trong DB
          andConditions.push({ status: 'confirmed' });
        } else {
          andConditions.push({ status: filterStatus });
        }
      }

      const { count: total, rows: appointments } = await Appointment.findAndCountAll({
        where: andConditions.length > 0 ? { [Op.and]: andConditions } : {},
        limit,
        offset,
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']],
        include: [
          { model: User, attributes: ['first_name', 'last_name', 'email', 'phone'] },
          {
            model: Doctor,
            attributes: ['specialty'],
            include: [{ model: User, attributes: ['first_name', 'last_name'] }]
          },
          { model: Hospital, attributes: ['name'] }
        ]
      });

      return res.json({
        appointments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      });
    } catch (err) {
      console.error('[getAllAppointments] Error:', err);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách lịch hẹn" });
    }
  }

  // Đồng bộ danh sách bệnh viện từ Overpass API
  async syncHospitalsFromOverpass(req, res) {
    try {
      const initializeHospitals = require('../../scripts/initializeHospitals');
      await initializeHospitals();
      return res.json({ message: "Đồng bộ danh sách bệnh viện từ Overpass API thành công!" });
    } catch (err) {
      console.error('[Sync Overpass] Error:', err);
      return res.status(500).json({ message: "Lỗi đồng bộ danh sách bệnh viện" });
    }
  }
}

module.exports = new AdminController();
