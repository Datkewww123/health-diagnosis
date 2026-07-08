# Location — Tìm bệnh viện gần nhất

## Vấn đề

- Frontend gọi `getNearbyHospitals(lat, lng, department)` → backend gọi Overpass API → timeout sau 5s
- Lỗi: `Request timed out at getRequest (client.ts:113:17)`

## Nguyên nhân

### 1. Backend Overpass timeout quá thấp
- `httpsGetJson` dùng `req.destroy()` nhưng **không reject promise** (vì thiếu `setTimeout` wrapper)
- Cả 2 server Overpass được gọi song song (`Promise.allSettled`) nhưng `kumi.systems` trả về 0 element, nếu server này `fulfilled` trước thì sẽ bị chọn nhầm (dùng `find` thay vì đúng server)
- Query thiếu type `relation` → bỏ sót nhiều bệnh viện lớn mapped dạng relation
- Query thiếu tag `healthcare=hospital` (OSM mới dùng tag này thay `amenity=hospital`)
- Filter `el.tags.name` quá chặt: nhiều cơ sở y tế VN trên OSM không có `name` tag

### 2. Không cache DB
- Mỗi request đều gọi Overpass → chậm, dễ timeout
- Frontend cần `id` của hospital (từ DB) để gọi `getDoctorsByHospital(id)`
- Overpass không trả về `id`, chỉ trả về OSM `id` không dùng được cho hệ thống

### 3. Một số bệnh viện không có trên OSM
- Ví dụ: **Bệnh viện Tân Phú** không tồn tại trên OpenStreetMap → Overpass không thể trả về
- Cần seed thủ công các bệnh viện offline vào DB nếu muốn có đầy đủ

## Các bước đã fix

### Bước 1 — Overpass query hoàn chỉnh
- Thêm tag `healthcare=hospital`, `healthcare=clinic`
- Thêm type `relation`
- Bỏ filter `name`: giữ tất cả element có `tags`, fallback name = `'Cơ sở y tế'`
- Xuất `out center 100` (lấy center cho way/relation)

### Bước 2 — Timeout & parallel đúng
- Thay `Promise.allSettled` bằng **sequential** (thử từng server, server 1 → server 2)
- Thêm `setTimeout` wrapper bên ngoài `httpsGetJson` để đảm bảo reject chắc chắn
- Timeout mỗi server: 10s (frontend GET timeout là 15s)
- Thử bán kính mở rộng: 10km → 50km

### Bước 3 — Cache vào MySQL
- Luồng mới:
  1. Query DB trong ±1° (~111km) từ user
  2. Có → tính Haversine distance → trả về (kèm `id`)
  3. Không → gọi Overpass → `findOrCreate` vào DB → query lại → trả về

### Bước 4 — Seed toàn quốc
- File: `scripts/seedHospitalsFromOverpass.js`
- Query Overpass với `area(3600155219)` (toàn bộ Việt Nam)
- Timeout 95s, limit 10000 elements
- Chạy: `npm run seed:hospitals`

## Cấu trúc hiện tại

```
GET /api/appointments/nearby-hospitals?latitude=...&longitude=...
  ├── DB query (Hospital.findAll, ±1°)
  │   ├── có kết quả → tính distance → return (kèm id, image_url, description)
  │   └── không có kết quả → gọi Overpass
  │       ├── thử server 1 (10s) → server 2 (10s)
  │       ├── radius 10km → 50km
  │       ├── findOrCreate vào MySQL
  │       └── return list (kèm id từ DB)
  └── fallback: empty array
```

## Response format (khớp frontend HospitalData)

```ts
interface HospitalData {
  id: number;          // từ DB
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  image_url: string;   // '' nếu từ Overpass
  description: string; // '' nếu từ Overpass
  distance: number;    // km, 1 số lẻ
}
```

## Những gì chưa fix

- **Bệnh viện offline** (không có trên OSM): cần seed thủ công qua API hoặc script
- **Department filter** trong `getNearbyHospitals`: tham số `department` được gửi từ frontend nhưng backend không dùng để filter (vì Overpass không có dữ liệu khoa)
- **Logging server-side** đã thêm `[Overpass]` và `[DB]` prefix để debug

## File đã sửa

| File | Thay đổi |
|------|----------|
| `src/controller/appointmentController.js` | Viết lại `getNearbyHospitals`: DB-first + Overpass fallback |
| `scripts/seedHospitalsFromOverpass.js` | File mới: seed toàn bộ VN từ Overpass |
| `package.json` | Thêm script `seed:hospitals` |
