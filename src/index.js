const path = require('path'); // nap bien moi truong dau tien cho toan bo ung dung 
const express = require('express'); // su dung framework express
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('./config/database'); //import ham ket noi mongodb
const cors = require('cors'); //cho phép FE truy cập API từ domain khác.
const app = express(); // tao 1 app chay tren framework express
const setupSwagger = require('./swagger'); // src/swagger.js
setupSwagger(app);

//import route  
const authRoutes = require('./routes/auth'); // import auth tu router
const symptomRoutes = require('./routes/symptoms'); // import symptoms từ router
const diseasesRoutes = require('./routes/disease'); // import diseases tu router
const userRoutes = require('./routes/user') // lay thong tin, update user tu router
const adminRoutes = require('./routes/admin'); // cap nhat admin
const sendEmail = require('./routes/sendMail');
// ket nối db
connectDB();


//middleware
app.use(cors()); // cho phep fe ket noi tu bat cu dau (domain khac)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


// dang ki route (duong dan api)
app.use('/api/auth', authRoutes); // dung router cho api
app.use('/api/symptoms', symptomRoutes); // duong dan den symptoms
app.use('/api/diseases', diseasesRoutes); // duong dan den diseases
app.use('/api/user', userRoutes) // duong dan den user
app.use('/api/admin', adminRoutes) // duong dan den admin
app.use('/api/mail', sendEmail) //


// route trang chu
app.get('/', (req, res) => res.send('Home Page')); // duong dan toi homepage

// start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
