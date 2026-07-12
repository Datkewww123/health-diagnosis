const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Hospital = require('./hospital');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  hospital_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Hospital,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 150000.00
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'doctors',
});

// Quan hệ
Hospital.hasMany(Doctor, { foreignKey: 'hospital_id', onDelete: 'CASCADE' });
Doctor.belongsTo(Hospital, { foreignKey: 'hospital_id' });

const User = require('./user');
User.hasOne(Doctor, { foreignKey: 'user_id', onDelete: 'SET NULL' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Doctor;
