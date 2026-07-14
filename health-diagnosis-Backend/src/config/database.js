const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'health_diagnosis_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Tắt log query SQL để tránh rối terminal
    timezone: '+07:00', // Khớp múi giờ Việt Nam
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: true, // dùng snake_case (created_at, updated_at) trong MySQL
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected Successfully via Sequelize!');
    
    // Tự động đồng bộ các bảng mới (nếu chưa tồn tại)
    // Không dùng alter: true — sẽ tạo duplicate indexes trên table đã có
    try {
      await sequelize.sync();
    } catch (syncErr) {
      console.warn('[DB] sync() warning:', syncErr.message);
      // Nếu sync fail do duplicate indexes, tiếp tục bình thường
    }
    
    // Thủ công kiểm tra và thêm cột result_notes, prescription để tránh lỗi Sequelize sync alter key limit
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('appointments');
    
    if (!tableInfo.result_notes) {
      await queryInterface.addColumn('appointments', 'result_notes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added missing column [result_notes] to appointments table.');
    }
    
    if (!tableInfo.prescription) {
      await queryInterface.addColumn('appointments', 'prescription', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added missing column [prescription] to appointments table.');
    }
    
    // Kiểm tra và thêm cột cho bảng medicines
    try {
      const medTableInfo = await queryInterface.describeTable('medicines');
      if (!medTableInfo.code) {
        await queryInterface.addColumn('medicines', 'code', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('Added missing column [code] to medicines table.');
      }
      if (!medTableInfo.quantity) {
        await queryInterface.addColumn('medicines', 'quantity', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 100
        });
        console.log('Added missing column [quantity] to medicines table.');
      }
    } catch (medErr) {
      console.warn('[DB] Bảng medicines chưa tồn tại hoặc lỗi check columns:', medErr.message);
    }
    
    console.log('All MySQL Tables Synced Successfully!');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    console.error('Hãy chắc chắn rằng bạn đã khởi động MySQL trên XAMPP!');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
