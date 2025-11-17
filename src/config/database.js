const mongoose = require('mongoose'); //import thu vien mongoose

const connectDB = async() =>{ // aynsc la ham bat dong bo
    try{
        await mongoose.connect('mongodb://localhost:27017/symptom_db', { // dung await de cho cac thao tac bat dong bo
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('connect sucessfully') // neu thanh cong
    }
    catch(error){
        console.log('failed to connect!') // neu that bai
}
};

module.exports = connectDB; //cho phep import model nay vao file khac
