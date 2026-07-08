const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const History = sequelize.define('History', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('search', 'predict'),
    allowNull: false,
  },
  query_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disease_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  input_symptoms: {
    type: DataTypes.JSON, // Lưu trữ mảng triệu chứng đầu vào dưới dạng JSON
    allowNull: true,
  }
}, {
  tableName: 'histories',
  updatedAt: false // Chỉ cần created_at cho lịch sử
});

// Quan hệ
User.hasMany(History, { foreignKey: 'user_id', onDelete: 'CASCADE' });
History.belongsTo(User, { foreignKey: 'user_id' });

module.exports = History;