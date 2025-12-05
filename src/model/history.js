const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({ // tao 1 schema moi trong mongoose
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // ObjectId tham chieu den collection User 
    type:{type: String, enum:['search', 'predict'], required: true}, // enum: gioi han action chi dc la search hoac predict
    // Predict thì dùng inputSymptoms
    inputSymptoms: { type: [String] },
    diseaseName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);