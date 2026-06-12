# 🏋️‍♂️ QLGym - Hệ Thống Quản Lý Phòng Gym Thông Minh (The Pro Gym)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Microsoft SQL Server](https://img.shields.io/badge/Database-SQL%20Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)

**QLGym (The Pro Gym)** là một giải pháp chuyển đổi số toàn diện cho phòng tập thể hình hiện đại. Ứng dụng tích hợp công nghệ AI tư vấn cá nhân hóa cùng kiến trúc phân quyền chặt chẽ (RBAC) giúp tối ưu hóa công tác quản lý vận hành, nâng cao trải nghiệm tập luyện cho hội viên và tối đa hóa hiệu suất làm việc của huấn luyện viên.

---

## 🌟 Tính Năng Cốt Lõi & Phân Quyền Chi Tiết

Hệ thống được thiết kế theo mô hình **Role-Based Access Control (RBAC)** với sự phân định trách nhiệm rõ ràng, đặc biệt là sự tách biệt hoàn toàn giữa vai trò Quản lý và Quản trị viên:

### 1. 👑 Admin (Quản trị viên hệ thống)
*Tập trung hoàn toàn vào cấu hình hạ tầng và bảo mật hệ thống.*
- **Quản lý tài khoản:** Cấp phát, khóa và quản lý thông tin toàn bộ nhân viên hệ thống (Manager, PT).
- **Cấu hình hệ thống:** Quản lý tham số kết nối, API keys, và bảo mật hệ thống.
- **Giám sát nhật ký (Logs):** Xem lịch sử truy cập và hoạt động hệ thống.

### 2. 👔 Manager (Quản lý vận hành)
*Chịu trách nhiệm toàn bộ các nghiệp vụ kinh doanh và vận hành hàng ngày.*
- **Quản lý Hội viên:** Duyệt đăng ký, quản lý gói tập, theo dõi thời hạn thẻ.
- **Quản lý PT:** Phân bổ hội viên cho PT, duyệt lịch dạy, theo dõi đánh giá hiệu suất.
- **Quản lý Cơ sở vật chất:** Quản lý danh mục thiết bị, lịch bảo trì và trạng thái phòng tập.
- **Quản lý Lớp học (Group Classes):** Tạo lịch lớp học nhóm, phân công huấn luyện viên đứng lớp, quản lý số lượng học viên tối đa.
- **Báo cáo Tài chính:** Dashboard thống kê doanh thu theo thời gian thực, số lượng hội viên mới, tỷ lệ gia hạn gói.

### 3. 👟 Personal Trainer (Huấn luyện viên cá nhân - PT)
*Đồng hành chuyên môn và hỗ trợ sát sao cho từng học viên.*
- **Quản lý học viên cá nhân:** Tiếp nhận danh sách học viên được phân công, theo dõi hồ sơ sức khỏe và mục tiêu.
- **Thiết lập lộ trình:** Phân công bài tập (Assigned Exercises) và tạo kế hoạch thực đơn (Meal Plans) cá nhân hóa cho từng học viên.
- **Quản lý lịch hẹn:** Duyệt/từ chối và quản lý lịch đặt lịch tập cá nhân (Booking) từ học viên.
- **Theo dõi tiến độ:** Xem biểu đồ cân nặng, BMI và lịch sử nhật ký tập luyện của học viên để điều chỉnh giáo án kịp thời.

### 4. 🧘‍♂️ Member (Hội viên)
*Chủ động theo sát lộ trình tập luyện cá nhân với sự trợ giúp của AI.*
- **Hồ sơ sức khỏe:** Tự cập nhật chỉ số cơ thể (Chiều cao, Cân nặng, % Mỡ, Cơ bắp) và theo dõi tiến trình qua biểu đồ đường trực quan.
- **Ghi chép tập luyện:** Ghi nhận nhật ký buổi tập thực tế (Workout Logs) gồm: số hiệp (Sets), số lần lặp (Reps), mức tạ (Weight) và chỉ số RPE (chỉ số đánh giá độ gắng sức).
- **Động lực tập luyện:** Hệ thống tính toán và duy trì chuỗi ngày tập liên tiếp (`Streak`) hiển thị ngọn lửa động lực.
- **Tương tác PT:** Đặt lịch tập cá nhân với PT được phân công, gửi đánh giá (Rating) sau buổi tập.
- **Trợ lý AI:** Chat trực tuyến với Trợ lý AI (tích hợp OpenRouter) để nhận thực đơn mẫu, hướng dẫn kỹ thuật bài tập lập tức.

---

## 🛠️ Công Nghệ Phát Triển

### Backend (API Server)
- **FastAPI (Python):** Engine xử lý logic tốc độ cao, hỗ trợ asynchrony tốt.
- **SQLAlchemy:** ORM mạnh mẽ giúp ánh xạ dữ liệu và tương tác an toàn với DB.
- **SQL Server & pyodbc:** Hệ quản trị cơ sở dữ liệu doanh nghiệp an toàn, tối ưu lưu trữ.
- **JWT (JSON Web Token) & Bcrypt:** Bảo mật xác thực thông tin đăng nhập và phân quyền.
- **OpenRouter / OpenAI API:** Trí tuệ nhân tạo tư vấn dinh dưỡng và huấn luyện tự động.

### Frontend (Single Page Application)
- **React 19 (Vite):** Tối ưu hóa tốc độ tải trang và xây dựng giao diện component linh hoạt.
- **Recharts:** Thư viện vẽ biểu đồ tương tác cao để trực quan hóa chỉ số sức khỏe của hội viên.
- **Tailwind CSS & SCSS Modules:** Xây dựng phong cách thiết kế **Glassmorphism** cao cấp, các hiệu ứng chuyển động mượt mà (Micro-animations).
- **Lucide React:** Bộ thư viện icon hiện đại, tối giản và đồng bộ.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
quan_ly_gym/
├── backend/
│   ├── src/app/
│   │   ├── main.py                 # Điểm khởi chạy FastAPI ứng dụng
│   │   ├── models/                 # Các thực thể SQLAlchemy (User, MemberProfile, Booking, ...)
│   │   ├── schemas/                # Khai báo cấu trúc đầu vào/ra với Pydantic
│   │   ├── routes/                 # Module định tuyến API (Auth, Dashboard, PT, Member, ...)
│   │   └── middleware/             # Xử lý xác thực JWT (Auth Middleware)
│   ├── requirements.txt            # Danh sách thư viện Python phụ thuộc
│   └── wait-for-db.sh              # Script chờ đợi SQL Server khởi động hoàn tất
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Cấu hình Axios Services tương tác API backend
│   │   ├── components/             # Các UI Components tái sử dụng (Modal, Schedule, ...)
│   │   ├── page/                   # Các màn hình chức năng (Dashboard, PtRequests, Members, ...)
│   │   ├── Layouts/                # Bố cục giao diện chung (Sidebar, Header, Footer)
│   │   ├── context/                # Quản lý State toàn cục (AuthContext)
│   │   └── styles/                 # Thiết lập CSS/SCSS và cấu hình theme màu Tailwind
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Cấu hình proxy và cấu trúc build Vite
│
├── database/                       # Các file cấu trúc hoặc Script khởi tạo DB ban đầu
└── docker-compose.yml              # Cấu hình container hóa toàn bộ hệ thống
```

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh (Sử dụng Docker)

Đây là phương thức cài đặt được khuyến nghị để đồng bộ môi trường nhanh chóng.

### 1. Chuẩn bị
Hãy đảm bảo bạn đã cài đặt **Docker** và **Docker Compose** trên thiết bị của mình.

### 2. Tải mã nguồn và thiết lập môi trường
```bash
git clone <repository-url>
cd quan_ly_gym
```

Tạo file `.env` tại thư mục gốc dự án dựa trên cấu trúc sau:
```env
# Kết nối Cơ sở dữ liệu SQL Server (trong Docker container)
DATABASE_URL=mssql+pyodbc://sa:YourPassword123@sqlserver:1433/qlgym?driver=ODBC+Driver+17+for+SQL+Server

# JWT Security
SECRET_KEY=kethuquanlygymsieuthongminh_secretkey_123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120

# OpenAI / OpenRouter API Key dùng cho trợ lý AI
OPENAI_API_KEY=your_openrouter_or_openai_api_key_here

# Docker Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
DATABASE_PORT=1433
```

### 3. Khởi chạy hệ thống
Chạy lệnh duy nhất để khởi động toàn bộ hạ tầng (Database, Backend, Frontend):
```bash
# Xây dựng và khởi chạy các container dưới dạng chạy ngầm
docker-compose up -d --build

# Theo dõi tiến độ khởi động hoặc log hệ thống
docker-compose logs -f
```

Hệ thống sẽ tự động chờ SQL Server khởi chạy, tiến hành tạo lập bảng dữ liệu ban đầu, và mở các cổng truy cập.

### 4. Địa chỉ truy cập
- **Giao diện người dùng (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Tài liệu API tương tác (Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Cơ sở dữ liệu (SQL Server port):** `localhost:1433`

---

## 💻 Hướng Dẫn Phát Triển Cho Lập Trình Viên (Local Development)

Nếu bạn muốn tùy chỉnh mã nguồn trực tiếp mà không qua Docker:

### Khởi động Backend độc lập
1. Di chuyển vào thư mục backend và tạo môi trường ảo Python:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Trên Windows dùng: venv\Scripts\activate
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
3. Chạy server phát triển (Hỗ trợ hot-reload):
   ```bash
   uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Khởi động Frontend độc lập
1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói phụ thuộc NodeJS:
   ```bash
   npm install
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```

---

## 📄 Bản Quyền & Giấy Phép
Dự án được cấp giấy phép hoạt động dưới **MIT License**.
