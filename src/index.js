const path = require('path');
const express = require('express');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const setupSwagger = require('./swagger');
setupSwagger(app);

const authRoutes = require('./routes/auth');
const symptomRoutes = require('./routes/symptoms');
const diseasesRoutes = require('./routes/disease');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const sendEmail = require('./routes/sendMail');

connectDB();

// [FIX] Thêm helmet - security headers (chống XSS, clickjacking, MIME sniffing, ...)
app.use(helmet());

// [FIX] CORS origin từ env, support multiple origins (comma-separated)
// Không còn origin: "*" cho phép mọi domain
const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigins.split(',').map(s => s.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// [FIX] Thêm rate limiting - chống brute force
// Auth: 20 request / 15 phút (dễ bị tấn công nhất)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Các API khác: 100 request / 15 phút
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/symptoms', apiLimiter, symptomRoutes);
app.use('/api/diseases', apiLimiter, diseasesRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/mail', apiLimiter, sendEmail);

app.get('/', (req, res) => res.send('Home Page'));

// [FIX] Thêm global error handler - bắt mọi exception không được xử lý
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
