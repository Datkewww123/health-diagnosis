const path = require('path');
const express = require('express');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { connectDB } = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('./config/redis');
const app = express();

// Redis-backed store khi available, fallback về MemoryStore
const useRedis = process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379';
const redisStore = useRedis ? new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }) : null;

if (useRedis) {
  console.log('[RateLimit] Using Redis store');
} else {
  console.log('[RateLimit] Using MemoryStore (set REDIS_URL for Redis)');
}
const setupSwagger = require('./swagger');
setupSwagger(app);

const authRoutes = require('./routes/auth');
const symptomRoutes = require('./routes/symptoms');
const diseasesRoutes = require('./routes/disease');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointment');
const icdRoutes = require('./routes/icd');
const newsRoutes = require('./routes/news');
const medicineRoutes = require('./routes/medicine');
const { startCronJobs } = require('./config/cron');

connectDB().then(() => {
  startCronJobs();
  // Fetch news ngay khi server start để luôn có bài mới nhất
  const { fetchAndSaveNews } = require('./config/newsService');
  fetchAndSaveNews().catch(err => console.warn('[News] Startup fetch error:', err.message));
});


// [FIX] Thêm helmet - security headers (chống XSS, clickjacking, MIME sniffing, ...)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Trust first proxy (for reverse proxies)
app.set('trust proxy', 1);

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// [FIX] CORS origin từ env, support multiple origins (comma-separated)
// Không còn origin: "*" cho phép mọi domain
const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigins.split(',').map(s => s.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// [FIX] Thêm rate limiting - chống brute force
// Redis-backed store: hoạt động đúng khi scale nhiều instances
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  ...(redisStore && { store: redisStore }),
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  ...(redisStore && { store: redisStore }),
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/symptoms', apiLimiter, symptomRoutes);
app.use('/api/diseases', apiLimiter, diseasesRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/appointments', apiLimiter, appointmentRoutes);
app.use('/api/icd', apiLimiter, icdRoutes);
app.use('/api/news', apiLimiter, newsRoutes);
app.use('/api/medicines', apiLimiter, medicineRoutes);
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', apiLimiter, dashboardRoutes);

app.get('/', (req, res) => res.send('Home Page'));

// [FIX] Thêm global error handler - bắt mọi exception không được xử lý
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  redisClient.quit().catch(() => {});
  process.exit(0);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
