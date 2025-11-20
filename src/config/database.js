  const mongoose = require('mongoose'); //import thu vien mongoose

  const connectDB = async () => { // aynsc la ham bat dong bo
    try {
      await mongoose.connect('mongodb://localhost:27017/User_db', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  };

  module.exports = connectDB; //cho phep import model nay vao file khac
