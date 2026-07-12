const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'viên', // viên, gói, chai, ống...
  },
  default_instruction: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn.',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100, // số lượng tồn kho mặc định
  },
  hospital_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'medicines',
  timestamps: false
});

const Hospital = require('./hospital');
Medicine.belongsTo(Hospital, { foreignKey: 'hospital_id' });
Hospital.hasMany(Medicine, { foreignKey: 'hospital_id' });

module.exports = Medicine;
