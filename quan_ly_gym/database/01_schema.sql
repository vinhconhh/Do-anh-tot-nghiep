CREATE DATABASE QLGymDB;
GO
USE QLGymDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ======================
-- ROLES & RBAC
-- ======================
CREATE TABLE Roles (
    RoleID INT IDENTITY PRIMARY KEY,
    RoleCode NVARCHAR(50) UNIQUE,
    Department NVARCHAR(100)
);

CREATE TABLE Permissions (
    PermissionID INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(100) UNIQUE,
    Description NVARCHAR(255)
);

CREATE TABLE RolePermissions (
    RoleID INT,
    PermissionID INT,
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID)
);
GO

-- ======================
-- USERS
-- ======================
CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(255),
    Email NVARCHAR(255) UNIQUE,
    PasswordHash NVARCHAR(255),
    RoleID INT,
    IsActive BIT DEFAULT 1,
    IsDeleted BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE INDEX IX_Users_Email ON Users(Email);
GO

-- ======================
-- AUTH
-- ======================
CREATE TABLE RefreshTokens (
    TokenID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Token NVARCHAR(500),
    ExpiryDate DATETIME,
    IsRevoked BIT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE UserSessions (
    SessionID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Device NVARCHAR(255),
    IPAddress NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ======================
-- PROFILE
-- ======================
CREATE TABLE MemberProfiles (
    UserID INT PRIMARY KEY,
    Goal NVARCHAR(255),
    Height FLOAT,
    Weight FLOAT,
    AIQuota INT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE PTProfiles (
    UserID INT PRIMARY KEY,
    ExperienceYears INT,
    Certifications NVARCHAR(MAX),
    Specialty NVARCHAR(255),
    TotalScore INT DEFAULT 100,
    ResponseRate DECIMAL(5,2) DEFAULT 100.00,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ======================
-- MASTER DATA
-- ======================
CREATE TABLE MuscleGroups (
    MuscleGroupID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) UNIQUE
);

CREATE TABLE Equipments (
    EquipmentID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) UNIQUE
);

CREATE TABLE Exercises (
    ExerciseID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(255),
    MuscleGroupID INT,
    EquipmentID INT,
    IsDeleted BIT DEFAULT 0,
    FOREIGN KEY (MuscleGroupID) REFERENCES MuscleGroups(MuscleGroupID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipments(EquipmentID)
);
GO

-- ======================
-- WORKOUT
-- ======================
CREATE TABLE WorkoutRoutines (
    RoutineID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(255),
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

CREATE TABLE WorkoutRoutineDetails (
    DetailID INT IDENTITY PRIMARY KEY,
    RoutineID INT,
    ExerciseID INT,
    Sets INT,
    Reps INT,
    FOREIGN KEY (RoutineID) REFERENCES WorkoutRoutines(RoutineID),
    FOREIGN KEY (ExerciseID) REFERENCES Exercises(ExerciseID)
);

CREATE TABLE Schedules (
    ScheduleID INT IDENTITY PRIMARY KEY,
    UserID INT,
    RoutineID INT,
    WorkoutDate DATE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoutineID) REFERENCES WorkoutRoutines(RoutineID)
);

CREATE INDEX IX_Schedules_UserID_Date ON Schedules(UserID, WorkoutDate);
GO

-- ======================
-- BOOKING (PT)
-- ======================
CREATE TABLE Bookings (
    BookingID INT IDENTITY PRIMARY KEY,
    MemberID INT,
    PTID INT,
    StartTime DATETIME,
    EndTime DATETIME,
    Status NVARCHAR(50),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (PTID) REFERENCES Users(UserID)
);
GO

-- ======================
-- CHECK-IN (UPGRADED)
-- ======================
CREATE TABLE CheckIns (
    CheckInID INT IDENTITY PRIMARY KEY,
    UserID INT,
    ScheduleID INT NULL,
    BookingID INT NULL,
    CheckInTime DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ScheduleID) REFERENCES Schedules(ScheduleID),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),

    CONSTRAINT CK_CheckIns_OnlyOne
    CHECK (
        (ScheduleID IS NOT NULL AND BookingID IS NULL)
        OR
        (ScheduleID IS NULL AND BookingID IS NOT NULL)
    )
);
GO

CREATE UNIQUE INDEX UX_CheckIn_Schedule ON CheckIns(UserID, ScheduleID) WHERE ScheduleID IS NOT NULL;
CREATE UNIQUE INDEX UX_CheckIn_Booking ON CheckIns(UserID, BookingID) WHERE BookingID IS NOT NULL;
GO

-- ======================
-- WORKOUT LOGGING
-- ======================
CREATE TABLE LogWorkouts (
    LogID INT IDENTITY PRIMARY KEY,
    UserID INT,
    WorkoutDate DATETIME DEFAULT GETDATE(),
    CheckInTime DATETIME NULL,
    CheckOutTime DATETIME NULL,
    DurationMin INT NULL,
    RPE INT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE INDEX IX_LogWorkouts_UserID ON LogWorkouts(UserID);

CREATE TABLE LogWorkoutDetails (
    DetailID INT IDENTITY PRIMARY KEY,
    LogID INT,
    ExerciseID INT NULL,
    ExerciseName NVARCHAR(255) NULL,
    SetNumber INT,
    Reps INT,
    Weight FLOAT,
    Done INT DEFAULT 0,
    FOREIGN KEY (LogID) REFERENCES LogWorkouts(LogID),
    FOREIGN KEY (ExerciseID) REFERENCES Exercises(ExerciseID)
);
GO

-- ======================
-- BODY TRACKING
-- ======================
CREATE TABLE BodyMetrics (
    MetricID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Weight FLOAT,
    BodyFat FLOAT,
    Muscle FLOAT,
    Height FLOAT,
    BMI FLOAT,
    MeasuredAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE ProgressPhotos (
    PhotoID INT IDENTITY PRIMARY KEY,
    UserID INT,
    ImageURL NVARCHAR(500),
    UploadedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ======================
-- DIET
-- ======================
CREATE TABLE DietPlans (
    DietID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Name NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Meals (
    MealID INT IDENTITY PRIMARY KEY,
    DietID INT,
    MealType NVARCHAR(50),
    FOREIGN KEY (DietID) REFERENCES DietPlans(DietID)
);

CREATE TABLE MealItems (
    ItemID INT IDENTITY PRIMARY KEY,
    MealID INT,
    FoodName NVARCHAR(255),
    Calories INT,
    Protein FLOAT,
    Carbs FLOAT,
    Fat FLOAT,
    FOREIGN KEY (MealID) REFERENCES Meals(MealID)
);
GO

-- ======================
-- FINANCE
-- ======================
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY PRIMARY KEY,
    UserID INT,
    TotalAmount DECIMAL(10,2),
    Status NVARCHAR(50) DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Transactions (
    TransactionID INT IDENTITY PRIMARY KEY,
    UserID INT,
    InvoiceID INT,
    Amount DECIMAL(10,2) CHECK (Amount > 0),
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
);

CREATE INDEX IX_Transactions_UserID ON Transactions(UserID);
GO

-- ======================
-- AI
-- ======================
CREATE TABLE AIRequests (
    RequestID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Prompt NVARCHAR(MAX),
    Model NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE AIResponses (
    ResponseID INT IDENTITY PRIMARY KEY,
    RequestID INT,
    ResponseData NVARCHAR(MAX),
    TokensUsed INT,
    Cost DECIMAL(10,4),
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RequestID) REFERENCES AIRequests(RequestID)
);
GO

-- ======================
-- NOTIFICATIONS
-- ======================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Message NVARCHAR(MAX),
    Type NVARCHAR(50),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ======================
-- AUDIT LOG
-- ======================
CREATE TABLE AuditLogs (
    AuditID INT IDENTITY PRIMARY KEY,
    UserID INT,
    Action NVARCHAR(255),
    TableName NVARCHAR(100),
    RecordID INT,
    OldData NVARCHAR(MAX),
    NewData NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- ======================
-- ANALYTICS VIEWS
-- ======================
CREATE VIEW VIEW_Attendance_Schedule AS
SELECT 
    s.UserID,
    COUNT(c.CheckInID) AS Attended,
    COUNT(s.ScheduleID) AS Total,
    CAST(COUNT(c.CheckInID) * 1.0 / NULLIF(COUNT(s.ScheduleID), 0) AS DECIMAL(5,2)) AS AttendanceRate
FROM Schedules s
LEFT JOIN CheckIns c ON s.ScheduleID = c.ScheduleID
GROUP BY s.UserID;
GO

CREATE VIEW VIEW_Attendance_PT AS
SELECT 
    b.MemberID,
    COUNT(c.CheckInID) AS Attended,
    COUNT(b.BookingID) AS Total,
    CAST(COUNT(c.CheckInID) * 1.0 / NULLIF(COUNT(b.BookingID), 0) AS DECIMAL(5,2)) AS AttendanceRate
FROM Bookings b
LEFT JOIN CheckIns c ON b.BookingID = c.BookingID
GROUP BY b.MemberID;
GO

CREATE VIEW VIEW_RevenueReport AS
SELECT 
    u.FullName,
    SUM(t.Amount) AS TotalRevenue
FROM Transactions t
JOIN Users u ON t.UserID = u.UserID
WHERE t.Status = 'Paid'
GROUP BY u.FullName;
GO
USE QLGymDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================
-- MIGRATION: PT Requests + Scoring + Streaks
-- =============================================

-- =====================
-- BẢNG 1: Yêu cầu thuê PT
-- =====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PTRequests')
BEGIN
    CREATE TABLE PTRequests (
        RequestID INT IDENTITY PRIMARY KEY,
        MemberID INT NOT NULL,
        PTID INT NOT NULL,
        MemberGoal NVARCHAR(500),
        Note NVARCHAR(1000),
        Status NVARCHAR(50) DEFAULT 'Pending',
        ExpiresAt DATETIME NOT NULL,
        RespondedAt DATETIME NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MemberID) REFERENCES Users(UserID),
        FOREIGN KEY (PTID) REFERENCES Users(UserID)
    );
    PRINT '✅ Created PTRequests table';
END
ELSE PRINT '⏭️ PTRequests already exists';
GO

-- =====================
-- BẢNG 2: Log điểm PT
-- =====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PTScoreLog')
BEGIN
    CREATE TABLE PTScoreLog (
        LogID INT IDENTITY PRIMARY KEY,
        PTID INT NOT NULL,
        Points INT NOT NULL,
        Reason NVARCHAR(255),
        ReferenceID INT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (PTID) REFERENCES Users(UserID)
    );
    PRINT '✅ Created PTScoreLog table';
END
ELSE PRINT '⏭️ PTScoreLog already exists';
GO

-- Thêm cột vào PTProfiles
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTProfiles') AND name = 'TotalScore')
BEGIN
    ALTER TABLE PTProfiles ADD TotalScore INT DEFAULT 100;
    PRINT '✅ Added TotalScore to PTProfiles';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTProfiles') AND name = 'ResponseRate')
BEGIN
    ALTER TABLE PTProfiles ADD ResponseRate DECIMAL(5,2) DEFAULT 100.00;
    PRINT '✅ Added ResponseRate to PTProfiles';
END
GO

-- Set defaults for existing PTs
UPDATE PTProfiles SET TotalScore = 100 WHERE TotalScore IS NULL;
UPDATE PTProfiles SET ResponseRate = 100.00 WHERE ResponseRate IS NULL;
GO

-- =====================
-- BẢNG 3: Chuỗi check-in Member
-- =====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemberStreak')
BEGIN
    CREATE TABLE MemberStreak (
        StreakID INT IDENTITY PRIMARY KEY,
        UserID INT NOT NULL UNIQUE,
        CurrentStreak INT DEFAULT 0,
        LongestStreak INT DEFAULT 0,
        TotalPoints INT DEFAULT 0,
        LastCheckInDate DATE NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
    PRINT '✅ Created MemberStreak table';
END
ELSE PRINT '⏭️ MemberStreak already exists';
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CheckInLog')
BEGIN
    CREATE TABLE CheckInLog (
        LogID INT IDENTITY PRIMARY KEY,
        UserID INT NOT NULL,
        CheckInDate DATE NOT NULL,
        Points INT DEFAULT 0,
        StreakDay INT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
    CREATE UNIQUE INDEX UX_CheckInLog_UserDate ON CheckInLog(UserID, CheckInDate);
    PRINT '✅ Created CheckInLog table';
END
ELSE PRINT '⏭️ CheckInLog already exists';
GO

-- Seed MemberStreak for existing members
INSERT INTO MemberStreak (UserID, CurrentStreak, LongestStreak, TotalPoints)
SELECT u.UserID, 0, 0, 0
FROM Users u
INNER JOIN Roles r ON u.RoleID = r.RoleID
WHERE r.RoleCode = 'MEMBER' AND u.IsDeleted = 0
AND NOT EXISTS (SELECT 1 FROM MemberStreak ms WHERE ms.UserID = u.UserID);
GO

PRINT '=== MIGRATION COMPLETE ===';
GO
USE QLGymDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT '=== BẮT ĐẦU CẬP NHẬT CƠ SỞ DỮ LIỆU GÓI TẬP & KHUYẾN MÃI ===';

BEGIN TRY
    BEGIN TRAN;

    -- 1. Bảng Gói tập (MembershipPackages)
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MembershipPackages')
    BEGIN
        CREATE TABLE MembershipPackages (
            PackageID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL,
            Price DECIMAL(18,2) NOT NULL,
            DurationMonths INT NOT NULL, -- In months
            Description NVARCHAR(500),
            Benefits NVARCHAR(MAX), -- JSON array string
            IsVisible BIT DEFAULT 1,
            IsFeatured BIT DEFAULT 0,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT '> Da tao bang MembershipPackages.';
    END

    -- 2. Bảng Gói AI (AIPackages)
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AIPackages')
    BEGIN
        CREATE TABLE AIPackages (
            PackageID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL,
            Price DECIMAL(18,2) NOT NULL,
            Credits INT NOT NULL,
            Description NVARCHAR(500),
            IsVisible BIT DEFAULT 1,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT '> Da tao bang AIPackages.';
    END

    -- 3. Bảng Khuyến mãi (Promotions)
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Promotions')
    BEGIN
        CREATE TABLE Promotions (
            PromotionID INT IDENTITY(1,1) PRIMARY KEY,
            PromoCode VARCHAR(50) NOT NULL UNIQUE,
            DiscountType VARCHAR(20) NOT NULL, -- 'PERCENT' hoac 'AMOUNT'
            DiscountValue DECIMAL(18,2) NOT NULL,
            ExpiryDate DATETIME NULL,
            IsActive BIT DEFAULT 1,
            Description NVARCHAR(255),
            CreatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT '> Da tao bang Promotions.';
    END

    -- 4. Bổ sung trường ReferralCode vào Users nếu chưa có
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralCode')
    BEGIN
        ALTER TABLE Users ADD ReferralCode VARCHAR(20) NULL;
        PRINT '> Da them cot ReferralCode vao bang Users.';
    END

    -- Bổ sung trường ReferredBy (để biết ai giới thiệu) vào Users nếu chưa có
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferredBy')
    BEGIN
        ALTER TABLE Users ADD ReferredBy INT NULL FOREIGN KEY REFERENCES Users(UserID);
        PRINT '> Da them cot ReferredBy vao bang Users.';
    END

    -- Seed Data (Nếu bảng trống)
    IF NOT EXISTS (SELECT 1 FROM MembershipPackages)
    BEGIN
        INSERT INTO MembershipPackages (Name, Price, DurationMonths, Description, Benefits, IsVisible, IsFeatured)
        VALUES 
        (N'GÓI TIÊU CHUẨN', 299000, 1, N'Lựa chọn tiết kiệm nhất, dành cho hội viên có nhu cầu tập luyện cố định.', 
         N'["Tập không giới hạn 24/7", "Sử dụng toàn bộ thiết bị hiện đại", "Ứng dụng The Pro Gym"]', 1, 0),
        (N'GÓI CAO CẤP', 399000, 1, N'Tập luyện không giới hạn cùng AI, kèm theo nhiều đặc quyền bổ sung.', 
         N'["Kiểm tra sức khỏe & tư thế miễn phí", "Sử dụng toàn bộ thiết bị hiện đại", "Sử dụng AI không giới hạn", "Ứng dụng The Pro Gym đầy đủ tính năng"]', 1, 1);
        PRINT '> Da them du lieu mau cho MembershipPackages.';
    END

    IF NOT EXISTS (SELECT 1 FROM AIPackages)
    BEGIN
        INSERT INTO AIPackages (Name, Price, Credits, Description, IsVisible)
        VALUES
        (N'Gói Khởi Động', 50000, 50, N'Gói dùng thử để trải nghiệm AI.', 1),
        (N'Gói Tiêu Chuẩn', 100000, 150, N'Phù hợp cho nhu cầu hỏi đáp cơ bản hàng ngày.', 1),
        (N'Gói Vô Cực', 200000, 500, N'Dành cho hội viên muốn lên lịch tập cá nhân hóa sâu.', 1);
        PRINT '> Da them du lieu mau cho AIPackages.';
    END

    -- Tạo mã giới thiệu mặc định cho các User hiện tại (cập nhật nếu NULL)
    EXEC('UPDATE Users SET ReferralCode = LEFT(CAST(NEWID() AS VARCHAR(36)), 8) WHERE ReferralCode IS NULL;');
    
    COMMIT TRAN;
    PRINT '=== THANH CONG ===';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    THROW;
END CATCH
GO
-- ================================================================
-- 05_facility_modules.sql
-- Equipment, GymExercises (nâng cấp), GymClasses
-- ================================================================
USE QLGymDB;
GO

-- ─────────────────────────────────────────
-- 1. GymEquipments (Máy tập)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GymEquipments')
BEGIN
    CREATE TABLE GymEquipments (
        EquipmentID  INT          IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(200) NOT NULL,
        Category     NVARCHAR(100),          -- Cardio, Tạ máy, Tạ tự do, Kéo xà, ...
        Zone         NVARCHAR(100),          -- Khu A, Khu B, Studio ...
        Quantity     INT           DEFAULT 1 CHECK (Quantity >= 0),
        Status       NVARCHAR(50)  DEFAULT N'Hoạt động'
                         CHECK (Status IN (N'Hoạt động', N'Đang bảo trì', N'Hỏng')),
        CreatedAt    DATETIME      DEFAULT GETDATE(),
        UpdatedAt    DATETIME      DEFAULT GETDATE()
    );
    PRINT N'> Đã tạo bảng GymEquipments';
END
ELSE
    PRINT N'> Bảng GymEquipments đã tồn tại, bỏ qua.';
GO

-- ─────────────────────────────────────────
-- 2. GymExercises (Bài tập - đầy đủ)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GymExercises')
BEGIN
    CREATE TABLE GymExercises (
        ExerciseID    INT           IDENTITY(1,1) PRIMARY KEY,
        Name          NVARCHAR(255) NOT NULL,
        AssignmentName NVARCHAR(255),          -- Assignment Name (Vietnamese)
        Type          NVARCHAR(100),          -- Cardio, Free Weights, Machine, Bodyweight, ...
        TargetMuscle  NVARCHAR(200),          -- Ngực, Lưng, Chân, Vai, Tay, Bụng, ...
        MetValue      FLOAT         DEFAULT 0,
        EquipmentID   INT           REFERENCES GymEquipments(EquipmentID) ON DELETE SET NULL,
        IsDeleted     TINYINT       DEFAULT 0,
        CreatedAt     DATETIME      DEFAULT GETDATE(),
        UpdatedAt     DATETIME      DEFAULT GETDATE()
    );
    PRINT N'> Đã tạo bảng GymExercises';
END
ELSE
    PRINT N'> Bảng GymExercises đã tồn tại, bỏ qua.';
GO

-- ─────────────────────────────────────────
-- 3. GymClasses (Lớp học nhóm)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GymClasses')
BEGIN
    CREATE TABLE GymClasses (
        ClassID          INT           IDENTITY(1,1) PRIMARY KEY,
        Name             NVARCHAR(200) NOT NULL,          -- Yoga, Zumba, Pilates, ...
        InstructorName   NVARCHAR(200),
        StudioRoom       NVARCHAR(100),                   -- Studio 1, Studio 2, ...
        MaxCapacity      INT           DEFAULT 20 CHECK (MaxCapacity >= 1),
        CurrentEnrolled  INT           DEFAULT 0  CHECK (CurrentEnrolled >= 0),
        StartTime        DATETIME      NOT NULL,
        EndTime          DATETIME      NOT NULL,
        IsDeleted        TINYINT       DEFAULT 0,
        CreatedAt        DATETIME      DEFAULT GETDATE(),
        UpdatedAt        DATETIME      DEFAULT GETDATE(),

        CONSTRAINT CK_GymClasses_Times CHECK (EndTime > StartTime),
        CONSTRAINT CK_GymClasses_Enrolled CHECK (CurrentEnrolled <= MaxCapacity)
    );
    PRINT N'> Đã tạo bảng GymClasses';
END
ELSE
    PRINT N'> Bảng GymClasses đã tồn tại, bỏ qua.';
GO

-- ─────────────────────────────────────────
-- 4. Seed data mẫu
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM GymEquipments)
BEGIN
    INSERT INTO GymEquipments (Name, Category, Zone, Quantity, Status) VALUES
    (N'Xe đạp tập (Spin Bike)',   N'Cardio',    N'Khu Cardio',    10, N'Hoạt động'),
    (N'Máy chạy bộ (Treadmill)',  N'Cardio',    N'Khu Cardio',    12, N'Hoạt động'),
    (N'Máy rowing (Rowing Machine)', N'Cardio', N'Khu Cardio',     4, N'Hoạt động'),
    (N'Máy ép ngực (Chest Press)',N'Tạ máy',   N'Khu Tạ máy',     6, N'Hoạt động'),
    (N'Máy kéo cáp (Cable Machine)', N'Tạ máy',N'Khu Tạ máy',     4, N'Đang bảo trì'),
    (N'Tạ tay (Dumbbell set)',    N'Tạ tự do',  N'Khu Free Weight',1, N'Hoạt động'),
    (N'Xà đơn (Pull-up bar)',     N'Thể lực',   N'Khu Thể lực',   4, N'Hoạt động'),
    (N'Thảm tập yoga',            N'Yoga',      N'Studio 1',      30, N'Hoạt động');
    PRINT N'> Đã thêm dữ liệu mẫu GymEquipments';
END
GO

IF NOT EXISTS (SELECT 1 FROM GymExercises)
BEGIN
    INSERT INTO GymExercises (Name, AssignmentName, Type, TargetMuscle, MetValue) VALUES
    (N'Bench Press',    N'Đẩy ngực nằm',    N'Free Weights', N'Ngực',  5.0),
    (N'Squat',          N'Squat',            N'Free Weights', N'Đùi',   6.0),
    (N'Deadlift',       N'Kéo đất',          N'Free Weights', N'Lưng',  6.0),
    (N'Pull Up',        N'Kéo xà',           N'Bodyweight',   N'Lưng',  8.0),
    (N'Plank',          N'Plank',            N'Bodyweight',   N'Bụng',  3.5),
    (N'Treadmill Run',  N'Chạy bộ',          N'Cardio',       N'Toàn thân', 9.8),
    (N'Cycling',        N'Đạp xe',           N'Cardio',       N'Đùi',   7.5),
    (N'Shoulder Press', N'Đẩy vai',          N'Machine',      N'Vai',   5.0),
    (N'Leg Press',      N'Đẩy chân',         N'Machine',      N'Đùi',   5.5),
    (N'Bicep Curl',     N'Cuộn tay trước',   N'Free Weights', N'Tay',   4.0);
    PRINT N'> Đã thêm dữ liệu mẫu GymExercises';
END
GO

DECLARE @Tomorrow DATETIME = DATEADD(DAY, 1, CAST(GETDATE() AS DATE));
IF NOT EXISTS (SELECT 1 FROM GymClasses)
BEGIN
    INSERT INTO GymClasses (Name, InstructorName, StudioRoom, MaxCapacity, CurrentEnrolled, StartTime, EndTime) VALUES
    (N'Yoga Buổi Sáng',   N'Nguyễn Thị An',   N'Studio 1', 20,  8, CAST(GETDATE() AS DATE) + ' 07:00:00', CAST(GETDATE() AS DATE) + ' 08:00:00'),
    (N'Zumba Tổng Hợp',   N'Trần Văn Bình',   N'Studio 2', 30, 25, CAST(GETDATE() AS DATE) + ' 09:00:00', CAST(GETDATE() AS DATE) + ' 10:00:00'),
    (N'Pilates Cơ Bản',   N'Lê Thị Cẩm',      N'Studio 1', 15, 10, CAST(GETDATE() AS DATE) + ' 11:00:00', CAST(GETDATE() AS DATE) + ' 12:00:00'),
    (N'Yoga Buổi Tối',    N'Nguyễn Thị An',   N'Studio 1', 20,  5, CAST(GETDATE() AS DATE) + ' 19:00:00', CAST(GETDATE() AS DATE) + ' 20:00:00'),
    (N'Aerobics Ngày Mai',N'Phạm Văn Đức',    N'Studio 2', 25,  0, @Tomorrow + ' 08:00:00', @Tomorrow + ' 09:00:00');
    PRINT N'> Đã thêm dữ liệu mẫu GymClasses';
END
GO

-- ================================================================
-- MIGRATION: Phân bài tập HLV → Member
-- VideoURL, ExperienceLevel, BodyNote, AssignedExercises
-- InstructorID, ClassEnrollments
-- ================================================================
USE QLGymDB;
GO

PRINT '=== BẮT ĐẦU MIGRATION: Phân bài tập HLV → Member ===';

-- 1. Thêm VideoURL vào GymExercises
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GymExercises') AND name = 'VideoURL')
BEGIN
    ALTER TABLE GymExercises ADD VideoURL NVARCHAR(500) NULL;
    PRINT N'✅ Đã thêm cột VideoURL vào GymExercises';
END
ELSE PRINT N'⏭️ Cột VideoURL đã tồn tại';
GO

-- 2. Thêm ExperienceLevel và BodyNote vào PTRequests
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTRequests') AND name = 'ExperienceLevel')
BEGIN
    ALTER TABLE PTRequests ADD ExperienceLevel NVARCHAR(50) DEFAULT 'new';
    PRINT N'✅ Đã thêm cột ExperienceLevel vào PTRequests';
END
ELSE PRINT N'⏭️ Cột ExperienceLevel đã tồn tại';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTRequests') AND name = 'BodyNote')
BEGIN
    ALTER TABLE PTRequests ADD BodyNote NVARCHAR(1000) NULL;
    PRINT N'✅ Đã thêm cột BodyNote vào PTRequests';
END
ELSE PRINT N'⏭️ Cột BodyNote đã tồn tại';
GO

-- 3. Tạo bảng AssignedExercises (HLV phân bài tập cho Member)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AssignedExercises')
BEGIN
    CREATE TABLE AssignedExercises (
        AssignmentID  INT           IDENTITY(1,1) PRIMARY KEY,
        PTID          INT           NOT NULL,
        MemberID      INT           NOT NULL,
        ExerciseID    INT           NOT NULL,
        Sets          INT           DEFAULT 3,
        Reps          INT           DEFAULT 12,
        Duration      INT           NULL,            -- phút, cho cardio
        Weight        FLOAT         NULL,            -- kg
        Note          NVARCHAR(500) NULL,            -- ghi chú từ HLV
        AssignedDate  DATE          NOT NULL,
        Status        NVARCHAR(50)  DEFAULT 'Active', -- Active | Completed
        CreatedAt     DATETIME      DEFAULT GETDATE(),
        FOREIGN KEY (PTID)       REFERENCES Users(UserID),
        FOREIGN KEY (MemberID)   REFERENCES Users(UserID),
        FOREIGN KEY (ExerciseID) REFERENCES GymExercises(ExerciseID)
    );
    CREATE INDEX IX_AssignedEx_Member_Date ON AssignedExercises(MemberID, AssignedDate);
    CREATE INDEX IX_AssignedEx_PT ON AssignedExercises(PTID);
    PRINT N'✅ Đã tạo bảng AssignedExercises';
END
ELSE PRINT N'⏭️ Bảng AssignedExercises đã tồn tại';
GO

-- 4. Thêm InstructorID vào GymClasses (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'InstructorID')
BEGIN
    ALTER TABLE GymClasses ADD InstructorID INT NULL FOREIGN KEY REFERENCES Users(UserID);
    PRINT N'✅ Đã thêm cột InstructorID vào GymClasses';
END
ELSE PRINT N'⏭️ Cột InstructorID đã tồn tại';
GO

-- 5. Tạo bảng ClassEnrollments (đăng ký lớp học)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ClassEnrollments')
BEGIN
    CREATE TABLE ClassEnrollments (
        EnrollID   INT        IDENTITY(1,1) PRIMARY KEY,
        ClassID    INT        NOT NULL,
        MemberID   INT        NOT NULL,
        EnrolledAt DATETIME   DEFAULT GETDATE(),
        Status     NVARCHAR(50) DEFAULT 'Active',  -- Active | Cancelled
        FOREIGN KEY (ClassID)  REFERENCES GymClasses(ClassID),
        FOREIGN KEY (MemberID) REFERENCES Users(UserID),
        CONSTRAINT UQ_ClassEnroll UNIQUE (ClassID, MemberID)
    );
    PRINT N'✅ Đã tạo bảng ClassEnrollments';
END
ELSE PRINT N'⏭️ Bảng ClassEnrollments đã tồn tại';
GO

PRINT '=== MIGRATION HOÀN TẤT ===';
GO

-- ================================================================
-- MIGRATION: Check-in gated by exercise completion + PT progress
-- Thêm cột ExercisesCompleted, TotalSets, RPE, PTID vào CheckInLog
-- ================================================================
USE QLGymDB;
GO

PRINT '=== BẮT ĐẦU MIGRATION: Check-in Progress ===';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CheckInLog') AND name = 'ExercisesCompleted')
BEGIN
    ALTER TABLE CheckInLog ADD ExercisesCompleted INT DEFAULT 0;
    PRINT N'✅ Đã thêm cột ExercisesCompleted vào CheckInLog';
END
ELSE PRINT N'⏭️ Cột ExercisesCompleted đã tồn tại';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CheckInLog') AND name = 'TotalSets')
BEGIN
    ALTER TABLE CheckInLog ADD TotalSets INT DEFAULT 0;
    PRINT N'✅ Đã thêm cột TotalSets vào CheckInLog';
END
ELSE PRINT N'⏭️ Cột TotalSets đã tồn tại';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CheckInLog') AND name = 'RPE')
BEGIN
    ALTER TABLE CheckInLog ADD RPE INT NULL;
    PRINT N'✅ Đã thêm cột RPE vào CheckInLog';
END
ELSE PRINT N'⏭️ Cột RPE đã tồn tại';
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CheckInLog') AND name = 'PTID')
BEGIN
    ALTER TABLE CheckInLog ADD PTID INT NULL FOREIGN KEY REFERENCES Users(UserID);
    PRINT N'✅ Đã thêm cột PTID vào CheckInLog';
END
ELSE PRINT N'⏭️ Cột PTID đã tồn tại';
GO

-- Index for PT progress queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CheckInLog_PTID')
BEGIN
    CREATE INDEX IX_CheckInLog_PTID ON CheckInLog(PTID) WHERE PTID IS NOT NULL;
    PRINT N'✅ Đã tạo index IX_CheckInLog_PTID';
END
GO

PRINT '=== MIGRATION CHECK-IN PROGRESS HOÀN TẤT ===';
GO
