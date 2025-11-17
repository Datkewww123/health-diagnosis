const express = require('express'); //import thu vien 
const connectDB = require('./config/database')
const app = express(); // tao ung dung express
app.use(express.json()) // cho phep express tu dong paste du lieu json
const port = 3001
//connect mongoDB
connectDB();

// cai path cua URL, function
app.get('/', (req, res) =>{
    res.send('home')
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
