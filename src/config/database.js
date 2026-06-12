const mongoose = require('mongoose');

// [FIX] Thêm retry logic: thử kết nối lại 3 lần trước khi bỏ cuộc
// [FIX] Không còn process.exit(1) - server không crash khi mất DB
// [FIX] Tự động reconnect khi mất kết nối (mongoose handle sẵn)
// [FIX] Timeout cấu hình rõ ràng: serverSelectionTimeoutMS: 5s, socketTimeoutMS: 45s

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Atlas Connected Successfully!');
  } catch (err) {
    console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    console.error('All MongoDB connection attempts failed. Starting server without DB...');
  }
}

const connectDB = async () => {
  await connectWithRetry();
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = connectDB;
