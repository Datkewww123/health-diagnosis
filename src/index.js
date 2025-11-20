const express = require('express'); // su dung framework express
const connectDB = require('./config/database'); //import ham ket noi mongodb
const authRoutes = require('./routes/auth'); // import auth tu router
const cors = require('cors'); //cho phép FE truy cập API từ domain khác.
const adminRoutes = require('./routes/admin');
const app = express(); // tao 1 app chay tren framework express
connectDB();

app.use(cors()); // cho phep fe ket noi tu bat cu dau (domain khac)
app.use(express.json());
app.use('/api/auth', authRoutes); // dung router cho api
app.use('/api/admin', adminRoutes) // dung cho admin
app.get('/', (req, res) => res.send('Home Page'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
