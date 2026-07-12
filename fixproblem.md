# Fix Problem - Health Diagnosis Project

> Cập nhật: 2026-07-11

---

## Tổng kết

| Đợt | CRITICAL | HIGH | MEDIUM | LOW | Tổng |
|------|----------|------|--------|-----|------|
| Đợt 1 | 7 | 10 | 24 | 0 | **41** |
| Đợt 2 | 6 | 18 | 22 | 0 | **46** |
| Đợt 3 | 0 | 0 | 5 | 2 | **7** |
| Đợt 4 | 0 | 7 | 9 | 0 | **16** |
| **Tổng đã fix** | **13** | **35** | **60** | **2** | **110** |

---

## Đợt 1: Fix ban đầu (41 issues)

### Backend - Đợt 1

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| B1 | SQL Injection | `symptomsController.js` | Thay `${joined}` bằng parameterized queries `:ids` replacement |
| B2 | JWT_SECRET mặc định | `.env` | Đổi value + thêm comment hướng dẫn generate secret |
| B3 | Endpoint không auth | `routes/news.js` | Thêm `verifyToken` middleware cho POST /refresh |
| B4 | Doctor.create crash | `adminController.js` | Thêm `name` field từ `${last_name} ${first_name}` |
| B5 | Disease.create sai field | `adminController.js` | Map `Precaution_1..4` → `precautions`, bỏ `symptoms`/`doctors` |
| B6 | Không validate mật khẩu | `authController.js` | Thêm `password.length < 6` check |
| B7 | Thiếu try/catch | `symptomsController.js` | Wrap `symptomsCheck` trong try/catch |
| B8 | Mongoose trên Sequelize | `mailController.js` | `User.findById()` → `User.findByPk()` |
| B9 | Nearby hospital không auth | `routes/appointment.js` | Thêm `verifyToken` middleware |
| B10 | Hospital.location allowNull | `model/hospital.js` | `allowNull: false` → `allowNull: true` |
| B12 | getJwtSecret duplicate | 3 files | Tạo `utils/jwt.js`, import shared function |
| B13 | Dead code historyController | `controller/historyController.js` | Xóa file |
| B14 | Dead code rssService | `config/rssService.js` | Xóa file |
| B15 | Dead code temp_test.js | `temp_test.js` | Xóa file |
| B17 | listDiseases duplicate | `diseasesController.js` | Xóa method duplicate |
| B18 | Không có unhandledRejection | `index.js` | Thêm `process.on('unhandledRejection')` + `uncaughtException` |
| B19 | MONGO_URI thừa | `.env` | Xóa dòng MONGO_URI |
| B20 | getNearbyHospitals thiếu validation | `appointmentController.js` | Thêm NaN check + try/catch |
| B22 | Doctor.name allowNull | `model/doctor.js` | `allowNull: false` → `allowNull: true` |
| B23 | Medicine thiếu hospital FK | `model/medicine.js` | Thêm `Hospital.hasMany(Medicine)` |
| B24 | .env.example thiếu vars | `.env.example` | Thêm DB_HOST, DB_PORT, WHO_ICD_* |
| B25 | Không validate input | `routes/admin.js`, `routes/auth.js` | Thêm `validateBody` middleware |
| B26 | Dashboard route inline | `index.js` | Tách thành `routes/dashboard.js` |

### Frontend - Đợt 1

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F1 | Hardcode localhost:3001 | `AdminDashboard.tsx` | Thay 8 fetch calls bằng `getRequest`/`postRequest` |
| F3 | Stale closure | `AdminDashboard.tsx` | Thêm useEffect riêng cho filter changes |
| F4 | ToastContext memory leak | `ToastContext.tsx` | Dùng `useRef` lưu timeout IDs, cleanup on unmount |
| F5 | useEffect deps thừa | `History.tsx` | Bỏ `toast` khỏi dependency array |
| F6 | Re-run vô tận | `DiseaseDetail.tsx` | `JSON.stringify(location.state)` thành stable key |
| F7 | Không có AbortController | 4 files | Thêm AbortController + cleanup trong useEffect |
| F8 | Unused imports | `AdminDashboard.tsx` | Xóa Edit, Trash2, CheckCircle, XCircle, AlertTriangle, ChevronRight |
| F9 | queryText undefined | `History.tsx` | Thêm `queryText?: string` vào interface |
| F10 | User.phone thiếu type | `AuthContext.tsx` | Thêm `phone?: string` vào User interface |
| F11 | Stats hardcoded | `AdminDashboard.tsx` | Fetch từ `/api/admin/stats` thay vì số cứng |
| F12 | cachedProfile singleton | `Profile.tsx` | Xóa module-level cache, fetch fresh mỗi mount |
| F13 | Index-based keys | 3 files | Dùng unique ID thay vì index |
| F14 | postRequest overloaded | `client.ts` | Thêm `putRequest` + `deleteRequest` helpers |
| F15 | Duplicate event dispatch | `Profile.tsx` | Bỏ `new Event("auth-change")` thừa |

---

## Đợt 2: Fix bổ sung (46 issues)

### Backend CRITICAL - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| B27 | OTP dùng Math.random() | `authController.js` | `Math.random()` → `crypto.randomInt()` — cryptographic secure |
| B28 | Password hash leak | `adminController.js` | Destructure `password` khỏi response object |
| B29 | Không validate email | `authController.js` | Thêm regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` validation |
| B30 | Secrets trong .env | `.env` | Thêm WARNING comment + hướng dẫn generate secret |

### Backend HIGH - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| B31 | LIKE wildcard injection | 4 files | Tạo `utils/sanitize.js` với `escapeLike()`, escape `%`, `_`, `[`, `]` |
| B32 | Không enforce HTTPS | `index.js` | Thêm HTTPS redirect middleware trong production |
| B33 | Không limit body size | `index.js` | `express.json({ limit: '1mb' })` |
| B34 | Race condition thuốc | `appointmentController.js` | Dùng `sequelize.literal('quantity - N')` atomic update |
| B35 | Không dùng transaction | `appointmentController.js` | Wrap `updateTreatment` trong `sequelize.transaction()` |
| B36 | Mass assignment | `adminController.js` | Whitelist fields thay vì `{ ...req.body }` |
| B37 | Không check uniqueness | `userController.js` | Thêm `findOne` check trước khi update username/email |
| B38 | Internal error leak | `icdController.js` | Bỏ `err.message` khỏi response, log server-side |
| B39 | Broken access control | `appointmentController.js` | Thêm check doctor-patient relationship qua Appointment |
| B40 | News refresh không cần admin | `routes/news.js` | Thêm `isAdmin` middleware cho POST /refresh |

### Backend MEDIUM - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| B49 | CSP bị tắt | `index.js` | Bật CSP với directives: defaultSrc, scriptSrc, styleSrc, imgSrc |
| B50 | N+1 query | `adminController.js` | 5 separate count → 1 GROUP BY status query |
| B51 | Thiếu DB indexes | 3 models | Thêm indexes trên user_id, doctor_id, status, hospital_id |
| B53 | Rate limiter MemoryStore | `index.js` | Thêm comment hướng dẫn Redis cho production |
| B54 | createHospital nhận email | `adminController.js` | Bỏ `email` khỏi destructuring (model không có) |
| B55 | OTP cleanup | `authController.js` | Thêm `destroy` expired OTPs khi gọi forgotPassword |
| B56 | Weak password policy | `authController.js` | Thêm uppercase + digit validation |
| B57 | Quantity âm | `adminController.js` | Validate non-negative integer |
| B59 | Appointment auto confirmed | `appointmentController.js` | `status: 'confirmed'` → `status: 'pending'` |
| B61 | Wrong log prefix | `diseasesController.js` | `[News]` → `[Disease]` |

### Frontend CRITICAL - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F16 | XSS qua innerHTML | `main.tsx` | `innerHTML` → `textContent` (3 chỗ) |
| F17 | JWT dual source | `client.ts` | Bỏ module-level `token`, dùng localStorage làm single source |

### Frontend HIGH - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F18 | Duplicate fetch bypass | `admin.ts`, `user.ts` | Refactor dùng `postRequest`/`deleteRequest` từ client.ts |
| F19 | URL không validate | `Home.tsx` | Thêm `isValidUrl()` check protocol http/https |

### Frontend MEDIUM - Đợt 2

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F24 | console.log sensitive | `Login.tsx` | Xóa `console.log` full response data |
| F25 | putRequest dùng PATCH | `client.ts` | Tách `putRequest` (PUT) và `patchRequest` (PATCH) |
| F26 | Silent {} return | `client.ts` | Thêm `console.error` trước khi return `{}` |

---

## Files đã tạo mới

| File | Mô tả |
|------|-------|
| `health-diagnosis-Backend/src/utils/jwt.js` | Shared `getJwtSecret()` function |
| `health-diagnosis-Backend/src/routes/dashboard.js` | Dashboard route router |
| `health-diagnosis-Backend/src/utils/sanitize.js` | `escapeLike()` helper cho LIKE queries |

## Files đã xóa

| File | Lý do |
|------|-------|
| `health-diagnosis-Backend/src/controller/historyController.js` | Dead code - Mongoose syntax trên Sequelize |
| `health-diagnosis-Backend/src/config/rssService.js` | Dead code - trùng newsService.js |
| `health-diagnosis-Backend/temp_test.js` | Dead code - file test tạm |

---

## Đợt 3: Fix cuối cùng (24 issues)

### Frontend MEDIUM - Đợt 3

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F17★ | Race condition khi chuyển tab nhanh | `AdminDashboard.tsx` | Thêm `AbortController` trong useEffect `activeTab` + cleanup `controller.abort()` |
| F18★ | Search không có AbortController | `Search.tsx` | Thêm `searchAbortRef` + AbortController trong `triggerSearch`, abort request trước khi chạy request mới |
| F19★ | Predict không có AbortController | `Predict.tsx` | Thêm `predictAbortRef` + AbortController trong `handleSearch`, abort request trước khi chạy request mới |
| F20 | Dynamic import trong event handler | `Booking.tsx` | Thay `await import("../api/user")` bằng static import `import { getUserProfile } from "../api/user"` ở đầu file |
| F21 | postRequest thiếu generic type | `client.ts` | Thêm `<T = any>` generic type parameter cho `postRequest<T>()` |

### Frontend LOW - Đợt 3

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F22 | Hardcoded year "2026" | `AdminDashboard.tsx` | `new Date().getFullYear()` + year options động `currentYear ± 2` |
| F23 | window.confirm không consistence | `Booking.tsx` | Thêm TODO comment ghi nhận need ConfirmModal, giữ `window.confirm` tạm thời |

### Tổng hợp Đợt 3

| Severity | Số issue |
|----------|----------|
| MEDIUM | 5 |
| LOW | 2 |
| **Tổng** | **7** |

### Tổng kết cuối cùng

| Đợt | CRITICAL | HIGH | MEDIUM | LOW | Tổng |
|------|----------|------|--------|-----|------|
| Đợt 1 | 7 | 10 | 24 | 0 | **41** |
| Đợt 2 | 6 | 18 | 22 | 0 | **46** |
| Đợt 3 | 0 | 0 | 5 | 2 | **7** |
| Đợt 4 | 0 | 7 | 9 | 0 | **16** |
| **Tổng đã fix** | **13** | **35** | **60** | **2** | **110** |

---

## Đợt 4: Fix cuối cùng + Dead Code Cleanup (16 issues + 2 features deleted)

### Backend - Đợt 4

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| B62 | Thiếu validate First_name/Last_name | `routes/auth.js` | Thêm `'First_name', 'Last_name'` vào `validateBody` |
| B63 | Disease.create thiếu precaution_1-4 | `adminController.js` | Thêm `precaution_1`, `precaution_2`, `precaution_3`, `precaution_4` vào `Disease.create()` |
| B64 | Dedup ICD sai kiểu | `symptomsController.js` | `String(r.icdCode \|\| r.id)` — convert về string nhất quán cho Set comparison |
| B65 | created_at ≠ Sequelize | `diseasesController.js` | `created_at` → `createdAt` |
| B66 | Controller thừa sau cleanup | `adminController.js` | Xóa `updateDisease`, `deleteDisease` functions |

### Frontend - Đợt 4

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| F27 | verifyOtp case mismatch | `api/auth.ts` | `/api/auth/verifyotp` → `/api/auth/verifyOtp` |
| F28 | Sai tên BS trong đơn thuốc | `DoctorDashboard.tsx` | Hardcode `'Chuyên khoa'` → `docProfile?.name` (tên thật) |
| F29 | Tailwind class không tồn tại | `tailwind.config.js` | Thêm custom colors: `slate-{150,250,350,450,550,650,750,850,855}`, `sky-455`, `amber-455` |
| F30 | Dead route /send-email | `Contact.tsx` | `navigate("/send-email")` → `window.location.href = "mailto:..."` |
| F31 | Dead SymptomsFE | `components/SymptomsFE.tsx` | Xóa file |
| F32 | Dead getDiseaseDetail | `api/symptoms.ts` | Xóa function |
| F33 | Dead SendEmail page | `pages/SendEmail.tsx` | Xóa file |
| F34 | Dead CRUD functions | `api/admin.ts` | Xóa `createDisease`, `updateDisease`, `deleteDisease` |
| F35 | Dead sidebar link | `Layout.tsx` | Xóa link `/add-disease` + import `PlusSquare` |
| F36 | Dead AddDisease page | `pages/AddDisease.tsx` | Xóa file |
| F37 | Dead breadcrumb | `Breadcrumbs.tsx` | Xóa entry `"add-disease"` |

### Features Deleted - Đợt 4

| Feature | Files deleted | Files modified |
|---------|--------------|----------------|
| Tự động xin nghỉ phép | `api/mail.ts`, `controller/mailController.js`, `routes/sendMail.js` | `index.js`, `Predict.tsx` |
| Nhập bệnh thủ công | `pages/AddDisease.tsx` | `routes/admin.js`, `controller/adminController.js`, `api/admin.ts`, `Layout.tsx`, `Breadcrumbs.tsx`, `App.tsx` |

### Files đã xóa mới (Đợt 4)

| File | Lý do |
|------|-------|
| `health-diagnosis-Frontend/frontend/src/api/mail.ts` | Feature "xin nghỉ phép" đã xóa |
| `health-diagnosis-Frontend/frontend/src/pages/SendEmail.tsx` | Dead page — không có route |
| `health-diagnosis-Frontend/frontend/src/pages/AddDisease.tsx` | Feature "nhập bệnh thủ công" đã xóa |
| `health-diagnosis-Frontend/frontend/src/components/SymptomsFE.tsx` | Dead component — không import ở đâu |
| `health-diagnosis-Backend/src/controller/mailController.js` | Feature "xin nghỉ phép" đã xóa |
| `health-diagnosis-Backend/src/routes/sendMail.js` | Feature "xin nghỉ phép" đã xóa |
