const VIETNAMESE_STOP_WORDS = [
    "tôi", "tao", "tớ", "mình", "bạn", "anh", "chị", "em",
    "bị", "thấy", "trong", "người",
    "dạo", "này", "gần", "đây", "lâu", "nay",
    "hay", "thường", "xuyên", "có", "vẻ", "hơi", "rất", "quá", "lắm",
    "như", "là", "và", "hoặc", "nhưng", "thì", "mà", "ở", "với",
    "kiểu", "như", "đau", "nhức", "mỏi", "triệu", "chứng", "của"
];
const VI_TO_EN_SYMPTOMS = {
    // A
    "đau bụng": "abdominal pain",
    "kinh nguyệt bất thường": "abnormal menstruation",
    "ợ chua": "acidity",
    "suy gan cấp": "acute liver failure",
    "rối loạn tri giác": "altered sensorium",
    "lo âu": "anxiety",
    // B
    "đau lưng": "back pain",
    "đau vùng bụng": "belly pain",
    "mụn đầu đen": "blackheads",
    "khó chịu bàng quang": "bladder discomfort",
    "mụn nước": "blister",
    "ho ra máu": "blood in sputum",
    "đi ngoài ra máu": "bloody stool",
    "nhìn mờ": "blurred and distorted vision",
    "khó thở": "breathlessness",
    "móng tay dễ gãy": "brittle nails",
    "bầm tím": "bruising",
    "tiểu buốt": "burning micturition",
    // C
    "đau ngực": "chest pain",
    "ớn lạnh": "chills",
    "tay chân lạnh": "cold hands and feets",
    "hôn mê": "coma",
    "sung huyết": "congestion",
    "táo bón": "constipation",
    "buồn tiểu liên tục": "continuous feel of urine",
    "hắt hơi liên tục": "continuous sneezing",
    "ho": "cough",
    "chuột rút": "cramps",
    // D
    "nước tiểu sẫm màu": "dark urine",
    "mất nước": "dehydration",
    "trầm cảm": "depression",
    "tiêu chảy": "diarrhoea",
    "mảng đổi màu da": "dischromic patches",
    "chướng bụng": "distention of abdomen",
    "chóng mặt": "dizziness",
    "môi khô và tê": "drying and tingling lips",
    // E-F
    "tuyến giáp to": "enlarged thyroid",
    "đói quá mức": "excessive hunger",
    "quan hệ tình dục ngoài luồng": "extra marital contacts",
    "quan hệ tình dục không an toàn": "extra marital contacts",
    "tiền sử gia đình": "family history",
    "nhịp tim nhanh": "fast heart rate",
    "mệt mỏi": "fatigue",
    "thừa dịch": "fluid overload",
    "nước tiểu có mùi hôi": "foul smell of urine",
    // H
    "đau đầu": "headache",
    "sốt cao": "high fever",
    "đau khớp háng": "hip joint pain",
    "tiền sử uống rượu": "history of alcohol consumption",
    // I
    "thèm ăn": "increased appetite",
    "khó tiêu": "indigestion",
    "viêm móng": "inflammatory nails",
    "ngứa bên trong": "internal itching",
    "đường huyết không ổn định": "irregular sugar level",
    "dễ cáu gắt": "irritability",
    "kích ứng hậu môn": "irritation in anus",
    "ngứa": "itching",
    // J-L
    "đau khớp": "joint pain",
    "đau đầu gối": "knee pain",
    "mất tập trung": "lack of concentration",
    "lờ đờ": "lethargy",
    "chán ăn": "loss of appetite",
    "mất thăng bằng": "loss of balance",
    "mất khứu giác": "loss of smell",
    // M
    "khó chịu trong người": "malaise",
    "sốt nhẹ": "mild fever",
    "thay đổi tâm trạng": "mood swings",
    "cứng khớp khi vận động": "movement stiffness",
    "đờm nhầy": "mucoid sputum",
    "đau cơ": "muscle pain",
    "teo cơ": "muscle wasting",
    "yếu cơ": "muscle weakness",
    // N
    "buồn nôn": "nausea",
    "đau cổ": "neck pain",
    "nổi nốt trên da": "nodal skin eruptions",
    // O-P
    "béo phì": "obesity",
    "đau sau hốc mắt": "pain behind the eyes",
    "đau khi đi đại tiện": "pain during bowel movements",
    "đau vùng hậu môn": "pain in anal region",
    "đi lại đau đớn": "painful walking",
    "đánh trống ngực": "palpitations",
    "xì hơi nhiều": "passage of gases",
    "mảng trắng trong họng": "patches in throat",
    "đờm": "phlegm",
    "đa niệu": "polyuria",
    "nổi gân xanh bắp chân": "prominent veins on calf",
    "sưng mặt và mắt": "puffy face and eyes",
    "mụn mủ": "pus filled pimples",
    // R
    "nhận truyền máu": "receiving blood transfusion",
    "tiêm chích không an toàn": "receiving unsterile injections",
    "lở loét đỏ quanh mũi": "red sore around nose",
    "đốm đỏ khắp người": "red spots over body",
    "đỏ mắt": "redness of eyes",
    "bồn chồn": "restlessness",
    "sổ mũi": "runny nose",
    "đờm màu gỉ sắt": "rusty sputum",
    // S
    "sẹo": "scurring",
    "rùng mình": "shivering",
    "vảy bạc trên da": "silver like dusting",
    "căng tức xoang": "sinus pressure",
    "bong tróc da": "skin peeling",
    "phát ban da": "skin rash",
    "nói lắp": "slurred speech",
    "vết lõm trên móng": "small dents in nails",
    "cảm giác xoay tròn": "spinning movements",
    "tiểu lắt nhắt": "spotting urination",
    "cứng cổ": "stiff neck",
    "xuất huyết dạ dày": "stomach bleeding",
    "đau dạ dày": "stomach pain",
    "mắt trũng": "sunken eyes",
    "đổ mồ hôi": "sweating",
    "sưng hạch bạch huyết": "swelled lymph nodes",
    "sưng khớp": "swelling joints",
    "sưng bụng": "swelling of stomach",
    "mạch máu sưng phồng": "swollen blood vessels",
    "sưng tay chân": "swollen extremeties",
    "sưng chân": "swollen legs",
    // T-U-V-W-Y
    "rát họng": "throat irritation",
    "vẻ mặt nhiễm độc": "toxic look (typhos)",
    "loét lưỡi": "ulcers on tongue",
    "đi đứng không vững": "unsteadiness",
    "rối loạn thị giác": "visual disturbances",
    "nôn mửa": "vomiting",
    "nôn": "vomiting",
    "chảy nước mắt": "watering from eyes",
    "yếu tay chân": "weakness in limbs",
    "yếu nửa người": "weakness of one body side",
    "tăng cân": "weight gain",
    "sụt cân": "weight loss",
    "rỉ dịch vàng": "yellow crust ooze",
    "nước tiểu vàng": "yellow urine",
    "vàng mắt": "yellowing of eyes",
    "vàng da": "yellowish skin"
};
const EN_TO_VI_DISEASES = {
    "Paroxysmal Positional Vertigo": "Chóng mặt tư thế kịch phát lành tính",
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
    "Peptic ulcer disease": "Viêm loét dạ dày tá tràng",
    "Pneumonia": "Viêm phổi",
    "Psoriasis": "Vảy nến",
    "Tuberculosis": "Bệnh lao",
    "Typhoid": "Thương hàn",
    "Urinary tract infection": "Nhiễm trùng đường tiết niệu",
    "Varicose veins": "Suy giãn tĩnh mạch"
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
    "avoid_abrupt_head_movement": "Tránh cử động đầu đột ngột",
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
    "allergist": "Bác sĩ dị ứng",
    "cardiologist": "Bác sĩ tim mạch",
    "dermatologist": "Bác sĩ da liễu",
    "ent_specialist": "Bác sĩ Tai Mũi Họng",
    "endocrinologist": "Bác sĩ nội tiết",
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
    "specialized_departments_as_needed": "Các chuyên khoa khác nếu cần",
    "family_medicine": "Bác sĩ gia đình"
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
};

const VI_DIAGNOSIS_MAP = {
    // Tests
    "anti_hev_test": "Xét nghiệm kháng thể HEV",
    "anti_hav_igm_test": "Xét nghiệm kháng thể IgM kháng HAV",
    "bp_monitoring": "Theo dõi huyết áp",
    "blood_smear": "Phết máu ngoại vi",
    "cbc": "Công thức máu toàn bộ (CBC)",
    "cd4_count": "Đếm tế bào CD4",
    "ct_scan": "Chụp CT",
    "chest_x_ray": "Chụp X-quang ngực",
    "clinical_diagnosis": "Chẩn đoán lâm sàng",
    "clinical_exam": "Khám lâm sàng",
    "dix_hallpike_maneuver": "Nghiệm pháp Dix-Hallpike",
    "doppler_ultrasound": "Siêu âm Doppler",
    "ecg": "Điện tâm đồ (ECG)",
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
    "mri": "Chụp MRI",
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
    // Các mục viết thường khác trong CSV
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
    "physical_neurological_exam": "Khám thần kinh thực thể",
    "rapid_test": "Test nhanh",
    "rheumatoid_factor_tests": "Xét nghiệm yếu tố dạng thấp",
    "sputum_culture": "Cấy đờm",
    "sputum_test": "Xét nghiệm đờm",
    "stool_antigen_test": "Xét nghiệm kháng nguyên trong phân",
    "troponin_test": "Xét nghiệm Troponin",
    "ultrasound": "Siêu âm",
    "videonystagmography": "Ghi động nhãn đồ (VNG)",
    "viral_load_count": "Đo tải lượng virus"
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
    "dmards": "Thuốc chống thấp khớp (DMARDs)",
    "epley_maneuver": "Thủ thuật Epley",
    "fiber": "Bổ sung chất xơ",
    "fluid_therapy": "Bù dịch",
    "glucose_tablets": "Viên glucose",
    "iv_dextrose": "Truyền đường tĩnh mạch",
    "inhalers_bronchodilators": "Thuốc hít (giãn phế quản)",
    "insulin": "Insulin",
    "interferon_therapy": "Liệu pháp Interferon",
    "levothyroxine_therapy": "Liệu pháp Levothyroxine",
    "nsaids": "Thuốc kháng viêm không steroid (NSAID)",
    "pci": "Can thiệp mạch vành qua da (PCI)",
    "ppis": "Thuốc ức chế bơm proton (PPI)",
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
    "rest": "Nghỉ ngơi",
    "steroids": "Steroid",
    "symptomatic_relief": "Giảm triệu chứng",
    "traction": "Kéo giãn",
    "vestibular_rehabilitation_therapy": "Phục hồi chức năng tiền đình"
};

const VI_DESCRIPTION_MAP = {
    "a vestibular disorder where displaced otolith crystals in the inner ear trigger sudden, brief episodes of vertigo, especially with head movement.": 
    "Rối loạn tiền đình do sỏi tai trong bị lệch gây ra các cơn chóng mặt đột ngột, ngắn, đặc biệt khi cử động đầu.",
    
    "the final stage of hiv infection, where severe immune system damage leads to life-threatening infections and cancers.": 
    "Giai đoạn cuối của nhiễm HIV, khi hệ miễn dịch bị tổn thương nghiêm trọng dẫn đến các bệnh nhiễm trùng và ung thư đe dọa tính mạng.",

    "the final stage of hiv infection, where severe immune system damage leads to lifeâ€‘threatening infections and cancers.": 
    "Giai đoạn cuối của nhiễm HIV, khi hệ miễn dịch bị tổn thương nghiêm trọng dẫn đến các bệnh nhiễm trùng và ung thư đe dọa tính mạng.",

    "inflammatory skin condition involving clogged pores and bacterial overgrowth.": 
    "Tình trạng viêm da liên quan đến tắc nghẽn lỗ chân lông và sự phát triển quá mức của vi khuẩn.",
    
    "liver inflammation caused by excessive alcohol consumption.": "Viêm gan do tiêu thụ quá nhiều rượu.",
    
    "immune hypersensitivity reaction to normally harmless substances.": "Phản ứng quá mẫn của hệ miễn dịch đối với các chất thường không gây hại.",
    
    "joint inflammation causing pain and stiffness.": "Viêm các khớp gây đau và giảm khả năng vận động.",
    
    "chronic airway inflammation causing airflow obstruction (reversible).": "Viêm đường hô hấp mãn tính gây tắc nghẽn luồng khí.",
    
    "degeneration of cervical spine structures due to aging.": "Thoái hóa các cấu trúc cột sống cổ do lão hóa.",
    
    "highly contagious viral infection caused by varicella-zoster virus.": "Bệnh nhiễm virus rất dễ lây lan do virus varicella-zoster gây ra.",
    
    "reduced bile flow from liver leading to bile acid accumulation.": "Giảm dòng chảy của mật từ gan dẫn đến tích tụ axit mật.",
    
    "viral infection of the upper respiratory tract.": "Nhiễm trùng đường hô hấp trên do virus.",
    
    "mosquito-borne viral fever, can progress to hemorrhagic shock.": "Sốt do virus truyền qua muỗi, có thể tiến triển thành sốc xuất huyết.",
    
    "chronic metabolic disorder with high blood sugar levels.": "Rối loạn chuyển hóa mãn tính với nồng độ đường trong máu cao.",
    
    "swollen veins in rectum/anus causing discomfort.": "Tĩnh mạch sưng to ở trực tràng/hậu môn gây khó chịu.",
    
    "immune or toxic reaction to medication.": "Phản ứng miễn dịch hoặc độc tính đối với thuốc.",
    
    "infection by dermatophytes, candida, or yeast.": "Nhiễm trùng do nấm da, nấm candida hoặc nấm men.",
    
    "chronic acid reflux into the esophagus.": "Trào ngược axit mãn tính vào thực quản.",
    
    "infection/inflammation of the stomach and intestines.": "Nhiễm trùng/viêm dạ dày và ruột.",
    
    "blockage of coronary artery causing heart muscle death.": "Tắc nghẽn động mạch vành gây chết cơ tim.",
    
    "liver inflammation caused by hbv virus.": "Viêm gan do virus HBV gây ra.",
    
    "chronic viral liver infection leading to cirrhosis.": "Nhiễm virus gan mãn tính tiến triển thành xơ gan.",
    
    "co-infection requiring hbv presence.": "Đồng nhiễm virus cần có sự hiện diện của HBV.",
    
    "self-limiting viral hepatitis often via contaminated water.": "Viêm gan virus tự giới hạn thường qua nước nhiễm bẩn.",
    
    "chronic high blood pressure.": "Huyết áp cao mãn tính.",
    
    "overactive thyroid producing excess hormones.": "Tuyến giáp hoạt động quá mức sản xuất dư thừa hormone.",
    
    "dangerously low blood sugar levels.": "Lượng đường trong máu thấp nguy hiểm.",
    
    "underactive thyroid leading to low metabolism.": "Tuyến giáp hoạt động kém dẫn đến chuyển hóa thấp.",
    
    "bacterial skin infection with red sores.": "Nhiễm trùng da do vi khuẩn gây lở loét đỏ.",

    "chronic acid reflux into esophagus.": "Trào ngược axit mãn tính vào thực quản.",
    "yellowing of skin due to bilirubin buildup.": "Vàng da do tích tụ bilirubin.",
    "stomach/duodenal ulcers from acid or h. pylori.": "Loét dạ dày/tá tràng do axit hoặc vi khuẩn H. pylori.",
    "inflammation of joints causing pain and reduced mobility.": "Viêm các khớp gây đau và giảm khả năng vận động.",
    "infection/inflammation of stomach & intestines.": "Nhiễm trùng/viêm dạ dày và ruột.",
    "self-limiting viral hepatitis usually via contaminated water.": "Viêm gan virus tự giới hạn thường qua nước nhiễm bẩn.",
    "age-related degeneration of cervical spine structures.": "Thoái hóa các cấu trúc cột sống cổ do lão hóa.",
    "immune or toxic response to medications.": "Phản ứng miễn dịch hoặc độc tính đối với thuốc.",
    "dangerously low blood sugar.": "Lượng đường trong máu thấp nguy hiểm.",
    "recurrent headache disorder involving neurological mechanisms.": "Rối loạn đau đầu tái phát liên quan đến cơ chế thần kinh.",
    "acute viral infection of the liver transmitted via contaminated food/water.": "Nhiễm virus cấp tính ở gan lây qua thực phẩm/nước ô nhiễm.",
    "loss of muscle control due to bleeding inside the brain.": "Mất kiểm soát cơ do chảy máu bên trong não.",
    "lung infection filling alveoli with fluid.": "Nhiễm trùng phổi làm đầy dịch trong phế nang.",
    "chronic viral liver infection progressing to cirrhosis.": "Nhiễm virus gan mãn tính tiến triển thành xơ gan.",
    "chronic autoimmune skin disease causing rapid skin turnover.": "Bệnh da tự miễn mãn tính gây thay da nhanh chóng.",
    "mosquito-borne viral fever that may progress to hemorrhagic shock.": "Sốt do virus truyền qua muỗi, có thể tiến triển thành sốc xuất huyết.",
    "overactive thyroid gland producing excess hormones.": "Tuyến giáp hoạt động quá mức sản xuất dư thừa hormone.",
    "enlarged swollen veins in rectum/anus causing discomfort.": "Tĩnh mạch sưng to ở trực tràng/hậu môn gây khó chịu.",
    "parasitic infection transmitted by anopheles mosquitoes.": "Nhiễm ký sinh trùng do muỗi Anopheles truyền.",
    "infection of bladder or urinary system.": "Nhiễm trùng bàng quang hoặc hệ tiết niệu.",
    "blocked coronary artery causing myocardial death.": "Tắc nghẽn động mạch vành gây chết cơ tim.",
    "viral co-infection requiring presence of hbv.": "Đồng nhiễm virus cần có sự hiện diện của HBV.",
    "systemic bacterial infection from salmonella typhi.": "Nhiễm vi khuẩn toàn thân do Salmonella typhi.",
    "contagious bacterial skin infection.": "Nhiễm trùng da do vi khuẩn dễ lây lan.",
    "reduced bile flow from liver leading to buildup of bile acids.": "Giảm dòng chảy của mật từ gan dẫn đến tích tụ axit mật.",
    "infection caused by dermatophytes, candida, or yeasts.": "Nhiễm trùng do nấm da, nấm candida hoặc nấm men.",
    "enlarged, twisted superficial veins, usually in legs.": "Tĩnh mạch nông giãn to, xoắn lại, thường ở chân.",
    "degeneration of joint cartilage causing chronic pain.": "Thoái hóa sụn khớp gây đau mãn tính.",
    "chronic bacterial infection causing lung damage.": "Nhiễm vi khuẩn mãn tính gây tổn thương phổi.",
    "chronic metabolic disorder with elevated blood glucose levels.": "Rối loạn chuyển hóa mãn tính với nồng độ đường trong máu cao.",
    "viral upper respiratory tract infection.": "Nhiễm virus đường hô hấp trên.",
    "chronic airway inflammation causing reversible airflow obstruction.": "Viêm đường hô hấp mãn tính gây tắc nghẽn luồng khí có hồi phục.",
    "acute viral infection of the liver transmitted via contaminated food/water.": "Nhiễm virus cấp tính ở gan lây qua thực phẩm/nước ô nhiễm."
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
// Chuẩn hóa chuỗi mô tả (Xóa xuống dòng, sửa lỗi font â€‘)
function normalizeString(str) {
    if (!str) return "";
    return str.toString()
        .toLowerCase()
        .replace(/â€‘/g, '-')     // Sửa lỗi font đặc biệt trong CSV
        .replace(/[\r\n]+/g, ' ') // Xóa xuống dòng
        .replace(/\s+/g, ' ')     // Xóa khoảng trắng thừa
        .trim();
}

// Chuẩn hóa key sang snake_case (VD: "CT scan." -> "ct_scan")
function normalizeKeyToSnakeCase(str) {
    if (!str) return "";
    return str.toString()
        .toLowerCase()
        .replace(/â€‘/g, '-')     // Sửa lỗi font
        .trim()
        .replace(/[.,;!]+$/, '')  // Xóa dấu chấm/phẩy ở cuối câu (Rất quan trọng với file CSV của bạn)
        .replace(/[\s\-()]+/g, '_') // Thay khoảng trắng, gạch ngang, ngoặc bằng _
        .replace(/_+$/, '');      // Xóa _ thừa ở cuối
}

// translate input symptoms from VI to EN
function processInputSymptoms(input) {
    let str = Array.isArray(input) ? input.join(" ") : input;
    str = str.toLowerCase();

    VIETNAMESE_STOP_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        str = str.replace(regex, '');
    });
    str = str.trim().replace(/\s+/g, ' ');

    let translated = [];
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


// dich ten benh EN -> VI
function translateDiseaseName(name) {
    return EN_TO_VI_DISEASES[name] || name;
}

// Từ đồng nghĩa y học tiếng Việt viết tắt/phổ biến -> Tên tiếng Anh chuẩn trong DB
// Từ đồng nghĩa y học tiếng Việt viết tắt/phổ biến -> Tên tiếng Anh chuẩn trong DB
const SEARCH_SYNONYMS = {
    "tiểu đường": "Diabetes",
    "đái tháo đường": "Diabetes",
    "cao huyết áp": "Hypertension",
    "huyết áp cao": "Hypertension",
    "tăng huyết áp": "Hypertension",
    "trào ngược dạ dày": "GERD",
    "trào ngược": "GERD",
    "sốt xuất huyết": "Dengue",
    "cúm": "Common Cold", 
    "cảm cúm": "Common Cold",
    "cảm lạnh": "Common Cold",
    "trĩ": "Dimorphic hemorrhoids (piles)",
    "bệnh trĩ": "Dimorphic hemorrhoids (piles)",
    "trĩ nội": "Dimorphic hemorrhoids (piles)",
    "trĩ ngoại": "Dimorphic hemorrhoids (piles)",
    "bệnh trĩ nội": "Dimorphic hemorrhoids (piles)",
    "bệnh trĩ ngoại": "Dimorphic hemorrhoids (piles)",
    "đau nửa đầu": "Migraine",
    "đau đầu": "Migraine",
    "vàng da": "Jaundice",
    "thủy đậu": "Chicken pox",
    "viêm phổi": "Pneumonia",
    "lao": "Tuberculosis",
    "bệnh lao": "Tuberculosis",
    "suy giãn tĩnh mạch": "Varicose veins",
    "giãn tĩnh mạch": "Varicose veins",
    "nhiễm trùng tiết niệu": "Urinary tract infection",
    "nhiễm trùng đường tiết niệu": "Urinary tract infection",
    "viêm khớp": "Arthritis",
    "hen suyễn": "Bronchial Asthma",
    "hen phế quản": "Bronchial Asthma",
    "mụn": "Acne",
    "mụn trứng cá": "Acne",
    "dị ứng": "Allergy",
    "chốc lở": "Impetigo",
    "chóng mặt": "Paroxysmal Positional Vertigo",
    "chóng mặt kịch phát": "Paroxysmal Positional Vertigo",
    "bppv": "Paroxysmal Positional Vertigo",
    "loét dạ dày": "Peptic ulcer disease",
    "viêm loét dạ dày": "Peptic ulcer disease",
    "aids": "AIDS",
    "suy giảm miễn dịch": "AIDS",
    "nhồi máu cơ tim": "Heart attack",
    "đau tim": "Heart attack",
    "liệt": "Paralysis (brain hemorrhage)",
    "xuất huyết não": "Paralysis (brain hemorrhage)"
};

function removeVietnameseTones(str) {
    if (!str) return "";
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/Đ/g, "d");
}

// VI -> EN (Tên bệnh để search)
function translateDiseaseVItoEN(nameVI) {
    if (!nameVI) return "";
    let str = nameVI.toLowerCase().trim();
    let strNoTone = removeVietnameseTones(str);
    
    // 1. Kiểm tra trong bảng SEARCH_SYNONYMS trước (cả có dấu và không dấu)
    if (SEARCH_SYNONYMS[str]) {
        return SEARCH_SYNONYMS[str];
    }
    
    // Kiểm tra không dấu trong SEARCH_SYNONYMS
    for (const synKey in SEARCH_SYNONYMS) {
        if (removeVietnameseTones(synKey) === strNoTone) {
            return SEARCH_SYNONYMS[synKey];
        }
    }
    
    // 2. Kiểm tra khớp chính xác hoàn toàn trong từ điển chính VI_TO_EN_DISEASES
    if (VI_TO_EN_DISEASES[str]) {
        return VI_TO_EN_DISEASES[str];
    }
    
    // 3. Tìm kiếm thông minh hơn (khớp ranh giới từ nguyên vẹn - Whole Word Match)
    const keys = Object.keys(VI_TO_EN_DISEASES).sort((a, b) => b.length - a.length);
    const regexWholeWord = new RegExp('\\b' + strNoTone + '\\b', 'i');
    
    for (const key of keys) {
        const keyNoTone = removeVietnameseTones(key);
        // Thay thế ký tự không phải chữ/số thành khoảng trắng để regex \b bắt chính xác nguyên từ
        const cleanKeyNoTone = keyNoTone.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (regexWholeWord.test(cleanKeyNoTone)) {
            return VI_TO_EN_DISEASES[key];
        }
    }
    return nameVI;
}


// Dich diagonisis tu En sang Vi
function translateDiagnosis(en) {
    if (!en) return null;
    const cleanKey = normalizeKeyToSnakeCase(en);
    return VI_DIAGNOSIS_MAP[cleanKey] || en;
}

// EN -> VI (Dieu tri)
function translateTreatment(en) {
    if (!en) return null;
    const cleanKey = normalizeKeyToSnakeCase(en);
    return VI_TREATMENT_MAP[cleanKey] || en;
}


// EN -> VI (Bác sĩ)
function translateDoctor(en) {
    if (!en) return null;
    const cleanKey = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_DOCTORS[cleanKey] || en;
}

// EN -> VI (khoa)
function translateDepartment(en) {
    if (!en) return null;
    const cleanKey = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_DEPARTMENT[cleanKey] || en;
}

// dua ra loi khuyen phong ngua EN -> VI
function translatePrecaution(en) {
    if (!en) return null;
    const cleanKey = normalizeKeyToSnakeCase(en);
    return VI_TRANSLATE_PRECAUTION[cleanKey] || en;
}

// overview: 
function translateDescription(en) {
    if (!en) return null;
    const cleanInput = normalizeString(en);
    for (const key in VI_DESCRIPTION_MAP) {
        if (normalizeString(key) === cleanInput) {
            return VI_DESCRIPTION_MAP[key];
        }
    }
    return en; 
}

//  HÀM DỊCH YẾU TỐ NGUY CƠ 
function translateRiskFactor(en) {
    if (!en) return null;
    // Risk Factor thường là câu dài, xử lý giống description
    const cleanInput = normalizeString(en);
    // Nếu chưa có map risk factor riêng, trả về gốc hoặc map tạm
    return en;
}

// Ham dich tieng viet sang tieng anh va do list
function translateMatchedList(matchedEnList) {
    if (!matchedEnList || matchedEnList.length === 0) return [];
    
    return matchedEnList.map(enItem => {
        // Tìm key (Tiếng Việt) dựa trên value (Tiếng Anh) trong map VI_TO_EN_SYMPTOMS
        const viKey = Object.keys(VI_TO_EN_SYMPTOMS).find(key => VI_TO_EN_SYMPTOMS[key] === enItem);
        return viKey || enItem; // Nếu không tìm thấy thì giữ nguyên tiếng Anh
    });
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