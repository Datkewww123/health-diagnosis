const path = require('path'); // nap bien moi truong dau tien cho toan bo ung dung 
const express = require('express'); // su dung framework express
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('./config/database'); //import ham ket noi mongodb
const cors = require('cors'); //cho phép FE truy cập API từ domain khác.
const app = express(); // tao 1 app chay tren framework express


//import route  
const authRoutes = require('./routes/auth'); // import auth tu router
const adminRoutes = require('./routes/admin');
const symptomRoutes = require('./routes/symptoms'); // import symptoms từ router
// ket nối db
connectDB();

// Cấu hình CORS đầy đủ để hỗ trợ preflight OPTIONS
app.use(cors({
  origin: "*", // Hoặc list domain frontend của bạn
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
// Bắt mọi preflight OPTIONS request
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

//middleware
app.use(cors()); // cho phep fe ket noi tu bat cu dau (domain khac)
app.use(express.json());


// dang ki route (duong dan api)
app.use('/api/auth', authRoutes); // dung router cho api
app.use('/api/admin', adminRoutes) // dung cho admin
app.use('/api/symptoms', symptomRoutes); // duong dan den symptoms


// route trang chu
app.get('/', (req, res) => res.send('Home Page')); // duong dan toi homepage

// start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
