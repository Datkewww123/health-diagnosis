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

    inputSymptoms: {
        type: [String],
        default: []
    },

    result: {
        type: Array,
        default: []
    }

}, { timestamps: true }); 

module.exports = mongoose.model('History', historySchema);