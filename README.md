# Healthcare Predict - AI-Powered Symptom Diagnosis & Medical System

[![Production Status](https://img.shields.io/badge/status-active-brightgreen.svg)](https://health-diagnosis-0nx2.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/Swagger-OpenAPI%203.0.4-orange.svg)](https://health-diagnosis-0nx2.onrender.com/api-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent, full-stack healthcare web application providing AI-driven symptom analysis, disease prediction, WHO ICD-10 medical code integration, and seamless doctor appointment booking.

- **Live Frontend**: [https://health-diagnosis-final.vercel.app](https://health-diagnosis-final.vercel.app)
- **Live Backend API**: [https://health-diagnosis-0nx2.onrender.com](https://health-diagnosis-0nx2.onrender.com)
- **Interactive Swagger API Docs**: [https://health-diagnosis-0nx2.onrender.com/api-docs](https://health-diagnosis-0nx2.onrender.com/api-docs)

---

## 🚀 System Architecture & Infrastructure

The application follows a decoupled client-server architecture deployed on production-grade cloud services:

```
                  +--------------------------+
                  |  Vite + React Frontend   |
                  |     (Vercel - SPA)       |
                  +------------+-------------+
                               |
                               | HTTPS / REST API
                               v
                  +--------------------------+
                  |   Node.js + Express API  |
                  |   (Render - Singapore)   |
                  +----+-------+--------+----+
                       |       |        |
        +--------------+       |        +-----------------+
        |                      |                          |
        v                      v                          v
+---------------+    +-------------------+    +-----------------------+
|  TiDB Cloud   |    | Redis (Cloud/Local|    | Google Gemini 2.0 AI  |
|  (Serverless) |    |  Rate Limiting)   |    | & WHO ICD-10 API      |
+---------------+    +-------------------+    +-----------------------+
```

### Infrastructure & DevOps Highlights
- **Backend Deployment**: Hosted on **Render (Region Singapore)** for minimal latency in Southeast Asia with automatic HTTP health check monitoring.
- **Frontend Deployment**: Deployed on **Vercel** with client-side SPA route rewrites (`vercel.json`) ensuring 0-downtime static updates and smooth navigation without 404 errors on refresh.
- **Cloud Database Migration**: Migrated from local MySQL to **TiDB Cloud Serverless** with **SSL/TLS encrypted connection pooling** via Sequelize ORM.
- **Rate Limiting & Protection**: Distributed rate limiting backed by **Redis Store** (`20 req / 15 min` for auth endpoints, `1000 req / 15 min` for general API).
- **Security Engineering**: **Helmet CSP** (6 security directives), dynamic **CORS** origin whitelisting, JWT authentication, and **Gmail OAuth2** automated OTP delivery.
- **API Documentation**: **100% API coverage** (55 endpoints across 10 modules) fully documented using **Swagger OpenAPI 3.0.4**.

---

## ✨ Key Features

1. **AI-Powered Symptom Diagnosis**:
   - Integration with **Google Gemini 2.0 Flash API** for real-time symptom analysis and preliminary disease predictions.
   - Cross-referencing predictions with the **WHO ICD-10 API** for standardized global disease coding.

2. **Doctor Appointment Booking System**:
   - Patient-Doctor match making based on specialization.
   - Real-time appointment scheduling, status tracking, and doctor medical notes updates.

3. **Hospital & Medicine Directory**:
   - Nearby hospital location lookup powered by Overpass/OpenStreetMap API.
   - Comprehensive prescription medicine catalogue and usage guidelines.

4. **Security & Authentication**:
   - Secure registration/login with JWT (JSON Web Tokens).
   - Automated 6-digit OTP verification via **Gmail API (OAuth2 Client)** for password resets.
   - Multi-role access control (Patient, Doctor, Admin).

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Sequelize ORM, Swagger UI |
| **Database** | TiDB Cloud Serverless (MySQL Compatible), Redis |
| **External APIs** | Google Gemini 2.0 Flash AI, WHO ICD-10 API, Overpass API, Gmail OAuth2 |
| **Infrastructure** | Vercel, Render, Docker / Docker Compose |

---

## 📁 Project Structure

```
health-diagnosis/
├── health-diagnosis-Backend/     # Express.js REST API
│   ├── src/
│   │   ├── config/               # Database & Redis configuration
│   │   ├── controller/           # Business logic handlers
│   │   ├── model/                # Sequelize ORM models (11 tables)
│   │   ├── routes/               # API route definitions (55 endpoints)
│   │   ├── services/             # AI, ICD-10, & OTP integration services
│   │   ├── healthcare-swagger.yaml # OpenAPI 3.0.4 specification
│   │   └── index.js              # Express app entry point
│   └── Dockerfile
├── health-diagnosis-Frontend/    # React + Vite Frontend
│   └── frontend/
│       ├── src/
│       │   ├── components/       # Reusable UI components
│       │   ├── pages/            # Application views (Predict, Booking, History, etc.)
│       │   └── services/         # API integration client
│       └── vercel.json           # Vercel SPA rewrite rules
├── docker-compose.yml            # Local multi-container development environment
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18.x or higher)
- npm or yarn
- MySQL or Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/Datkewww123/health-diagnosis.git
cd health-diagnosis
```

### 2. Configure Environment Variables

Create `.env` in `health-diagnosis-Backend/`:
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=health_diagnosis_db
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:5173
```

### 3. Run with Docker Compose (Recommended)
```bash
docker-compose up --build -d
```
The app will be available at:
- **Frontend**: `http://localhost`
- **Backend API**: `http://localhost:3001`
- **Swagger Docs**: `http://localhost:3001/api-docs`

### 4. Run Manually

**Backend:**
```bash
cd health-diagnosis-Backend
npm install
npm run dev
```

**Frontend:**
```bash
cd health-diagnosis-Frontend/frontend
npm install
npm run dev
```

---

## 📑 API Endpoints Summary

100% of the 55 API endpoints are documented in Swagger. Main route groups include:

- `POST /api/auth/signup` & `POST /api/auth/login` - User registration & authentication
- `POST /api/symptoms/check` - AI symptom diagnosis via Gemini 2.0
- `GET /api/icd/search` - WHO ICD-10 medical code lookup
- `POST /api/appointment/book` - Doctor appointment scheduling
- `GET /api/admin/stats` - Admin system metrics and statistics

Visit `/api-docs` on the backend server for full interactive request/response testing.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
