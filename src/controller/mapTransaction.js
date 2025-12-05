const VIETNAMESE_STOP_WORDS = [
    "tôi", "tao", "tớ", "mình", "bạn", "anh", "chị", "em",
    "bị", "thấy", "trong", "người",
    "dạo", "này", "gần", "đây", "lâu", "nay",
    "hay", "thường", "xuyên", "có", "vẻ", "hơi", "rất", "quá", "lắm",
    "như", "là", "và", "hoặc", "nhưng", "thì", "mà", "ở", "với",
    "kiểu", "như", "đau", "nhức", "mỏi", "triệu", "chứng", "của"
];
const VI_TO_EN_SYMPTOMS = {
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
const EN_TO_VI_DISEASES = {
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
const VI_TO_EN_DISEASES = {
    "aids (hội chứng suy giảm miễn dịch)": "AIDS",
    "mụn trứng cá": "Acne",
    "viêm gan do rượu": "Alcoholic hepatitis",
    "dị ứng": "Allergy",
    "viêm khớp": "Arthritis",
    "hen phế quản": "Bronchial Asthma",
    "thoái hóa đốt sống cổ": "Cervical spondylosis",
    "thủy đậu": "Chicken pox",
    "ứ mật mạn tính": "Chronic cholestasis",
    "cảm lạnh thông thường": "Common Cold",
    "sốt xuất huyết dengue": "Dengue",
    "tiểu đường (đái tháo đường)": "Diabetes",
    "bệnh trĩ (nội/ngoại)": "Dimorphic hemorrhoids (piles)",
    "phản ứng thuốc": "Drug Reaction",
    "nhiễm nấm": "Fungal infection",
    "trào ngược dạ dày thực quản": "GERD",
    "viêm dạ dày ruột": "Gastroenteritis",
    "nhồi máu cơ tim (đau tim)": "Heart attack",
    "viêm gan a": "Hepatitis A",
    "viêm gan b": "Hepatitis B",
    "viêm gan c": "Hepatitis C",
    "viêm gan d": "Hepatitis D",
    "viêm gan e": "Hepatitis E",
    "tăng huyết áp (cao huyết áp)": "Hypertension",
    "cường giáp": "Hyperthyroidism",
    "hạ đường huyết": "Hypoglycemia",
    "suy giáp": "Hypothyroidism",
    "bệnh chốc lở": "Impetigo",
    "vàng da": "Jaundice",
    "sốt rét": "Malaria",
    "đau nửa đầu": "Migraine",
    "thoái hóa khớp": "Osteoarthritis",
    "liệt (do xuất huyết não)": "Paralysis (brain hemorrhage)",
    "chóng mặt kịch phát lành tính (bppv)": "Paroxysmal Positional Vertigo",
    "viêm loét dạ dày tá tràng": "Peptic ulcer disease",
    "viêm phổi": "Pneumonia",
    "vảy nến": "Psoriasis",
    "bệnh lao": "Tuberculosis",
    "thương hàn": "Typhoid",
    "nhiễm trùng đường tiết niệu": "Urinary tract infection",
    "suy giãn tĩnh mạch": "Varicose veins"
};

const VI_TRANSLATE_PRECAUTION = {
  "consult_nearest_hospital": "Đến bệnh viện gần nhất",
  "acetaminophen": "Sử dụng Acetaminophen",
  "anti_itch_medicine": "Dùng thuốc chống ngứa",
  "antiboitic_therapy": "Điều trị bằng kháng sinh",
  "apply_calamine": "Bôi thuốc mỡ Calamine",
  "avoid_abrupt_head_movment": "Tránh cử động đầu đột ngột",
  "avoid_cold_food": "Tránh thức ăn lạnh",
  "avoid_fatty_spicy_food": "Tránh thức ăn cay, nhiều dầu mỡ",
  "avoid_lying_down_after_eating": "Tránh nằm ngay sau khi ăn",
  "avoid_non_veg_food": "Tránh thức ăn mặn (thịt, cá)",
  "avoid_oily_food": "Tránh thức ăn nhiều dầu mỡ",
  "avoid_open_cuts": "Tránh để vết thương hở",
  "avoid_public_places": "Tránh nơi công cộng",
  "avoid_sudden_change_in_body": "Tránh thay đổi tư thế đột ngột",
  "avoid_too_many_products": "Tránh sử dụng quá nhiều sản phẩm",
  "bath_twice": "Tắm hai lần mỗi ngày",
  "call_ambulance": "Gọi xe cấp cứu",
  "check_in_pulse": "Kiểm tra mạch",
  "chew_or_swallow_asprin": "Nhai hoặc nuốt Aspirin",
  "cold_baths": "Tắm nước mát",
  "consult_doctor": "Tham khảo ý kiến bác sĩ",
  "consume_alovera_juice": "Uống nước ép nha đam",
  "consume_milk_thistle": "Dùng cây kế sữa",
  "consume_neem_leaves": "Dùng lá neem",
  "consume_probiotic_food": "Ăn thực phẩm chứa lợi khuẩn",
  "consume_witch_hazel": "Dùng nước cây phỉ",
  "cover_area_with_bandage": "Băng kín vùng bị thương",
  "cover_mouth": "Che miệng khi ho/hắt hơi",
  "dont_stand_still_for_long": "Không đứng yên quá lâu",
  "drink_cranberry_juice": "Uống nước ép nam việt quất",
  "drink_papaya_leaf_juice": "Uống nước ép lá đu đủ",
  "drink_plenty_of_water": "Uống nhiều nước",
  "drink_sugary_drinks": "Uống nước ngọt",
  "drink_vitamin_c_rich_drinks": "Uống thức uống giàu Vitamin C",
  "ease_back_into_eating": "Ăn lại từ từ",
  "eat_fruits_and_high_fiberous_food": "Ăn trái cây và thực phẩm giàu chất xơ",
  "eat_healthy": "Ăn uống lành mạnh",
  "eat_high_calorie_vegitables": "Ăn các loại rau củ giàu calo",
  "eliminate_milk": "Loại bỏ sữa khỏi chế độ ăn",
  "exercise": "Tập thể dục",
  "follow_up": "Tái khám đúng hẹn",
  "get_away_from_trigger": "Tránh xa các yếu tố gây kích ứng",
  "get_proper_sleep": "Ngủ đủ giấc",
  "have_balanced_diet": "Ăn uống cân bằng dinh dưỡng",
  "increase_vitamin_c_intake": "Tăng cường bổ sung Vitamin C",
  "keep_calm": "Giữ bình tĩnh",
  "keep_fever_in_check": "Kiểm soát cơn sốt",
  "keep_hydrated": "Giữ cơ thể đủ nước",
  "keep_infected_area_dry": "Giữ vùng nhiễm trùng khô ráo",
  "keep_mosquitos_away": "Tránh muỗi",
  "keep_mosquitos_out": "Ngăn muỗi vào nhà",
  "lie_down": "Nằm nghỉ",
  "lie_down_flat_and_raise_the_leg_high": "Nằm thẳng và gác chân cao",
  "lie_down_on_side": "Nằm nghiêng",
  "limit_alcohol": "Hạn chế rượu bia",
  "maintain_healthy_weight": "Duy trì cân nặng hợp lý",
  "massage": "Mát-xa",
  "medication": "Uống thuốc theo chỉ định",
  "meditation": "Thiền",
  "reduce_stress": "Giảm căng thẳng",
  "relax": "Thư giãn",
  "remove_scabs_with_wet_compressed_cloth": "Loại bỏ vảy bằng khăn ẩm",
  "rest": "Nghỉ ngơi",
  "salt_baths": "Tắm nước muối",
  "seek_help": "Tìm sự giúp đỡ",
  "soak_affected_area_in_warm_water": "Ngâm vùng bị ảnh hưởng trong nước ấm",
  "stop_alcohol_consumption": "Ngừng uống rượu bia",
  "stop_bleeding_using_pressure": "Cầm máu bằng cách ấn chặt",
  "stop_eating_solid_food_for_while": "Ngưng ăn thức ăn đặc một thời gian",
  "stop_irritation": "Ngưng các tác nhân gây kích ứng",
  "stop_taking_drug": "Ngưng dùng thuốc",
  "switch_to_loose_cloothing": "Mặc quần áo rộng rãi",
  "take_deep_breaths": "Hít thở sâu",
  "take_otc_pain_reliver": "Dùng thuốc giảm đau không kê đơn",
  "take_probiotics": "Bổ sung men vi sinh",
  "take_radioactive_iodine_treatment": "Điều trị bằng i-ốt phóng xạ",
  "take_vaccine": "Tiêm vắc-xin",
  "take_vapour": "Xông hơi",
  "try_acupuncture": "Thử châm cứu",
  "try_taking_small_sips_of_water": "Thử uống từng ngụm nước nhỏ",
  "use_antibiotics": "Dùng kháng sinh",
  "use_clean_cloths": "Sử dụng khăn sạch",
  "use_detol_or_neem_in_bathing_water": "Pha Dettol hoặc lá neem vào nước tắm",
  "use_heating_pad_or_cold_pack": "Chườm nóng hoặc lạnh",
  "use_hot_and_cold_therapy": "Liệu pháp nóng lạnh luân phiên",
  "use_ice_to_compress_itching": "Chườm đá để giảm ngứa",
  "use_lemon_balm": "Dùng tía tô đất",
  "use_neem_in_bathing": "Tắm bằng nước lá neem",
  "use_oinments": "Bôi thuốc mỡ",
  "use_poloroid_glasses_in_sun": "Đeo kính phân cực khi ra nắng",
  "use_vein_compression": "Dùng băng ép tĩnh mạch",
  "vaccination": "Tiêm chủng",
  "warm_bath_with_epsom_salt": "Tắm nước ấm với muối Epsom",
  "wash_hands_through": "Rửa tay kỹ",
  "wash_hands_with_warm_soapy_water": "Rửa tay bằng nước ấm và xà phòng",
  "wear_ppe_if_possible": "Mặc đồ bảo hộ cá nhân nếu có thể"
};

const VI_TRANSLATE_DOCTORS = {
  // --- Doctors & Departments (Bác sĩ & Chuyên khoa) ---
"allergist": "Bác sĩ dị ứng",
  "cardiologist": "Bác sĩ tim mạch",
  "dermatologist": "Bác sĩ da liễu",
  "endocrinologist": "Bác sĩ nội tiết",
  "ent_specialist": "Bác sĩ Tai Mũi Họng",
  "gastroenterologist": "Bác sĩ tiêu hóa",
  "general_physician": "Bác sĩ đa khoa",
  "general_surgeon": "Bác sĩ ngoại khoa",
  "hepatologist": "Bác sĩ gan mật",
  "infectious_disease_specialist": "Bác sĩ truyền nhiễm",
  "neurologist": "Bác sĩ thần kinh",
  "orthopedic_specialist": "Bác sĩ chỉnh hình",
  "orthopedist": "Bác sĩ chỉnh hình",
  "pediatrician": "Bác sĩ nhi khoa",
  "pulmonologist": "Bác sĩ hô hấp",
  "rheumatologist": "Bác sĩ cơ xương khớp",
  "urologist": "Bác sĩ tiết niệu",
  "vascular_surgeon": "Bác sĩ phẫu thuật mạch máu",
  "general_practice": "Bác sĩ đa khoa",      
  "internal_medicine": "Khoa Nội",
};
const VI_TRANSLATE_DEPARTMENT = {
"cardiology": "Khoa Tim mạch",
  "dermatology": "Khoa Da liễu",
  "endocrinology": "Khoa Nội tiết",
  "gastroenterology": "Khoa Tiêu hóa",
  "general_medicine": "Khoa Nội tổng hợp",
  "hepatology": "Khoa Gan mật",
  "immunology": "Khoa Miễn dịch",
  "infectious_diseases": "Khoa Truyền nhiễm",
  "neurology": "Khoa Thần kinh",
  "orthopedics": "Khoa Chỉnh hình",
  "otolaryngology": "Khoa Tai Mũi Họng",
  "proctology": "Khoa Hậu môn - Trực tràng",
  "pulmonology": "Khoa Hô hấp",
  "rheumatology": "Khoa Cơ xương khớp",
  "urology": "Khoa Tiết niệu",
  "vascular_medicine": "Khoa Mạch máu"
}

const VI_DIAGNOSIS_MAP = {
"anti_hev_test": "Xét nghiệm kháng thể HEV",
  "antiâ€‘hav_igm_test": "Xét nghiệm kháng thể IgM kháng HAV",
  "bp_monitoring": "Theo dõi huyết áp",
  "blood_smear": "Phết máu ngoại vi",
  "cbc": "Công thức máu toàn bộ",
  "cd4_count": "Đếm tế bào CD4",
  "ct_scan": "Chụp CT",
  "chest_x_ray": "Chụp X-quang ngực",
  "chest_x-ray": "Chụp X-quang ngực",
  "clinical_diagnosis": "Chẩn đoán lâm sàng",
  "clinical_exam": "Khám lâm sàng",
  "dix_hallpike_maneuver": "Nghiệm pháp Dix-Hallpike",
  "doppler_ultrasound": "Siêu âm Doppler",
  "ecg": "Điện tâm đồ",
  "elisa_hiv_test": "Xét nghiệm HIV ELISA",
  "endoscopy": "Nội soi",
  "fasting_glucose": "Đường huyết lúc đói",
  "glucose_test": "Xét nghiệm đường huyết",
  "glucose_tolerance_test": "Nghiệm pháp dung nạp glucose",
  "hbsag_test": "Xét nghiệm HBsAg",
  "hcv_rna_test": "Xét nghiệm HCV RNA",
  "hdv_antibody_test": "Xét nghiệm kháng thể HDV",
  "hba1c": "Xét nghiệm HbA1c",
  "ige_blood_test": "Xét nghiệm IgE trong máu",
  "liver_function_tests": "Xét nghiệm chức năng gan",
  "liver_panel": "Bộ xét nghiệm gan",
  "liver_tests": "Các xét nghiệm gan",
  "mrcp": "Chụp cộng hưởng từ mật tụy (MRCP)",
  "mri": "Chụp MRI (Cộng hưởng từ)",
  "mri_if_needed": "Chụp MRI (nếu cần)",
  "microscopy": "Soi kính hiển vi",
  "ns1_antigen_test": "Xét nghiệm kháng nguyên NS1",
  "neurological_exam": "Khám thần kinh",
  "pcr": "Xét nghiệm PCR",
  "pcr_test": "Xét nghiệm PCR",
  "rectal_exam": "Thăm trực tràng",
  "skin_exam": "Khám da",
  "skin_prick_test": "Test lẩy da",
  "skin_test": "Test da",
  "spirometry": "Đo chức năng hô hấp",
  "stool_test": "Xét nghiệm phân",
  "swab_culture": "Nuôi cấy dịch phết",
  "t3": "Xét nghiệm T3",
  "t4_test": "Xét nghiệm T4",
  "t4_tests": "Các xét nghiệm T4",
  "tsh": "Xét nghiệm TSH",
  "urine_test": "Xét nghiệm nước tiểu",
  "western_blot": "Xét nghiệm Western blot",
  "widal_test": "Phản ứng Widal",
  "x_ray": "Chụp X-quang",
  "allergy_testing": "Test dị ứng",
  "angiography": "Chụp mạch máu",
  "anoscopy": "Soi hậu môn",
  "biopsy": "Sinh thiết",
  "blood_culture": "Cấy máu",
  "culture": "Nuôi cấy",
  "fungal_culture": "Cấy nấm",
  "hormone_tests_if_indicated": "Xét nghiệm nội tiết (nếu có chỉ định)",
  "hydration_assessment": "Đánh giá tình trạng mất nước",
  "medication_review": "Xem xét thuốc đang dùng",
  "ph_monitoring": "Theo dõi pH",
  "peak_flow_test": "Đo lưu lượng đỉnh",
  "physical_neurological_exam": "Khám thần kinh lâm sàng",
  "rapid_test": "Test nhanh",
  "rheumatoid_factor_tests": "Xét nghiệm yếu tố dạng thấp",
  "sputum_culture": "Cấy đờm",
  "sputum_test": "Xét nghiệm đờm",
  "stool_antigen_test": "Xét nghiệm kháng nguyên trong phân",
  "troponin_test": "Xét nghiệm Troponin",
  "ultrasound": "Siêu âm",
  "videonystagmography": "Ghi động nhãn đồ (VNG)",
  "viral_load_count": "Đo tải lượng virus",
};

const VI_TREATMENT_MAP = {
"ace_inhibitors": "Thuốc ức chế men chuyển (ACE)",
  "alcohol_cessation": "Cai rượu",
  "antibiotics": "Kháng sinh",
  "antibiotics_ceftriaxone": "Kháng sinh (Ceftriaxone)",
  "antifungals_topical_oral": "Thuốc kháng nấm (bôi/uống)",
  "antihistamines": "Thuốc kháng histamine",
  "antimalarials_act": "Thuốc chống sốt rét (ACT)",
  "antiretroviral_therapy_art": "Liệu pháp kháng virus (ART)",
  "antithyroid_drugs": "Thuốc kháng giáp",
  "antivirals_tenofovir": "Thuốc kháng virus (Tenofovir)",
  "bp_control": "Kiểm soát huyết áp",
  "compression_therapy": "Liệu pháp nén ép",
  "daa_antiviral_therapy": "Liệu pháp kháng virus trực tiếp (DAA)",
  "dmards": "Thuốc chống thấp khớp tác dụng chậm",
  "epley_maneuver": "Thủ thuật Epley",
  "fiber": "Chất xơ",
  "fluid_therapy": "Bù dịch",
  "glucose_tablets": "Viên glucose",
  "iv_dextrose": "Truyền đường tĩnh mạch",
  "inhalers_bronchodilators": "Thuốc hít (giãn phế quản)",
  "insulin": "Insulin",
  "interferon_therapy": "Liệu pháp Interferon",
  "levothyroxine_therapy": "Liệu pháp Levothyroxine",
  "nsaids": "Thuốc kháng viêm không steroid",
  "pci": "Can thiệp mạch vành qua da",
  "ppis": "Thuốc ức chế bơm proton",
  "pain_control": "Kiểm soát đau",
  "physical_therapy": "Vật lý trị liệu",
  "rai_therapy": "Liệu pháp i-ốt phóng xạ",
  "ripe_antibiotic_therapy": "Liệu pháp kháng sinh RIPE (Lao)",
  "rehydration": "Bù nước",
  "stop_drug": "Ngừng thuốc",
  "supportive_care": "Chăm sóc hỗ trợ",
  "surgery": "Phẫu thuật",
  "topical_retinoids": "Retinoid bôi da",
  "topical_oral_antibiotics": "Kháng sinh bôi/uống",
  "topicals": "Thuốc bôi tại chỗ",
  "treat_underlying_cause": "Điều trị nguyên nhân",
  "triptans": "Thuốc nhóm Triptan",
  "acyclovir_severe_cases": "Acyclovir (trường hợp nặng)",
  "allergen_avoidance": "Tránh tác nhân gây dị ứng",
  "antibiotics_rare": "Kháng sinh (hiếm khi)",
  "aspirin": "Aspirin",
  "balance_exercises": "Bài tập thăng bằng",
  "banding_surgery": "Thắt vòng cao su",
  "benzoyl_peroxide": "Benzoyl peroxide",
  "beta_blockers": "Thuốc chèn beta",
  "bile_acid_therapy": "Liệu pháp axit mật",
  "biologics": "Thuốc sinh học",
  "calamine": "Calamine",
  "corticosteroids": "Corticosteroid",
  "diet_change": "Thay đổi chế độ ăn",
  "fever_management": "Hạ sốt",
  "fluids": "Bù dịch",
  "hydration": "Bù nước",
  "immunotherapy": "Liệu pháp miễn dịch",
  "isotretinoin": "Isotretinoin",
  "laser_treatment": "Điều trị bằng laser",
  "lifestyle_changes": "Thay đổi lối sống",
  "monitoring": "Theo dõi",
  "nutritional_therapy": "Liệu pháp dinh dưỡng",
  "ointments": "Thuốc mỡ",
  "oral_hypoglycemics": "Thuốc hạ đường huyết đường uống",
  "oxygen_therapy": "Liệu pháp oxy",
  "phototherapy": "Liệu pháp ánh sáng",
  "prophylactic_meds": "Thuốc dự phòng",
  "prophylaxis_for_opportunistic_infections": "Dự phòng nhiễm trùng cơ hội",
  "rehab": "Phục hồi chức năng",
  "steroids": "Steroid",
  "symptomatic_relief": "Giảm triệu chứng",
  "traction": "Kéo giãn",
  "vestibular_rehabilitation_therapy": "Phục hồi chức năng tiền đình",
};

const VI_DESCRIPTION_MAP = {
    // Dựa trên danh sách bệnh trong EN_TO_VI_DISEASES
    "fungal infection is a common skin condition caused by fungus": "Nhiễm nấm là bệnh ngoài da phổ biến do vi nấm gây ra, thường gây ngứa và khó chịu.",
    "an allergy is an immune system response to a foreign substance that's not typically harmful to your body": "Dị ứng là phản ứng của hệ miễn dịch đối với một chất lạ thường không gây hại cho cơ thể.",
    "gerd (gastroesophageal reflux disease) is a digestive disorder that affects the ring of muscle between your esophagus and your stomach": "Trào ngược dạ dày thực quản (GERD) là rối loạn tiêu hóa ảnh hưởng đến cơ vòng giữa thực quản và dạ dày.",
    "chronic cholestasis is a condition where bile cannot flow from the liver to the duodenum": "Ứ mật mạn tính là tình trạng mật không thể lưu thông từ gan xuống tá tràng.",
    "drug reaction is an allergic reaction to a medication": "Phản ứng thuốc là tình trạng dị ứng hoặc tác dụng phụ không mong muốn do dùng thuốc.",
    "peptic ulcer disease represents a break in the lining of the stomach or first part of the small intestine": "Viêm loét dạ dày tá tràng là tình trạng niêm mạc dạ dày hoặc phần đầu ruột non bị tổn thương gây loét.",
    "aids is a chronic, potentially life-threatening condition caused by the human immunodeficiency virus (hiv)": "AIDS là hội chứng suy giảm miễn dịch mắc phải, giai đoạn cuối của nhiễm HIV, đe dọa đến tính mạng.",
    "diabetes is a disease that occurs when your blood glucose, also called blood sugar, is too high": "Tiểu đường là bệnh lý xảy ra khi lượng đường trong máu (glucose) quá cao.",
    "gastroenteritis is an inflammation of the lining of the intestines caused by a virus, bacteria or parasites": "Viêm dạ dày ruột là tình trạng viêm niêm mạc ruột do virus, vi khuẩn hoặc ký sinh trùng gây ra.",
    "bronchial asthma is a medical condition which causes the airway path of the lungs to swell and narrow": "Hen phế quản là bệnh lý khiến đường dẫn khí vào phổi bị sưng và hẹp lại, gây khó thở.",
    "hypertension is a chronic medical condition in which the blood pressure in the arteries is persistently elevated": "Tăng huyết áp là bệnh lý mãn tính trong đó áp lực máu trong động mạch tăng cao liên tục.",
    "migraine is a primary headache disorder characterized by recurrent headaches that are moderate to severe": "Đau nửa đầu (Migraine) là rối loạn đau đầu nguyên phát, đặc trưng bởi các cơn đau tái diễn từ vừa đến nặng.",
    "cervical spondylosis is a general term for age-related wear and tear affecting the spinal disks in your neck": "Thoái hóa đốt sống cổ là thuật ngữ chỉ sự hao mòn do tuổi tác ảnh hưởng đến các đĩa đệm cột sống cổ.",
    "paralysis is the loss of muscle function in part of your body": "Liệt là tình trạng mất chức năng cơ ở một phần cơ thể (thường do xuất huyết não).",
    "jaundice is a yellowish or greenish pigmentation of the skin and whites of the eyes due to high bilirubin levels": "Vàng da là tình trạng da và lòng trắng mắt chuyển màu vàng do nồng độ bilirubin tăng cao.",
    "malaria is a mosquito-borne infectious disease that affects humans and other animals": "Sốt rét là bệnh truyền nhiễm do ký sinh trùng lây truyền qua vết đốt của muỗi Anopheles.",
    "chickenpox is a highly contagious disease caused by the varicella-zoster virus (vzv)": "Thủy đậu là bệnh truyền nhiễm rất dễ lây lan do virus Varicella-zoster gây ra.",
    "dengue is a mosquito-borne tropical disease caused by the dengue virus": "Sốt xuất huyết là bệnh nhiệt đới lây truyền qua muỗi do virus Dengue gây ra.",
    "typhoid fever is a bacterial infection due to a specific type of salmonella": "Thương hàn là bệnh nhiễm trùng do vi khuẩn Salmonella typhi gây ra, lây qua đường ăn uống.",
    "hepatitis a is a highly contagious liver infection caused by the hepatitis a virus": "Viêm gan A là bệnh nhiễm trùng gan rất dễ lây lan do virus viêm gan A gây ra.",
    "hepatitis b is an infection of your liver. it can cause scarring of the organ, liver failure, and cancer": "Viêm gan B là bệnh nhiễm trùng gan có thể gây xơ gan, suy gan và ung thư gan.",
    "hepatitis c is an infection caused by a virus that attacks the liver and leads to inflammation": "Viêm gan C là bệnh do virus tấn công gan gây viêm và tổn thương gan.",
    "hepatitis d is a liver infection you can get only if you have hepatitis b": "Viêm gan D là bệnh nhiễm trùng gan chỉ xảy ra ở người đã mắc viêm gan B.",
    "hepatitis e is a liver infection caused by the hepatitis e virus": "Viêm gan E là bệnh nhiễm trùng gan do virus viêm gan E gây ra, thường lây qua nước uống nhiễm bẩn.",
    "alcoholic hepatitis is a diseased, inflammatory condition of the liver caused by heavy alcohol consumption": "Viêm gan do rượu là tình trạng viêm gan do uống nhiều rượu bia trong thời gian dài.",
    "tuberculosis (tb) is an infectious disease usually caused by the bacterium mycobacterium tuberculosis": "Lao (TB) là bệnh truyền nhiễm thường do vi khuẩn Mycobacterium tuberculosis gây ra, chủ yếu ở phổi.",
    "common cold is a viral infection of your nose and throat (upper respiratory tract)": "Cảm lạnh thông thường là nhiễm trùng virus ở mũi và họng (đường hô hấp trên).",
    "pneumonia is an infection that inflames the air sacs in one or both lungs": "Viêm phổi là tình trạng nhiễm trùng gây viêm các túi khí ở một hoặc cả hai phổi.",
    "dimorphic hemorrhoids (piles) are swollen veins in your anus and lower rectum": "Bệnh trĩ là tình trạng sưng các tĩnh mạch ở hậu môn và trực tràng dưới.",
    "heart attack occurs when the flow of blood to the heart is blocked": "Nhồi máu cơ tim (đau tim) xảy ra khi dòng máu đến tim bị tắc nghẽn đột ngột.",
    "varicose veins are gnarled, enlarged veins, most commonly appearing in the legs and feet": "Suy giãn tĩnh mạch là tình trạng tĩnh mạch bị xoắn, phình to, thường gặp ở chân và bàn chân.",
    "hypothyroidism is a condition in which the thyroid gland doesn't produce enough thyroid hormone": "Suy giáp là tình trạng tuyến giáp không sản xuất đủ hormone tuyến giáp.",
    "hyperthyroidism occurs when your thyroid gland produces too much of the hormone thyroxine": "Cường giáp xảy ra khi tuyến giáp sản xuất quá nhiều hormone thyroxine.",
    "hypoglycemia is a condition in which your blood sugar (glucose) level is lower than normal": "Hạ đường huyết là tình trạng lượng đường trong máu thấp hơn mức bình thường.",
    "osteoarthritis is the most common form of arthritis, affecting millions of people worldwide": "Thoái hóa khớp là dạng viêm khớp phổ biến nhất, ảnh hưởng đến sụn khớp.",
    "arthritis is the swelling and tenderness of one or more of your joints": "Viêm khớp là tình trạng sưng và đau tại một hoặc nhiều khớp.",
    "vertigo (paroxysmal positional vertigo) is a sensation of feeling off balance": "Chóng mặt kịch phát lành tính (BPPV) là cảm giác mất thăng bằng hoặc xoay tròn đột ngột.",
    "acne is a skin condition that occurs when your hair follicles become plugged with oil and dead skin cells": "Mụn trứng cá là bệnh da liễu xảy ra khi nang lông bị bít tắc bởi dầu và tế bào chết.",
    "urinary tract infection is an infection in any part of your urinary system": "Nhiễm trùng đường tiết niệu là tình trạng nhiễm trùng ở bất kỳ bộ phận nào của hệ tiết niệu.",
    "psoriasis is a skin disease that causes red, itchy scaly patches, most commonly on the knees, elbows, trunk and scalp": "Vảy nến là bệnh da liễu gây ra các mảng đỏ, ngứa và đóng vảy, thường ở đầu gối, khuỷu tay và da đầu.",
    "impetigo is a common and highly contagious skin infection that mainly affects infants and children": "Chốc lở là bệnh nhiễm trùng da phổ biến và dễ lây lan, thường gặp ở trẻ sơ sinh và trẻ nhỏ."
};

const VI_RISK_FACTOR_MAP = {
    "age": "Tuổi tác",
    "gender": "Giới tính",
    "genetics": "Di truyền",
    "family history": "Tiền sử gia đình",
    "smoking": "Hút thuốc lá",
    "alcohol consumption": "Tiêu thụ rượu bia",
    "obesity": "Béo phì",
    "diet": "Chế độ ăn uống",
    "physical inactivity": "Lười vận động",
    "stress": "Căng thẳng (Stress)",
    "high blood pressure": "Huyết áp cao",
    "high cholesterol": "Cholesterol cao",
    "diabetes": "Tiểu đường",
    "exposure to toxins": "Tiếp xúc với độc tố",
    "unsafe sex": "Quan hệ tình dục không an toàn",
    "poor hygiene": "Vệ sinh kém",
    "contaminated water": "Nguồn nước ô nhiễm",
    "mosquito bites": "Vết muỗi đốt",
    "travel history": "Lịch sử du lịch (đến vùng dịch)",
    "weak immune system": "Hệ miễn dịch suy yếu",
    "prolonged standing": "Đứng lâu",
    "heavy lifting": "Mang vác nặng",
    "sun exposure": "Tiếp xúc nhiều với ánh nắng",
    "allergens": "Các chất gây dị ứng (phấn hoa, lông thú...)",
    "cold weather": "Thời tiết lạnh",
    "humid weather": "Thời tiết ẩm ướt"
};

// Chuyển "General Practice" -> "general_practice" để khớp với Map
function normalizeKeyToSnakeCase(str) {
    if (!str) return "";
    // Chuyển thành chữ thường, xóa khoảng trắng thừa, thay dấu cách bằng dấu gạch dưới, thay dấu gạch ngang bằng gạch dưới
    return str.toString().toLowerCase().trim().replace(/[\s\-]+/g, '_');
}
function translateDiagnosis(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en); 
    // Thử tìm cả 2 kiểu: thường và snake_case
    return VI_DIAGNOSIS_MAP[cleanInput] || VI_DIAGNOSIS_MAP[snakeInput] || en;
}

function processInputSymptoms(input) {
    let str = Array.isArray(input) ? input.join(" ") : input;
    str = str.toLowerCase();

    VIETNAMESE_STOP_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        str = str.replace(regex, '');
    });
    str = str.trim().replace(/\s+/g, ' ');

    let translated = [];
    // Sử dụng VI_TO_EN_SYMPTOMS thay vì VI_TO_EN chung chung
    Object.keys(VI_TO_EN_SYMPTOMS)
        .sort((a, b) => b.length - a.length)
        .forEach(key => {
            if (str.includes(key)) {
                translated.push(VI_TO_EN_SYMPTOMS[key]);
                str = str.replace(key, '');
            }
        });

    if (translated.length === 0) {
        translated = Array.isArray(input) ? input.map(i => i.toLowerCase()) : [str];
    }
    return translated;
}
function translateMatchedList(matchedEnList) {
    if (!matchedEnList || matchedEnList.length === 0) return [];
    
    return matchedEnList.map(enItem => {
        // Tìm key (Tiếng Việt) dựa trên value (Tiếng Anh) trong map VI_TO_EN_SYMPTOMS
        const viKey = Object.keys(VI_TO_EN_SYMPTOMS).find(key => VI_TO_EN_SYMPTOMS[key] === enItem);
        return viKey || enItem; // Nếu không tìm thấy thì giữ nguyên tiếng Anh
    });
}

// EN -> VI (Tên bệnh)
function translateDiseaseName(name) {
    return EN_TO_VI_DISEASES[name] || name;
}

// VI -> EN (Tên bệnh để search)
function translateDiseaseVItoEN(nameVI) {
    let str = nameVI.toLowerCase().trim();
    const keys = Object.keys(VI_TO_EN_DISEASES).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (str.includes(key)) {
            return VI_TO_EN_DISEASES[key];
        }
    }
    return nameVI; // Trả về nguyên gốc nếu không tìm thấy
}

// EN -> VI (Chẩn đoán)
function translateTreatment(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en);
    return VI_TREATMENT_MAP[cleanInput] || VI_TREATMENT_MAP[snakeInput] || en;
}
//  HÀM DỊCH MÔ TẢ 
function translateDescription(en) {
    if (!en) return null;
    const key = en.toLowerCase().trim();
    // Thử tìm chính xác
    if (VI_DESCRIPTION_MAP[key]) {
        return VI_DESCRIPTION_MAP[key];
    }
    // Nếu không tìm thấy chính xác, trả về nguyên gốc (hoặc có thể xử lý mờ nếu cần)
    return en;
}

//  HÀM DỊCH YẾU TỐ NGUY CƠ 
function translateRiskFactor(en) {
    if (!en) return null;
    // Nếu là mảng
    if (Array.isArray(en)) {
        return en.map(item => translateRiskFactor(item));
    }
    
    const key = en.toLowerCase().trim();
    return VI_RISK_FACTOR_MAP[key] || en;
}

// EN -> VI (Điều trị)
function translateTreatment(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en);

    return VI_TREATMENT_MAP[cleanInput] || VI_TREATMENT_MAP[snakeInput] || en;
}

// EN -> VI (Bác sĩ)
function translateDoctor(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_DOCTORS[cleanInput] || VI_TRANSLATE_DOCTORS[snakeInput] || en;
}

// EN -> VI (Chuyên khoa)
function translateDepartment(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_DEPARTMENT[cleanInput] || VI_TRANSLATE_DEPARTMENT[snakeInput] || en;
}

// EN -> VI (Lời khuyên)
function translatePrecaution(en) {
    if (!en) return null;
    const cleanInput = en.toLowerCase().trim();
    const snakeInput = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_PRECAUTION[cleanInput] || VI_TRANSLATE_PRECAUTION[snakeInput] || en;
}

module.exports = {
    processInputSymptoms,
    translateDiseaseName,
    translateDiseaseVItoEN,
    translateDiagnosis,
    translateTreatment,
    translateDoctor,
    translateDepartment,
    translatePrecaution,
    translateMatchedList,
    translateDescription,
    translateRiskFactor,
    // Export các object gốc nếu cần dùng trực tiếp ở nơi khác
    VI_TRANSLATE_PRECAUTION,
    VI_TRANSLATE_DOCTORS,
    VI_DIAGNOSIS_MAP,
    VI_TREATMENT_MAP,
    VI_TRANSLATE_DEPARTMENT
};