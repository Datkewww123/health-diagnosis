# Diagnosis — Chẩn đoán bệnh theo triệu chứng

## Vấn đề

- `POST /api/symptoms/check` chỉ trả về 1-2 bệnh dù nhập bất kỳ triệu chứng nào

## Nguyên nhân

### 1. DB chỉ có 5 bệnh mẫu
File `scripts/seed.js` (chạy lúc init) chỉ tạo 5 bệnh:

| Bệnh | Số triệu chứng | Tổng weight |
|------|---------------|-------------|
| Cúm A | 4 | 8 |
| Sốt xuất huyết | 4 | 9 |
| Viêm họng cấp | 2 | 5 |
| Viêm phế quản cấp | 2 | 5 |
| Viêm loét dạ dày | 2 | 5 |

Dù thuật toán weight-score hoạt động đúng, pool quá nhỏ → tối đa 1-2 bệnh match.

### 2. Thuật toán
1. So khớp text tự do → tìm symptom ID
2. Load ALL disease → symptom (JOIN `disease_symptoms` với weight)
3. Tính `score = (matchedWeight / totalWeight) * 100`
4. Lọc score > 0, sort giảm dần

## Các bước đã fix

### Mở rộng dữ liệu — `scripts/seedMoreDiseases.js`
- Thêm **40 triệu chứng mới**: mệt mỏi, ớn lạnh, chóng mặt, đau ngực, hồi hộp, phù, tê bì, tiêu chảy, táo bón, đau bụng, khát nước, tiểu nhiều, đau khớp, v.v.
- Thêm **25 bệnh mới** chia theo chuyên khoa:

| Nhóm | Bệnh |
|------|------|
| Hô hấp | Viêm phổi, Hen suyễn, Viêm xoang, Viêm mũi dị ứng |
| Tiêu hóa | Trào ngược dạ dày, Viêm đại tràng, Viêm gan B, Xơ gan, Hội chứng ruột kích thích |
| Tim mạch | Tăng huyết áp, Thiểu năng mạch vành, Suy tim |
| Cơ xương khớp | Thoái hóa khớp, Gout, Viêm khớp dạng thấp, Đau thần kinh tọa |
| Thần kinh | Đau nửa đầu Migraine, Rối loạn tiền đình |
| Nội tiết | Tiểu đường type 2, Cường giáp, Suy giáp |
| Da liễu | Zona thần kinh, Mề đay mạn tính, Viêm da cơ địa |
| Tiết niệu | Nhiễm trùng đường tiểu |

- Liên kết disease-symptom với weight (1=phổ biến, 2=quan trọng, 3=đặc trưng)
- Dùng `findOrCreate` — không xoá dữ liệu cũ, chạy được nhiều lần

## Endpoint

```
POST /api/symptoms/check
Body: { "symptoms": "sốt cao, ho khan, đau họng" }
Response: { message, count, data: [{ id, name, score, matched[], departments }] }
```

Thuật toán:
- `score = (matchedWeight / totalWeight) × 100`
- Không cần match tất cả triệu chứng — chỉ cần match 1 cũng ra kết quả (score > 0)

## Cách chạy

```bash
npm run seed:more
```

Sau đó test:
```bash
curl -X POST http://localhost:3001/api/symptoms/check \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "sốt cao, ho, đau ngực, khó thở"}'
```

## Hạn chế

- Dữ liệu triệu chứng trong keywordMap ở `symptomsController.js` (dòng 37-46) có hardcode synonym — nếu thêm triệu chứng mới cần cập nhật cả keywordMap
- Không có synonym tự động (VD: "đau bụng" không tự match "đau quặn bụng" nếu không có trong keywordMap)
- Score dựa trên weight => bệnh ít triệu chứng dễ đạt score cao hơn bệnh nhiều triệu chứng

## Files đã sửa

| File | Thay đổi |
|------|----------|
| `scripts/seedMoreDiseases.js` | File mới: 40 symptom + 25 disease + liên kết weight |
| `package.json` | Thêm script `seed:more` |
