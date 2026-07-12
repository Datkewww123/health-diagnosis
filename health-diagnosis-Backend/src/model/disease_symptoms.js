const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Disease = require('./diseases');
const Symptom = require('./symptoms');

const DiseaseSymptom = sequelize.define('DiseaseSymptom', {
  disease_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Disease,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  symptom_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Symptom,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // 1 = Phổ biến, 2 = Quan trọng, 3 = Đặc trưng quyết định
  }
}, {
  tableName: 'disease_symptoms',
  timestamps: false
});

// Thiết lập quan hệ Nhiều - Nhiều
Disease.belongsToMany(Symptom, { through: DiseaseSymptom, foreignKey: 'disease_id', otherKey: 'symptom_id', as: 'symptomsList' });
Symptom.belongsToMany(Disease, { through: DiseaseSymptom, foreignKey: 'symptom_id', otherKey: 'disease_id', as: 'diseasesList' });

module.exports = DiseaseSymptom;
