const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const OtpCode = sequelize.define('OtpCode', {
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
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'otpcodes',
  timestamps: false // OtpCode không cần created_at / updated_at
});

// Quan hệ
User.hasMany(OtpCode, { foreignKey: 'user_id', onDelete: 'CASCADE' });
OtpCode.belongsTo(User, { foreignKey: 'user_id' });

module.exports = OtpCode;
