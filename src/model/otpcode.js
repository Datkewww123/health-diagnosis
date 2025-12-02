const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('OtpCode', otpSchema);
