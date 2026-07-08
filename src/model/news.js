const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'news',
  indexes: [
    { fields: ['published_at'] },
    { fields: ['category'] },
  ],
});

module.exports = News;
