const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Symptom = sequelize.define('Symptom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'symptoms',
  timestamps: false // Triệu chứng danh mục không cần timestamps
});

module.exports = Symptom;
