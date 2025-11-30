  const mongoose = require('mongoose');//import thu vien mongoose

const connectDB = async () => {
  try {
    // Mongoose bản mới tự động xử lý mấy cái option cũ rồi
    await mongoose.connect(process.env.MONGO_URI); 
    console.log('MongoDB Atlas Connected Success!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

  module.exports = connectDB; //cho phep import model nay vao file khac
