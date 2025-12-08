const mongoose = require('mongoose');
// import thu vien mongoose
const diseasesSchema = new mongoose.Schema({
name: { type: String, required: true },        
    overview: { type: String },                    
    symptoms: { type: String },                  
        causes: { type: String },                 
        diagnosis: { type: String },                  
        treatment: { type: String },                  
        doctors: { type: String },                
        departments: { type: String },                
    image_url: { type: String },
    Precaution_1: { type: String },
    Precaution_2: { type: String },
    Precaution_3: { type: String },
    Precaution_4: { type: String },                   
    // NHÓM 2: DỮ LIỆU VIETSUB (Tiếng Việt - Dùng để lưu kết quả dịch)
    // Mongoose cần biết các trường này tồn tại để có thể lưu vào DB
    // (Mặc dù hiện tại Controller của bạn đang dịch "real-time" và trả về chứ chưa lưu, 
    // nhưng khai báo sẵn là tốt nhất cho tương lai)
    name_vi: { type: String },
    overview_vi: { type: String },
    symptoms_vi: { type: String },
    causes_vi: { type: String },
    diagnosis_vi: { type: String },
    treatment_vi: { type: String },
    precaution_vi: {type: String}, // gop 4 cai thanh 1 doan van 

}, { 
    timestamps: true,
    strict: false // Quan trọng: Chấp nhận các trường khác nếu CSV có thay đổi
});
// tạo mục tìm kiếm cho cả tiếng anh và tiếng việt
diseasesSchema.index({
    name: 'text',
    symptoms: 'text',
    overview:'text',
    // luu tieng viet vao db
    name_vi:'text',
    symptoms_vi:'text',
    overview_vi:'text'
})

module.exports = mongoose.model('Diseases', diseasesSchema)