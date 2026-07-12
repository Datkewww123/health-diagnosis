# Danh sách vấn đề tồn đọng - Health Diagnosis Project

> Cập nhật: 2026-07-11

---

## BACKEND

### CRITICAL

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B1 | SQL Injection | `src/controller/symptomsController.js` | 106, 127 | Raw SQL dùng string interpolation (`IN (${joined})`) thay vì parameterized queries |
| B2 | JWT_SECRET mặc định | `.env` | 7 | `JWT_SECRET=your-secret-key-here` - ai cũng có thể giả mạo token JWT |
| B3 | Endpoint không auth | `src/routes/news.js` | 8 | `POST /api/news/refresh` không cần xác thực - ai cũng trigger được fetch RSS bên ngoài |
| B4 | Doctor.create crash | `src/controller/adminController.js` | 272 | Tạo bác sĩ mới không truyền `name` (allowNull: false) → DB constraint violation |
| B5 | Disease.create sai field | `src/controller/adminController.js` | 38-41 | Ghi vào cột không tồn tại: `precaution_1..4`, `symptoms`, `doctors` trong Disease model |

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B6 | Không validate mật khẩu | `src/controller/authController.js` | 58 | Chấp nhận mật khẩu `"a"`, không kiểm tra độ dài/độ phức tạp |
| B7 | Thiếu try/catch | `src/controller/symptomsController.js` | 59-212 | `symptomsCheck` không có try/catch tổng → promise rejection crash server |
| B8 | Mongoose trên Sequelize | `src/controller/mailController.js` | 34 | Dùng `User.findById()` (Mongoose) trên Sequelize model → crash |
| B9 | Nearby hospital không auth | `src/routes/appointment.js` | 7 | `GET /nearby-hospitals` không auth → abuse API Overpass + ghi DB tuỳ tiện |
| B10 | Hospital.create crash | `src/controller/adminController.js` | 316 | Tạo bệnh viện không truyền `location` (allowNull: false) |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B11 | express-validator unused | `package.json` | 41 | Cài dependency mà không import hay dùng ở đâu |
| B12 | getJwtSecret duplicate | `middleware/auth.js`, `middleware/isAdmin.js`, `controller/authController.js` | 5-11 (mỗi file) | Hàm giống hệt nhau copy-pasted ở 3 nơi |
| B13 | Dead code: historyController | `src/controller/historyController.js` | Toàn file | Dùng Mongoose syntax trên Sequelize model, chưa bao giờ import |
| B14 | Dead code: rssService | `src/config/rssService.js` | Toàn file | Trùng lặp với newsService.js, chưa bao giờ import |
| B15 | Dead code: temp_test.js | `temp_test.js` | Toàn file | File test tạm để lại ở root project |
| B16 | sendMail route không mount | `src/routes/sendMail.js` | Toàn file | Route tồn tại nhưng không import trong `index.js` |
| B17 | listDiseases duplicate | `src/controller/diseasesController.js` | 57, 302 | Define trùng 2 lần, cái sau ghi đè cái trước |
| B18 | Không có unhandledRejection | `src/index.js` | - | Không có `process.on('unhandledRejection')` → crash im lặng |
| B19 | MONGO_URI thừa | `.env` | 2 | Project dùng MySQL nhưng `.env` còn `MONGO_URI` từ cấu hình cũ |
| B20 | getNearbyHospitals thiếu try/catch | `src/controller/appointmentController.js` | 9-142 | Không validate `parseFloat(latitude)` → NaN, thiếu outer try/catch |
| B21 | Hospital location allowNull | `src/model/hospital.js` | 26-29 | `location` allowNull: false nhưng `createHospital` không tạo geometry |
| B22 | Doctor name allowNull | `src/model/doctor.js` | 20-23 | `name` allowNull: false nhưng `createDoctor` không truyền name |
| B23 | Medicine thiếu hospital FK | `src/model/medicine.js` | 33-36 | `hospital_id` không có `references`, thiếu `Hospital.hasMany(Medicine)` |
| B24 | .env.example thiếu vars | `.env.example` | - | Thiếu `CORS_ORIGIN`, `DB_HOST`, `DB_PORT`, `WHO_ICD_*` |
| B25 | Không validate input | Nhiều file | - | Không có `express-validator` trên bất kỳ route nào, `:id` không check integer |
| B26 | Dashboard route inline | `src/index.js` | 76 | `/api/dashboard/daily` đăng ký inline thay vì dùng Router |

---

## FRONTEND

### CRITICAL

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F1 | Hardcode localhost:3001 | `src/pages/AdminDashboard.tsx` | 94, 110, 125, 140, 169, 197, 222, 247 | 8 chỗ gọi fetch trực tiếp `http://localhost:3001` thay vì dùng `client.ts` → fail khi deploy |
| F2 | Duplicate fetch logic | `src/api/admin.ts`, `src/api/user.ts` | Nhiều dòng | Tự viết fetch với auth headers thay vì dùng `postRequest`/`getRequest` từ `client.ts` |

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F3 | Stale closure trong useEffect | `src/pages/AdminDashboard.tsx` | 152-163 | `useEffect` phụ thuộc `[activeTab]` nhưng gọi `fetchAppointments` với filter state cũ |
| F4 | ToastContext memory leak | `src/context/ToastContext.tsx` | 29-31 | `setTimeout` không clear khi unmount → gọi setState trên component đã unmount |
| F5 | useEffect deps thừa | `src/pages/History.tsx` | 280-322 | Đặt `toast` trong deps → re-fetch dữ liệu mỗi khi toast thay đổi |
| F6 | useEffect re-run vô tận | `src/pages/DiseaseDetail.tsx` | 160 | Đặt `location.state` trong deps → object mới mỗi render → effect chạy lại liên tục |
| F7 | Không có AbortController | `src/pages/Home.tsx`, `Profile.tsx`, `History.tsx`, `DiseaseDetail.tsx` | Nhiều useEffect | Không cleanup async effect → warning React + potential memory leak |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F8 | Unused imports | `src/pages/AdminDashboard.tsx` | 3-7 | `Edit`, `Trash2`, `CheckCircle`, `XCircle`, `Search`, `AlertTriangle`, `ChevronRight` không dùng |
| F9 | Thuộc tính không tồn tại | `src/pages/History.tsx` | 598 | `it.queryText` nhưng interface `SearchHistoryItem` không có field này → luôn undefined |
| F10 | User.phone không có type | `src/pages/History.tsx` | 193 | `user?.phone` nhưng interface `User` trong AuthContext không define `phone` |
| F11 | Stats hardcoded | `src/pages/AdminDashboard.tsx` | 366-395 | "12 Bác sĩ", "4 Bệnh viện", "51 Thuốc", "92.5% AI" là số cứng, không fetch từ API |
| F12 | Module-level singleton | `src/pages/Profile.tsx` | 23 | `cachedProfile` ở module scope → stale data khi HMR hoặc update ở tab khác |
| F13 | Index-based keys | `src/pages/History.tsx`, `Search.tsx`, `DiseaseDetail.tsx` | Nhiều nơi | Dùng `key={idx}` thay vì unique ID khi ID sẵn có |
| F14 | postRequest overloaded | `src/api/client.ts` | 17 | `postRequest` cũng xử lý PUT/PATCH qua options override → gây confusion |
| F15 | Duplicate event dispatch | `src/pages/Profile.tsx` | 203-204 | Dispatch cả `CustomEvent` lẫn `Event` cho `auth-change` → cái thứ 2 là dead code |

---

# Đợt 2: Vấn đề bổ sung (sau khi fix đợt 1)

> Cập nhật: 2026-07-11

---

## BACKEND - Đợt 2

### CRITICAL

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B27 | OTP dùng Math.random() | `src/controller/authController.js` | 191 | OTP sinh bằng `Math.random()` — không cryptographic secure, dễ dự đoán |
| B28 | Password hash leak trong response | `src/controller/adminController.js` | 275 | `createDoctor` trả về full user object bao gồm bcrypt hash |
| B29 | Không validate email format | `src/controller/authController.js` | 40-46 | Signup chấp nhận bất kỳ string nào làm email |
| B30 | Secrets trong .env có thể bị leak | `.env` | 2-5,13-15 | Gmail OAuth, WHO ICD secret, Gemini key, NewsData key đều có real values |

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B31 | LIKE wildcard injection | `diseasesController.js:20`, `adminController.js:371`, `medicineController.js:33`, `appointmentController.js:166` | Nhiều | `Op.like: '%${input}%'` không escape `%`, `_` — attacker có thể craft pattern match all rows |
| B32 | Không enforce HTTPS | `src/index.js` | - | Không có middleware force HTTPS — passwords/tokens truyền plaintext |
| B33 | Không limit request body size | `src/index.js` | 64 | `express.json()` không có `limit` → attacker gửi payload GB gây OOM crash |
| B34 | Race condition trừ tồn kho thuốc | `src/controller/appointmentController.js` | 468-481 | Read-modify-write `med.quantity` không atomic — 2 request cùng lúc đọc quantity=10, cả 2 trừ 5 → kết quả 5 thay vì 0 |
| B35 | Không dùng transaction | `src/controller/appointmentController.js` | 434-499 | `updateTreatment` lưu appointment + trừ tồn kho thuốc không transaction — nếu trừ fail thì appointment vẫn completed |
| B36 | Mass assignment | `src/controller/adminController.js` | 121,136 | `const updateData = { ...req.body }` spread toàn bộ request body → attacker ghi đè `id`, `created_at`, `icd_code` |
| B37 | Không check uniqueness khi update | `src/controller/userController.js` | 88-92 | Update Username/email trùng sẽ trigger Sequelize unique constraint error + leak stack trace |
| B38 | Internal error leak | `src/controller/icdController.js` | 31,84 | `res.status(500).json({ message: '... ' + err.message })` — leak internal error details cho client |
| B39 | Broken access control doctor-patient | `src/controller/appointmentController.js` | 322-386 | Bất kỳ doctor nào cũng xem được health profile của bất kỳ patient nào — không check relationship |
| B40 | News refresh không cần admin | `src/routes/news.js` | 9 | POST /refresh chỉ cần verifyToken, không cần isAdmin → bất kỳ user nào trigger được |
| B41 | Client-side role check | `src/pages/AdminDashboard.tsx` (frontend) | `App.tsx:41` | AdminRoute đọc role từ localStorage — giả mạo `localStorage.setItem("role","admin")` là bypass được |
| B42 | Không validate URL khi render | `src/pages/Home.tsx` | 312 | `article.url` render trực tiếp trong `<a href>` — javascript: URL attack |
| B43 | JWT decode client-side không verify | `src/pages/Login.tsx` | 9-20 | `decodeJWT()` dùng `atob()` — không verify signature, token giả mạo vẫn decode được |
| B44 | Double fetch loadArticles | `src/pages/Home.tsx` | 30-52, 65-98 | `loadArticles()` + useEffect cùng fetch bài viết trên mount |
| B45 | Print HTML injection | `src/pages/History.tsx` | 151-246 | User data (First_name, Last_name, notes) interpolate trực tiếp vào raw HTML |
| B46 | handleSelectRegistered không cleanup | `src/pages/Booking.tsx` | 180-184 | Async function gọi trong useEffect không cleanup khi unmount |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B47 | sequelize.sync() trong production | `src/config/database.js` | 26 | Auto-sync có thể mất data khi model thay đổi — nên dùng migrations |
| B48 | Manual schema migration | `src/config/database.js` | 29-68 | Kiểm tra + thêm column qua `describeTable`/`addColumn` tại startup — fragile, không idempotent |
| B49 | Content Security Policy bị tắt | `src/index.js` | 33 | `helmet({ contentSecurityPolicy: false })` tắt CSP — mất layer bảo vệ XSS |
| B50 | N+1 query pattern | `src/controller/adminController.js` | 186-194 | 5 `Appointment.count()` riêng biệt — nên dùng `GROUP BY status` |
| B51 | Thiếu DB indexes | Nhiều model | - | `histories.user_id`, `appointments.user_id`, `appointments.doctor_id`, `appointments.status` không có index |
| B52 | Inconsistent error response | Nhiều controller | - | Có file `{ message, data, count }`, có file `{ ok, message }`, có file `{ message, success }` |
| B53 | Rate limiter MemoryStore | `src/index.js` | 47-62 | MemoryStore không hoạt động khi scale nhiều instances — cần Redis |
| B54 | createHospital nhận field không có trong model | `src/controller/adminController.js` | 306 | `req.body.email` truyền vào Hospital.create nhưng model không có `email` column |
| B55 | Không có OTP cleanup | `src/controller/authController.js` | - | OTP hết hạn không bị xóa — tích luỹ vô hạn trong DB |
| B56 | Weak password policy | `src/controller/authController.js` | 54 | Chỉ check `length < 6` — không yêu cầu uppercase, digit, special char |
| B57 | UpdateMedicineStock chấp nhận quantity âm | `src/controller/adminController.js` | 396-411 | Không validate quantity là non-negative integer |
| B58 | Prescription không validate schema | `src/controller/appointmentController.js` | 461 | `JSON.parse(prescription)` parse user-provided JSON — item.name/item.qty không validate type/range |
| B59 | Appointment auto-set confirmed | `src/controller/appointmentController.js` | 231 | Hardcode `status: 'confirmed'` thay vì `pending` — bypass admin review |
| B60 | Unused import Symptom | `src/controller/diseasesController.js` | 3 | `const Symptom = require('../model/symptoms')` import nhưng không dùng |
| B61 | Wrong log prefix | `src/controller/diseasesController.js` | 52 | `console.error('[News] Lỗi:', err)` trong disease handler — nên là `[Disease]` |

---

## FRONTEND - Đợt 2

### CRITICAL

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F16 | XSS qua innerHTML | `src/main.tsx` | 12,24,46 | Error messages inject trực tiếp qua `innerHTML` — chứa HTML/script tags sẽ execute |
| F17 | JWT lưu localStorage | `src/context/AuthContext.tsx:95`, `src/api/client.ts:29` | - | Token trong localStorage — XSS có thể đánh cắp. Dual source of truth giữa AuthContext và client.ts |

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F18 | Duplicate fetch bypass client.ts | `src/api/admin.ts:8-46`, `src/api/user.ts:7-44` | - | `updateDisease`, `deleteDisease`, `updateUserProfile` tự viết fetch — bypass retry, auto-logout 401, error normalization |
| F19 | External URL không validate | `src/pages/Home.tsx` | 312 | `article.url` render trong `<a href>` — javascript: protocol attack |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F20 | noUnusedLocals/Parameters bị tắt | `tsconfig.json` | 19-20 | Dead code không bị phát hiện |
| F21 | Không có test infrastructure | `package.json` | - | Không vitest/jest/@testing-library — 0% test coverage |
| F22 | Hardcoded Vietnamese strings | Mọi page | - | Không có i18n — không thể internationalize |
| F23 | Base64 images trong source | `src/data/hospitals.ts` | - | Base64 images inline → bundle size rất lớn |
| F24 | console.log sensitive data | `src/pages/Login.tsx` | 52 | `console.log("[LOGIN] Full response data:", JSON.stringify(data))` — log token vào browser console |
| F25 | putRequest dùng PATCH | `src/api/client.ts` | 151 | `putRequest` dùng `method: 'PATCH'` — tên function gợi ý PUT |
| F26 | Silent {} return khi parse fail | `src/api/client.ts` | 71-72,135-136 | JSON parse fail trả về `{}` — downstream code coi là success |

---

## TỔNG SỐ

| Mức độ | Backend | Frontend | Tổng |
|--------|---------|----------|------|
| CRITICAL (đợt 1) | 5 | 2 | **7** |
| HIGH (đợt 1) | 5 | 5 | **10** |
| MEDIUM (đợt 1) | 16 | 8 | **24** |
| CRITICAL (đợt 2) | 4 | 2 | **6** |
| HIGH (đợt 2) | 16 | 2 | **18** |
| MEDIUM (đợt 2) | 15 | 7 | **22** |
| **Tổng** | **61** | **26** | **87** |

### Đã fix (đợt 1): B1-B26, F1-F15
### Đã fix (đợt 2): B27-B61, F16-F26
### Đã fix (đợt 3): F17*-F23

---

# Đợt 4: Vấn đề bổ sung (sau khi review lần cuối)

> Cập nhật: 2026-07-11

---

## BACKEND - Đợt 4

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B62 | Thiếu validate First_name/Last_name | `routes/auth.js` | 13 | Route signup chỉ validate `email`, `password`, `Username` — thiếu `First_name`, `Last_name` |
| B63 | Disease.create thiếu precaution_1-4 | `controller/adminController.js` | 38-41 | Tạo bệnh mới không ghi precaution_1-4 vào DB → DiseaseDetail 500 lỗi |
| B64 | Dedup ICD kết quả sai kiểu | `controller/symptomsController.js` | 191 | `Set` chứa number (từ local `id`) vs string (từ ICD `icdCode`) — loại bỏ sai bệnh |
| B65 | `created_at` ≠ Sequelize field | `controller/diseasesController.js` | 301 | Dùng `created_at` thay vì `createdAt` — Sequelize ignore field không tồn tại |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| B66 | Xóa bệnh/controller thừa | `controller/adminController.js` | 88-132 | `updateDisease`/`deleteDisease` tồn tại nhưng route đã xóa (đợt cleanup "nhập bệnh thủ công") |

## FRONTEND - Đợt 4

### HIGH

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F27 | verifyOtp case mismatch | `api/auth.ts` | 33 | Frontend gửi `/api/auth/verifyotp` nhưng backend route là `/api/auth/verifyOtp` → 404 |
| F28 | Sai tên BS in đơn thuốc | `pages/DoctorDashboard.tsx` | 661 | Hardcode `BS. Chuyên khoa/Đại diện` thay vì tên thật của bác sĩ |
| F29 | Tailwind class không tồn tại | Nhiều file | - | `slate-850`, `slate-855`, `sky-455`, `amber-455` không có trong palette → CSS never generated |

### MEDIUM

| # | Vấn đề | File | Dòng | Mô tả |
|---|--------|------|------|-------|
| F30 | Dead route /send-email | `pages/Contact.tsx` | 104 | `navigate("/send-email")` nhưng không có route → 404 |
| F31 | Dead component SymptomsFE | `components/SymptomsFE.tsx` | Toàn file | Component không import ở đâu |
| F32 | Dead function getDiseaseDetail | `api/symptoms.ts` | 9-12 | Function không import ở đâu (chỉ SymptomsFE dùng — cũng dead) |
| F33 | Dead page SendEmail | `pages/SendEmail.tsx` | Toàn file | Không có route, Contact navigates to dead route |
| F34 | Dead CRUD functions | `api/admin.ts` | 3-5,7-9,19-21 | `createDisease`, `updateDisease`, `deleteDisease` — route backend đã xóa |
| F35 | Dead sidebar link | `components/Layout/Layout.tsx` | 74 | Link `/add-disease` cho admin — route đã xóa |
| F36 | Dead AddDisease page | `pages/AddDisease.tsx` | Toàn file | Component admin thêm bệnh thủ công — feature đã xóa |
| F37 | Dead breadcrumb | `components/ui/Breadcrumbs.tsx` | 11 | `add-disease` entry trong routeMap |

### Deleted Features (Đợt 4)

| Feature | Files deleted | Files modified |
|---------|--------------|----------------|
| Tự động xin nghỉ phép (send leave email) | `api/mail.ts`, `controller/mailController.js`, `routes/sendMail.js` | `index.js` (remove route), `Predict.tsx` (remove dead code) |
| Nhập bệnh thủ công (manual disease CRUD) | `pages/AddDisease.tsx` | `routes/admin.js` (remove POST/PUT/DELETE), `controller/adminController.js` (remove create/update/delete), `api/admin.ts` (remove CRUD functions), `Layout.tsx` (remove sidebar), `Breadcrumbs.tsx` (remove breadcrumb), `App.tsx` (remove route) |

---

## TỔNG SỐ

| Mức độ | Backend | Frontend | Tổng |
|--------|---------|----------|------|
| CRITICAL (đợt 1) | 5 | 2 | **7** |
| HIGH (đợt 1) | 5 | 5 | **10** |
| MEDIUM (đợt 1) | 16 | 8 | **24** |
| CRITICAL (đợt 2) | 4 | 2 | **6** |
| HIGH (đợt 2) | 16 | 2 | **18** |
| MEDIUM (đợt 2) | 15 | 7 | **22** |
| HIGH (đợt 4) | 4 | 3 | **7** |
| MEDIUM (đợt 4) | 1 | 8 | **9** |
| **Tổng** | **66** | **37** | **103** |
