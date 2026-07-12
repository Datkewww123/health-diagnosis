const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');
const Doctor = require('./doctor');
const Hospital = require('./hospital');
const Disease = require('./diseases');

const Appointment = sequelize.define('Appointment', {
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
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  hospital_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Hospital,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  disease_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Disease,
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  payment_type: {
    type: DataTypes.ENUM('service', 'insurance'),
    defaultValue: 'service',
    allowNull: false
  },
  insurance_card_number: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  result_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['doctor_id'] },
    { fields: ['status'] }
  ]
});

// Quan hệ
User.hasMany(Appointment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Appointment.belongsTo(User, { foreignKey: 'user_id' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', onDelete: 'CASCADE' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Hospital.hasMany(Appointment, { foreignKey: 'hospital_id', onDelete: 'CASCADE' });
Appointment.belongsTo(Hospital, { foreignKey: 'hospital_id' });

Disease.hasMany(Appointment, { foreignKey: 'disease_id', onDelete: 'SET NULL' });
Appointment.belongsTo(Disease, { foreignKey: 'disease_id' });

module.exports = Appointment;
