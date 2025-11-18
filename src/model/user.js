const mongoose = require('mongoose'); 
// su dung thu vien mongoose
const userSchema = new mongoose.Schema({ //tao doi tuong Schema
  First_name: { type: String, required: true },
  Last_name: { type: String, required: true },
  Username: { type: String, required: true, unique: true },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, 
{ timestamps: true }); // co dong nay thi mongodb se tu tao 2 dong o duoi
// createAt
// updateAt

module.exports = mongoose.model('User', userSchema);
