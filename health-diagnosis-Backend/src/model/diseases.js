const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Disease = sequelize.define('Disease', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  causes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precautions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  departments: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  icd_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  doctors: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precaution_1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  precaution_2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  precaution_3: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  precaution_4: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'diseases',
});

module.exports = Disease;