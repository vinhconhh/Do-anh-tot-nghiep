# QLGym - Hệ Thống Quản Lý Phòng Gym Thông Minh (The Pro Gym)

QLGym (The Pro Gym) là một ứng dụng quản lý phòng gym hiện đại, cung cấp các tính năng quản lý toàn diện cho các phòng tập thể dục, bao gồm quản lý thành viên, huấn luyện viên, lịch tập, đặt phòng, kế hoạch dinh dưỡng, ghi nhận nhật ký tập luyện và tích hợp AI để tư vấn bài tập.

### Quản Lý Thành Viên & Chỉ Số Cơ Thể
- Đăng ký và quản lý hồ sơ thành viên.
- Theo dõi thông tin cá nhân, ghi chú và mục tiêu tập luyện.
- Ghi nhận nhật ký tập luyện (Workout Logs) và theo dõi chỉ số cơ thể (Body Metrics).
- Quản lý gói hội viên và thời hạn.

### Quản Lý Huấn Luyện Viên (PT)
- Quản lý danh sách huấn luyện viên.
- Cấu hình lịch làm việc và khả năng dạy.
- Quản lý yêu cầu tư vấn cá nhân (PT Request) và kết nối PT với học viên.
- Theo dõi hiệu suất PT (PT Performance, Sessions, Member loads).

### Lịch Tập & Đặt Phòng
- Tạo và quản lý lịch tập nhóm.
- Hệ thống đặt phòng/lớp học trực tuyến.
- Xem xét sự xung đột thời gian và theo dõi sự tham dự.

### Bài Tập & Kế Hoạch Dinh Dưỡng (Meal Plans)
- Thư viện bài tập đa dạng.
- Tạo chương trình tập luyện tùy chỉnh (Cardio, Sức mạnh, Uốn dẻo, ...).
- **Kế hoạch dinh dưỡng (Meal Plans):** Lên thực đơn chi tiết cho từng buổi ăn, hỗ trợ cá nhân hóa để phù hợp với mục tiêu thể hình.

### Dashboard & UI Hiện Đại
- Dashboard tổng quan với các thống kê quan trọng (Doanh thu, số lượng thành viên, PT).
- Giao diện người dùng cao cấp (Premium UI/UX) sử dụng Glassmorphism, Emerald/Teal gradients, bo góc mềm mại và shadow.
- Biểu đồ thống kê sinh lý (Chiều cao, Cân nặng, BMI) sử dụng Recharts.

### Streak (Chuỗi Liên Tiếp)
- Theo dõi chuỗi ngày tập liên tiếp của thành viên nhằm khuyến khích tính nhất quán trong tập luyện.

### Hỗ Trợ AI & Tư Vấn
- Tư vấn bài tập và dinh dưỡng dựa trên AI (OpenRouter / OpenAI Integration).
- Gợi ý chương trình tập luyện cá nhân hóa.
- Hỗ trợ trả lời các câu hỏi về tập luyện với định dạng plain-text chuẩn tiếng Việt UTF-8.

### Thông Báo & Tài Chính
- Hệ thống thông báo nhắc nhở lịch tập sắp tới và cập nhật lớp học.
- Quản lý doanh thu, theo dõi thanh toán và báo cáo tài chính.

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQL Server (pyodbc)
- **ORM:** SQLAlchemy
- **Authentication:** JWT (Python-Jose)
- **Password Hashing:** Bcrypt
- **API Documentation:** Swagger UI / OpenAPI
- **AI Integration:** OpenAI API / OpenRouter API

### Frontend
- **Framework:** React 19.1.1
- **Build Tool:** Vite
- **Routing:** React Router 7.9.1
- **Charting:** Recharts 2.15.0
- **Icons:** Lucide React 0.544.0
- **Styling Framework:** Tailwind CSS 3.4 & SCSS Modules
- **API Client:** Axios

### Infrastructure
- **Containerization:** Docker & Docker Compose

## 📦 Yêu Cầu Hệ Thống

- **Docker** (phiên bản 20.10+)
- **Docker Compose** (phiên bản 1.29+)
- Dung lượng ổ cứng: ~2GB cho images
- RAM: Tối thiểu 4GB (khuyến nghị 8GB)

## 🚀 Cài Đặt

### 1. Clone Repository
```bash
git clone <repository-url>
cd quan_ly_gym
```

### 2. Kiểm Tra Docker
```bash
docker --version
docker-compose --version
```

## ⚙️ Cấu Hình

Tạo file `.env` trong thư mục gốc dự án (hoặc sửa file `.env` có sẵn):

```env
# Database - SQL Server container
DATABASE_URL=mssql+pyodbc://sa:YourPassword123@sqlserver:1433/qlgym?driver=ODBC+Driver+17+for+SQL+Server

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# OpenAI / OpenRouter API
OPENAI_API_KEY=your-api-key

# Docker ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
DATABASE_PORT=1433
```

## ▶️ Chạy Ứng Dụng

### Khởi Động Tất Cả Services
```bash
# Khởi động toàn bộ ứng dụng (backend, frontend, database)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng ứng dụng
docker-compose down
```

### Truy Cập Ứng Dụng
- **Frontend:** http://localhost:3000
- **Backend API & Swagger Docs:** http://localhost:8000/docs
- **Database:** localhost:1433 (SQL Server)

## 📁 Cấu Trúc Dự Án

```
quan_ly_gym/
├── backend/
│   ├── src/app/
│   │   ├── main.py                 # FastAPI app
│   │   ├── models/                 # SQLAlchemy models (User, Member, MealPlan, Workout, ...)
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── routes/                 # API endpoints
│   │   └── utils/                  # Security & Utilities
│   ├── requirements.txt            # Python dependencies
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios API services
│   │   ├── components/             # React UI components (Tailwind + SCSS)
│   │   ├── page/                   # Application Pages
│   │   ├── Layouts/                # Master Layouts
│   │   ├── context/                # React Context providers
│   │   └── styles/                 # SCSS & Tailwind globals
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/                       # Database migrations
└── docker-compose.yml              # Docker Compose
```

## 🔌 API Endpoints
Xem đầy đủ API documentation tại: `http://localhost:8000/docs` sau khi khởi động backend.
Hệ thống bao gồm các modules: Auth, Members, Trainers, Schedules, Bookings, Exercises, Meal Plans, Dashboard, AI Chat, Streaks, v.v.

## 💻 Hướng Dẫn Phát Triển

### Backend (FastAPI)
- Cài đặt thư viện: `pip install -r backend/requirements.txt`
- Chạy server thủ công: `uvicorn src.app.main:app --reload`
- Chạy migrations: `alembic upgrade head`

### Frontend (React + Vite)
- Cài đặt dependencies: `npm install`
- Khởi động dev server: `npm run dev`

### Debug với Docker
- `docker-compose exec backend bash` (Truy cập terminal backend)
- `docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourPassword123` (Truy vấn SQL)

## 📄 License
Dự án được cấp phép dưới MIT License.
