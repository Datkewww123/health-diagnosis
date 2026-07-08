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
    // Tự động đồng bộ cấu hình DB (chỉ tạo nếu chưa tồn tại)
    await sequelize.sync();
    console.log('All MySQL Tables Synced Successfully!');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    console.error('Hãy chắc chắn rằng bạn đã khởi động MySQL trên XAMPP!');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
