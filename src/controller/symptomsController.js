const Diseases = require('../model/diseases');
const { translate } = require('@vitalets/google-translate-api');
// Danh sách stop words tiếng Việt
const VIETNAMESE_STOP_WORDS = [
    "tôi", "tao", "tớ", "mình", "bạn", "anh", "chị", "em",
    "bị", "thấy", "trong", "người",
    "dạo", "này", "gần", "đây", "lâu", "nay",
    "hay", "thường", "xuyên", "có", "vẻ", "hơi", "rất", "quá", "lắm",
    "như", "là", "và", "hoặc", "nhưng", "thì", "mà", "ở", "với",
    "kiểu", "như", "đau", "nhức", "mỏi", "triệu", "chứng", "của"
];

// Từ điển mapping triệu chứng Việt - Anh
const VI_TO_EN = { 
        "bong tróc da": "skin peeling",
        "buồn nôn": "nausea",
        "buồn tiểu liên tục": "continuous feel of urine",
        "béo phì": "obesity",
        "bầm tím": "bruising",
        "bồn chồn": "restlessness",
        "chuột rút": "cramps",
        "chán ăn": "loss of appetite",
        "chóng mặt": "dizziness",
        "chướng bụng": "distention of abdomen",
        "chảy nước mắt": "watering from eyes",
        "căng tức xoang": "sinus pressure",
        "cảm giác xoay tròn": "spinning movements",
        "cứng cổ": "stiff neck",
        "cứng khớp khi vận động": "movement stiffness",
        "dễ cáu gắt": "irritability",
        "ho": "cough",
        "ho ra máu": "blood in sputum",
        "hôn mê": "coma",
        "hắt hơi liên tục": "continuous sneezing",
        "khó chịu bàng quang": "bladder discomfort",
        "khó chịu trong người": "malaise",
        "khó thở": "breathlessness",
        "khó tiêu": "indigestion",
        "kinh nguyệt bất thường": "abnormal menstruation",
        "kích ứng hậu môn": "irritation in anus",
        "lo âu": "anxiety",
        "loét lưỡi": "ulcers on tongue",
        "lờ đờ": "lethargy",
        "lở loét đỏ quanh mũi": "red sore around nose",
        "móng tay dễ gãy": "brittle nails",
        "môi khô và tê": "drying and tingling lips",
        "mạch máu sưng phồng": "swollen blood vessels",
        "mảng trắng trong họng": "patches in throat",
        "mảng đổi màu da": "dischromic patches",
        "mất khứu giác": "loss of smell",
        "mất nước": "dehydration",
        "mất thăng bằng": "loss of balance",
        "mất tập trung": "lack of concentration",
        "mắt trũng": "sunken eyes",
        "mệt mỏi": "fatigue",
        "mụn mủ": "pus filled pimples",
        "mụn nước": "blister",
        "mụn đầu đen": "blackheads",
        "ngứa": "itching",
        "ngứa bên trong": "internal itching",
        "nhìn mờ": "blurred and distorted vision",
        "nhận truyền máu": "receiving blood transfusion",
        "nhịp tim nhanh": "fast heart rate",
        "nói lắp": "slurred speech",
        "nôn": "vomiting",
        "nước tiểu có mùi hôi": "foul smell of urine",
        "nước tiểu sẫm màu": "dark urine",
        "nước tiểu vàng": "yellow urine",
        "nổi gân xanh bắp chân": "prominent veins on calf",
        "nổi nốt trên da": "nodal skin eruptions",
        "phát ban da": "skin rash",
        "quan hệ tình dục không an toàn": "extra marital contacts",
        "rát họng": "throat irritation",
        "rùng mình": "shivering",
        "rỉ dịch vàng": "yellow crust ooze",
        "rối loạn thị giác": "visual disturbances",
        "rối loạn tri giác": "altered sensorium",
        "sung huyết": "congestion",
        "suy gan cấp": "acute liver failure",
        "sưng bụng": "swelling of stomach",
        "sưng chân": "swollen legs",
        "sưng hạch bạch huyết": "swelled lymph nodes",
        "sưng khớp": "swelling joints",
        "sưng mặt và mắt": "puffy face and eyes",
        "sưng tay chân": "swollen extremeties",
        "sẹo": "scurring",
        "sốt cao": "high fever",
        "sốt nhẹ": "mild fever",
        "sổ mũi": "runny nose",
        "sụt cân": "weight loss",
        "tay chân lạnh": "cold hands and feets",
        "teo cơ": "muscle wasting",
        "thay đổi tâm trạng": "mood swings",
        "thèm ăn": "increased appetite",
        "thừa dịch": "fluid overload",
        "tiêm chích không an toàn": "receiving unsterile injections",
        "tiêu chảy": "diarrhoea",
        "tiền sử gia đình": "family history",
        "tiền sử uống rượu": "history of alcohol consumption",
        "tiểu buốt": "burning micturition",
        "tiểu lắt nhắt": "spotting urination",
        "trầm cảm": "depression",
        "tuyến giáp to": "enlarged thyroid",
        "táo bón": "constipation",
        "tăng cân": "weight gain",
        "viêm móng": "inflammatory nails",
        "vàng da": "yellowish skin",
        "vàng mắt": "yellowing of eyes",
        "vảy bạc trên da": "silver like dusting",
        "vẻ mặt nhiễm độc": "toxic look (typhos)",
        "vết lõm trên móng": "small dents in nails",
        "xuất huyết dạ dày": "stomach bleeding",
        "xì hơi nhiều": "passage of gases",
        "yếu cơ": "muscle weakness",
        "yếu nửa người": "weakness of one body side",
        "yếu tay chân": "weakness in limbs",
        "đa niệu": "polyuria",
        "đau bụng": "abdominal pain",
        "đau cơ": "muscle pain",
        "đau cổ": "neck pain",
        "đau dạ dày": "stomach pain",
        "đau khi đi đại tiện": "pain during bowel movements",
        "đau khớp": "joint pain",
        "đau khớp háng": "hip joint pain",
        "đau lưng": "back pain",
        "đau ngực": "chest pain",
        "đau sau hốc mắt": "pain behind the eyes",
        "đau vùng bụng": "belly pain",
        "đau vùng hậu môn": "pain in anal region",
        "đau đầu": "headache",
        "đau đầu gối": "knee pain",
        "đi lại đau đớn": "painful walking",
        "đi ngoài ra máu": "bloody stool",
        "đi đứng không vững": "unsteadiness",
        "đánh trống ngực": "palpitations",
        "đói quá mức": "excessive hunger",
        "đường huyết không ổn định": "irregular sugar level",
        "đỏ mắt": "redness of eyes",
        "đốm đỏ khắp người": "red spots over body",
        "đổ mồ hôi": "sweating",
        "đờm": "phlegm",
        "đờm màu gỉ sắt": "rusty sputum",
        "đờm nhầy": "mucoid sputum",
        "ớn lạnh": "chills",
        "ợ chua": "acidity"
};
const EN_to_VI = {
  "AIDS": "AIDS (Hội chứng suy giảm miễn dịch)",
  "Acne": "Mụn trứng cá",
  "Alcoholic hepatitis": "Viêm gan do rượu",
  "Allergy": "Dị ứng",
  "Arthritis": "Viêm khớp",
  "Bronchial Asthma": "Hen phế quản",
  "Cervical spondylosis": "Thoái hóa đốt sống cổ",
  "Chicken pox": "Thủy đậu",
  "Chronic cholestasis": "Ứ mật mạn tính",
  "Common Cold": "Cảm lạnh thông thường",
  "Dengue": "Sốt xuất huyết Dengue",
  "Diabetes": "Tiểu đường (Đái tháo đường)",
  "Dimorphic hemorrhoids (piles)": "Bệnh trĩ (nội/ngoại)",
  "Drug Reaction": "Phản ứng thuốc",
  "Fungal infection": "Nhiễm nấm",
  "GERD": "Trào ngược dạ dày thực quản",
  "Gastroenteritis": "Viêm dạ dày ruột",
  "Heart attack": "Nhồi máu cơ tim (Đau tim)",
  "Hepatitis A": "Viêm gan A",
  "Hepatitis B": "Viêm gan B",
  "Hepatitis C": "Viêm gan C",
  "Hepatitis D": "Viêm gan D",
  "Hepatitis E": "Viêm gan E",
  "Hypertension": "Tăng huyết áp (Cao huyết áp)",
  "Hyperthyroidism": "Cường giáp",
  "Hypoglycemia": "Hạ đường huyết",
  "Hypothyroidism": "Suy giáp",
  "Impetigo": "Bệnh chốc lở",
  "Jaundice": "Vàng da",
  "Malaria": "Sốt rét",
  "Migraine": "Đau nửa đầu",
  "Osteoarthritis": "Thoái hóa khớp",
  "Paralysis (brain hemorrhage)": "Liệt (do xuất huyết não)",
  "Paroxysmal Positional Vertigo": "Chóng mặt kịch phát lành tính (BPPV)",
  "Peptic ulcer disease": "Viêm loét dạ dày tá tràng",
  "Pneumonia": "Viêm phổi",
  "Psoriasis": "Vảy nến",
  "Tuberculosis": "Bệnh lao",
  "Typhoid": "Thương hàn",
  "Urinary tract infection": "Nhiễm trùng đường tiết niệu",
  "Varicose veins": "Suy giãn tĩnh mạch",
};
class SymptomsController {
      async symptomsCheck(req, res){
        try{
            const {symptoms} = req.body; // nhan input tu client
            if(!symptoms){
                return res.status(400).json({message: "Vui lòng nhập triệu chứng!"});
            }
            // xủ lí input symptoms
            let inputString = Array.isArray(symptoms) ? symptoms.join(" ") : symptoms; //neu user nhap mang thi ghep thanh chuoi
            inputString = inputString.toLowerCase();
            // Loại bỏ từ dư thừa
          VIETNAMESE_STOP_WORDS.forEach(sw =>{
            const regex = new RegExp(`\\b${sw}\\b`, 'gi'); // duyet tung stop word tao regex de match tu nguyen ven
            inputString = inputString.replace(regex, ''); // sau do thay the bang chuoi rong
          });
          inputString = inputString.replace(/\s+/g, ' ').trim(); // sau do gop khoang trang va trim lai
          // Map trieu chung sang tieng anh nho tu dien
            let translatedKeywords = [];
            Object.keys(VI_TO_EN)
            .sort((a, b) => b.length - a.length) // duyet cum tu dai thanh ngan de tranh match nham
            .forEach(vi =>{
                if(inputString.includes(vi)){ // neu input chua cum tieng viet thi push phien bang tieng anh vao
                    translatedKeywords.push(VI_TO_EN[vi]); 
                    inputString = inputString.replace(vi, ''); // xoa cum nay khoi inputstring de khong match lai
                }
            });
            // fallback dich toan bo input neu khong co cum nao duoc map
            if(translatedKeywords.length === 0 && inputString.length > 0){ // neu khong thay cum nao thi dung gg translate
                try{
                    const resTrans = await translate(inputString, {to: 'en'});
                    translatedKeywords = [resTrans.text.toLowerCase().trim()]; // giu nguyen cum k split ra tung tu
                }
                catch(err){
                    translatedKeywords = [inputString]; // neu thay bai dung input lam tu khoa
                }
            }
            // tinh diem cho tung benh
            const allDiseases = await Diseases.find({}).select('name symptoms').lean(); // lay tat ca cac benh tu db
            const scoreList = allDiseases.map(disease => {
                let score = 0;
                let matched = []; // danh sach tu khoa trung khop
                const diseaseText = (disease.name + ' ' + disease.symptoms).toLowerCase(); // tap diseasetext de chuan hoa

                translatedKeywords.forEach(k =>{ //duyet tung benh sang tieng anh neu co tu khoa thi +1
                    if(diseaseText.includes(k))
                    {
                        score++;
                        matched.push(k);}
                });
                return score > 0 ? {name: disease.name, score, matched} : null; // chi giu cac benh co diem > 0 và sap xep giam dan

            }).filter(Boolean)
            .sort((a, b) => b.score - a.score);


                // Dịch tên bệnh và triệu chứng sang tiếng Việt
            const outputList = scoreList.map(item => {
                const translatedMatched = item.matched.map(k => {
                    // tìm key của k trong VI_TO_EN
                    const viKey = Object.keys(VI_TO_EN).find(key => VI_TO_EN[key] === k);
                    return viKey || k;
                });

                const translatedName = EN_to_VI[item.name] || item.name;
                     return {
                    name: translatedName,
                    score: item.score,
                    matched: translatedMatched
                };
            });


            return res.json({
                message: "kết quả chuẩn đoán",
                count: scoreList.length,
                data: outputList,
            });
        }
        catch(err){
            return res.status(500).json({message: err.message});
        }
      }
}
module.exports = new SymptomsController();
