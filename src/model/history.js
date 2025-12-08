const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: ['search', 'predict'],
        required: true
    },

    // Tên bệnh được chọn
    diseaseName: {
        type: String,
        required: true
    },

    // Triệu chứng gốc (chỉ dành cho predict)
    inputSymptoms: {
        type: [String],
        default: []
    },

}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);