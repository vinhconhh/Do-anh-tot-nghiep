# QLGym - Hệ Thống Quản Lý Phòng Gym Thông Minh

QLGym là một ứng dụng quản lý phòng gym hiện đại, cung cấp các tính năng quản lý toàn diện cho các phòng tập thể dục, bao gồm quản lý thành viên, huấn luyện viên, lịch tập, đặt phòng, và tích hợp AI để tư vấn bài tập.

## 📋 Mục Lục

- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [API Endpoints](#api-endpoints)
- [Thành Phần Chính](#thành-phần-chính)
- [Hướng Dẫn Phát Triển](#hướng-dẫn-phát-triển)
- [License](#license)

## ✨ Tính Năng Chính

### Quản Lý Thành Viên
- Đăng ký và quản lý hồ sơ thành viên
- Theo dõi thông tin cá nhân, ghi chú và mục tiêu tập luyện
- Quản lý gói hội viên và thời hạn

### Quản Lý Huấn Luyện Viên
- Quản lý danh sách huấn luyện viên
- Cấu hình lịch làm việc và khả năng dạy
- Quản lý yêu cầu tư vấn cá nhân (PT Request)

### Lịch Tập & Đặt Phòng
- Tạo và quản lý lịch tập nhóm
- Hệ thống đặt phòng/lớp học trực tuyến
- Xem xét sự xung đột thời gian
- Theo dõi sự tham dự

### Bài Tập & Luyện Tập
- Thư viện bài tập với hình ảnh và mô tả
- Tạo chương trình tập luyện tùy chỉnh
- Hỗ trợ nhiều loại bài tập (cardio, sức mạnh, uốn dẻo)

### Dashboard & Thống Kê
- Dashboard tổng quan với thống kê quan trọng
- Biểu đồ theo dõi sinh lý (chiều cao, cân nặng, BMI)
- Biểu đồ giới tính, độ tuổi, tình trạng thành viên

### Streak (Chuỗi Liên Tiếp)
- Theo dõi chuỗi ngày tập liên tiếp của thành viên
- Khuyến khích tính nhất quán trong tập luyện

### Hỗ Trợ AI
- Tư vấn bài tập dựa trên AI (OpenAI Integration)
- Gợi ý chương trình tập luyện cá nhân hóa
- Hỗ trợ trả lời các câu hỏi về tập luyện

### Thông Báo
- Hệ thống thông báo cho thành viên và huấn luyện viên
- Nhắc nhở về lịch tập sắp tới
- Cập nhật về lớp học được đặt

### Tài Chính
- Quản lý doanh thu
- Theo dõi thanh toán thành viên
- Báo cáo tài chính

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQL Server
- **ORM:** SQLAlchemy
- **Authentication:** JWT (Python-Jose)
- **Password Hashing:** Bcrypt
- **API Documentation:** Swagger UI / OpenAPI
- **AI Integration:** OpenAI API

### Frontend
- **Framework:** React 19.1.1
- **Build Tool:** Vite
- **Routing:** React Router 7.9.1
- **Charting:** Recharts 2.15.0
- **Icons:** Lucide React 0.544.0
- **Styling:** SCSS
- **UI Framework:** Bootstrap 4

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **API Client:** Axios (via custom API client)

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

### 2. Kiểm Tra Docker và Docker Compose
```bash
docker --version
docker-compose --version
```

Nếu chưa cài đặt, vui lòng tải từ: https://www.docker.com/products/docker-desktop

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

# OpenAI API (optional, cho tính năng AI)
OPENAI_API_KEY=your-openai-api-key

# Docker ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
DATABASE_PORT=1433
```

**Ghi chú:** 
- Thay `YourPassword123` bằng password mạnh cho SQL Server
- `sqlserver` là hostname của container SQL Server
- Các container có thể communicate với nhau qua docker network

## ▶️ Chạy Ứng Dụng

### Khởi Động Tất Cả Services với Docker Compose

```bash
# Khởi động toàn bộ ứng dụng (backend, frontend, database)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng ứng dụng
docker-compose down

# Dừng và xóa tất cả (volumes, networks, containers)
docker-compose down -v
```

### Truy Cập Ứng Dụng

Sau khi containers khởi động (chờ khoảng 30-60 giây để database sẵn sàng):

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation (Swagger):** http://localhost:8000/docs
- **Database:** localhost:1433 (SQL Server)

### Kiểm Tra Trạng Thái Containers

```bash
# Xem tất cả containers đang chạy
docker-compose ps

# Xem logs của một service cụ thể
docker-compose logs backend
docker-compose logs frontend
docker-compose logs sqlserver
```

### Các Lệnh Hữu Ích

```bash
# Build lại images (sau khi thay đổi code)
docker-compose build

# Khởi động lại services
docker-compose restart

# Chạy command bên trong container
docker-compose exec backend bash
docker-compose exec frontend sh

# Xem resource usage
docker stats

# Clean up - xóa unused images, containers, volumes
docker system prune -a
```

### Troubleshooting

**Nếu containers không khởi động:**
```bash
# Kiểm tra logs
docker-compose logs

# Xóa và tạo lại
docker-compose down -v
docker-compose up -d
```

**Nếu frontend không kết nối được backend:**
- Đảm bảo backend đã sẵn sàng: `http://localhost:8000/docs`
- Kiểm tra CORS settings trong `.env`
- Thử restart containers: `docker-compose restart`

**Nếu database bị lỗi:**
- Kiểm tra logs: `docker-compose logs sqlserver`
- Đảm bảo port 1433 không bị dùng bởi ứng dụng khác
- Xóa volume cũ: `docker-compose down -v && docker-compose up -d`

## 📁 Cấu Trúc Dự Án

```
quan_ly_gym/
├── backend/
│   ├── src/app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Configuration settings
│   │   ├── database.py             # Database connection
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── user.py             # User model
│   │   │   ├── member.py           # Member model
│   │   │   ├── trainer.py          # Trainer model
│   │   │   ├── booking.py          # Booking model
│   │   │   ├── schedule.py         # Schedule model
│   │   │   ├── exercise.py         # Exercise model
│   │   │   ├── workout.py          # Workout model
│   │   │   ├── pt_request.py       # Personal Training request
│   │   │   ├── streak.py           # Streak tracking
│   │   │   ├── notification.py     # Notifications
│   │   │   ├── finance.py          # Finance records
│   │   │   ├── ai.py               # AI chat records
│   │   │   └── log.py              # Activity logs
│   │   ├── schemas/                # Pydantic models (DTOs)
│   │   │   ├── auth.py             # Auth schemas
│   │   │   ├── user.py             # User schemas
│   │   │   ├── member.py           # Member schemas
│   │   │   ├── trainer.py          # Trainer schemas
│   │   │   ├── common.py           # Shared schemas
│   │   │   └── dashboard.py        # Dashboard schemas
│   │   ├── routes/                 # API endpoints
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── members.py          # Member management
│   │   │   ├── trainers.py         # Trainer management
│   │   │   ├── dashboard.py        # Dashboard data
│   │   │   ├── schedules.py        # Schedule management
│   │   │   ├── bookings.py         # Booking management
│   │   │   ├── users.py            # User management
│   │   │   ├── exercises.py        # Exercise library
│   │   │   ├── notifications.py    # Notification system
│   │   │   ├── pt_requests.py      # PT requests
│   │   │   ├── streaks.py          # Streak tracking
│   │   │   └── ai.py               # AI endpoints
│   │   ├── middleware/
│   │   │   └── auth.py             # Authentication middleware
│   │   └── utils/
│   │       └── security.py         # Security utilities
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Main app component
│   │   ├── api/                    # API client modules
│   │   │   ├── client.js           # Axios client configuration
│   │   │   ├── authApi.js          # Auth API calls
│   │   │   ├── membersApi.js       # Members API calls
│   │   │   ├── trainersApi.js      # Trainers API calls
│   │   │   ├── dashboardApi.js     # Dashboard API calls
│   │   │   ├── schedulesApi.js     # Schedules API calls
│   │   │   ├── bookingsApi.js      # Bookings API calls
│   │   │   ├── exercisesApi.js     # Exercises API calls
│   │   │   ├── ptRequestsApi.js    # PT requests API calls
│   │   │   ├── streaksApi.js       # Streaks API calls
│   │   │   ├── aiApi.js            # AI API calls
│   │   │   └── notificationsApi.js # Notifications API calls
│   │   ├── components/             # Reusable React components
│   │   ├── page/                   # Page components
│   │   ├── context/                # React Context for state management
│   │   ├── Layouts/                # Layout components
│   │   └── styles/                 # SCSS stylesheets
│   ├── public/                     # Static assets
│   ├── index.html                  # HTML entry point
│   ├── package.json                # npm dependencies
│   └── vite.config.js              # Vite configuration
│
├── database/                       # Database scripts and migrations
├── docker-compose.yml              # Docker Compose configuration
├── LICENSE                         # Project license
└── README.md                       # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh` - Làm mới token
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại

### Members (Thành Viên)
- `GET /api/members` - Danh sách thành viên
- `POST /api/members` - Tạo thành viên mới
- `GET /api/members/{id}` - Lấy chi tiết thành viên
- `PUT /api/members/{id}` - Cập nhật thành viên
- `DELETE /api/members/{id}` - Xóa thành viên

### Trainers (Huấn Luyện Viên)
- `GET /api/trainers` - Danh sách huấn luyện viên
- `POST /api/trainers` - Tạo huấn luyện viên mới
- `GET /api/trainers/{id}` - Lấy chi tiết huấn luyện viên
- `PUT /api/trainers/{id}` - Cập nhật huấn luyện viên

### Schedules (Lịch Tập)
- `GET /api/schedules` - Danh sách lịch tập
- `POST /api/schedules` - Tạo lịch tập mới
- `PUT /api/schedules/{id}` - Cập nhật lịch tập
- `DELETE /api/schedules/{id}` - Xóa lịch tập

### Bookings (Đặt Phòng)
- `GET /api/bookings` - Danh sách đặt phòng
- `POST /api/bookings` - Tạo đặt phòng mới
- `PUT /api/bookings/{id}` - Cập nhật đặt phòng
- `DELETE /api/bookings/{id}` - Hủy đặt phòng

### Exercises (Bài Tập)
- `GET /api/exercises` - Danh sách bài tập
- `POST /api/exercises` - Tạo bài tập mới
- `GET /api/exercises/{id}` - Lấy chi tiết bài tập

### Dashboard
- `GET /api/dashboard` - Dữ liệu dashboard

### AI (Tư Vấn)
- `POST /api/ai/chat` - Gửi câu hỏi tới AI
- `GET /api/ai/chat-history` - Lịch sử chat

### Streaks (Chuỗi Liên Tiếp)
- `GET /api/streaks/{member_id}` - Lấy streak của thành viên
- `POST /api/streaks/update` - Cập nhật streak

Xem đầy đủ API documentation tại: `http://localhost:8000/docs`

## 🔍 Docker Architecture

### Cấu Trúc Services

```
QLGym Docker Compose:

┌─────────────────────────────────────────────────────┐
│         Docker Network (qlgym-network)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │  Frontend        │  │  Backend API     │         │
│  │  (Port 3000)     │  │  (Port 8000)     │         │
│  │  React + Vite    │  │  FastAPI         │         │
│  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                   │
│           │                     │                   │
│           └──────────┬──────────┘                   │
│                      │                              │
│              ┌───────▼─────────┐                    │
│              │  SQL Server     │                    │
│              │  (Port 1433)    │                    │
│              └─────────────────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Services:

1. **frontend** - React application (port 3000)
2. **backend** - FastAPI server (port 8000)
3. **sqlserver** - SQL Server database (port 1433)

### Volumes:

- `sqlserver_data` - Lưu trữ dữ liệu database
- `./backend` - Mount backend code (development)
- `./frontend` - Mount frontend code (development)

### Environment Files:

- `.env` - Biến môi trường chung
- `backend/.env` - (nếu có) cho backend cụ thể
- `frontend/.env` - (nếu có) cho frontend cụ thể

## 🏗️ Thành Phần Chính

### Backend Architecture

**Models:** Định nghĩa cấu trúc dữ liệu với SQLAlchemy ORM
- User: Tài khoản người dùng
- Member: Hồ sơ thành viên phòng gym
- Trainer: Hồ sơ huấn luyện viên
- Schedule: Lịch lớp học/tập nhóm
- Booking: Đặt lớp học/phòng
- Exercise: Thư viện bài tập
- Workout: Chương trình tập luyện
- PT Request: Yêu cầu huấn luyện cá nhân
- Streak: Theo dõi chuỗi ngày tập
- Notification: Hệ thống thông báo
- Finance: Quản lý doanh thu
- AI: Lịch sử chat AI

**Schemas:** Pydantic models cho validation và documentation

**Routes:** API endpoints được tổ chức theo chủ đề:
- Authentication
- Member management
- Trainer management
- Schedule management
- Booking system
- Exercise library
- Notifications
- Dashboard
- AI chat
- Financial tracking

**Middleware:** 
- CORS middleware cho cross-origin requests
- Authentication middleware cho protected routes

**Security:**
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)

### Frontend Architecture

**Components:** Các component React tái sử dụng cho UI elements

**Pages:** Full-page components cho mỗi tính năng

**API Client:** Centralized Axios instance với interceptors

**Context:** Global state management (authentication, user data)

**Layouts:** Master layouts cho consistent UI

**Styles:** SCSS modules cho component styling

## 💻 Hướng Dẫn Phát Triển

### Phát Triển Với Docker

**Thay Đổi Code:**
- Chỉ cần chỉnh sửa code trực tiếp trong thư mục `backend/` hoặc `frontend/`
- Containers sẽ auto-reload (nếu cấu hình hot-reload trong Dockerfile)

**Rebuild Container Sau Khi Thay Đổi Dependencies:**

```bash
# Cập nhật requirements.txt hoặc package.json, rồi:
docker-compose build --no-cache backend
# hoặc
docker-compose build --no-cache frontend

# Khởi động lại
docker-compose up -d
```

**Chạy Migration/Database Scripts:**
```bash
# Chạy Python script bên trong backend container
docker-compose exec backend python -m alembic upgrade head

# Chạy SQL commands
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourPassword123
```

**Debugging:**
```bash
# Xem logs real-time
docker-compose logs -f backend

# SSH vào container
docker-compose exec backend bash

# Kiểm tra environment variables
docker-compose exec backend env
```

### Thêm Endpoint Mới (Backend)

1. **Sửa code** trong `backend/src/app/models/`, `schemas/`, hoặc `routes/`
2. **Rebuild container** (nếu thêm dependencies):
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```
3. **Test endpoint** tại http://localhost:8000/docs

### Thêm Component React Mới (Frontend)

1. **Sửa code** trong `frontend/src/components/` hoặc `frontend/src/page/`
2. **Container sẽ auto-reload** nếu hot-reload được enable
3. **Refresh browser** để thấy thay đổi

## 📝 Công Dân Tham Gia

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch cho feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được cấp phép dưới MIT License - xem file `LICENSE` để chi tiết.

## 🤝 Hỗ Trợ

Nếu bạn gặp vấn đề:

1. Kiểm tra xem vấn đề đã được báo cáo hay chưa
2. Tạo issue với mô tả chi tiết
3. Bao gồm:
   - Version của Python/Node.js
   - Hệ điều hành
   - Full error message
   - Các bước để reproduce

## 🚀 Triển Khai

### Production Deployment

**Build Images Cho Production:**
```bash
# Build tất cả images
docker-compose build

# Hoặc build riêng lẻ
docker build -t qlgym-backend:latest ./backend
docker build -t qlgym-frontend:latest ./frontend
```

**Push Lên Docker Registry (Optional):**
```bash
docker tag qlgym-backend:latest your-registry/qlgym-backend:latest
docker tag qlgym-frontend:latest your-registry/qlgym-frontend:latest

docker push your-registry/qlgym-backend:latest
docker push your-registry/qlgym-frontend:latest
```

**Deploy trên Server:**
```bash
# SSH vào server
ssh user@your-server.com

# Clone repo
git clone <repository-url>
cd quan_ly_gym

# Tạo .env với production values
nano .env

# Khởi động containers
docker-compose up -d

# Kiểm tra status
docker-compose ps
docker-compose logs -f
```

**Sử Dụng External Database:**

Nếu bạn có SQL Server riêng (không dùng container), sửa `.env`:
```env
DATABASE_URL=mssql+pyodbc://username:password@your-sql-server-ip:1433/database_name?driver=ODBC+Driver+17+for+SQL+Server
```

Sau đó chỉ cần khởi động backend và frontend containers:
```bash
docker-compose up -d backend frontend
```

**Cấu Hình Reverse Proxy (Nginx):**

Ví dụ nginx.conf:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

