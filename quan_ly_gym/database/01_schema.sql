/*
================================================================
FILE: 01_schema.sql
MỤC ĐÍCH: Khởi tạo toàn bộ cấu trúc Database QLGymDB (Bản hợp nhất hoàn thiện)
================================================================
*/

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'QLGymDB')
BEGIN
    CREATE DATABASE QLGymDB;
END
GO
USE QLGymDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- 1. ROLES & PERMISSIONS
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

-- 2. USERS & AUTH
CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(255),
    Email NVARCHAR(255) UNIQUE,
    PasswordHash NVARCHAR(255),
    PhoneNumber NVARCHAR(20) NULL,
    Birthday DATE NULL,
    Age INT NULL,
    Gender NVARCHAR(20) NULL,
    RoleID INT,
    ReferralCode VARCHAR(20) NULL,
    ReferredBy INT NULL,
    ExpiryDate DATE NULL,
    IsActive BIT DEFAULT 1,
    IsDeleted BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (ReferredBy) REFERENCES Users(UserID)
);

CREATE INDEX IX_Users_Email ON Users(Email);

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

-- 3. PACKAGES & PROMOTIONS (Defined early for references)
CREATE TABLE MembershipPackages (
    PackageID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    DurationMonths INT NOT NULL,
    Description NVARCHAR(500),
    Benefits NVARCHAR(MAX),
    IsVisible BIT DEFAULT 1,
    IsFeatured BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE AIPackages (
    PackageID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Credits INT NOT NULL,
    Description NVARCHAR(500),
    IsVisible BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromoCode VARCHAR(50) NOT NULL UNIQUE,
    DiscountType VARCHAR(20) NOT NULL CHECK (DiscountType IN ('PERCENT', 'AMOUNT')),
    DiscountValue DECIMAL(18,2) NOT NULL,
    ExpiryDate DATETIME NULL,
    IsActive BIT DEFAULT 1,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. PROFILES
CREATE TABLE MemberProfiles (
    UserID INT PRIMARY KEY,
    Goal NVARCHAR(255),
    Height FLOAT,
    Weight FLOAT,
    AIQuota INT DEFAULT 0,
    PackageID INT NULL,
    AIPackageID INT NULL,
    CurrentStreak INT DEFAULT 0,
    LongestStreak INT DEFAULT 0,
    LastAttendanceDate DATE NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (PackageID) REFERENCES MembershipPackages(PackageID),
    FOREIGN KEY (AIPackageID) REFERENCES AIPackages(PackageID)
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

-- 5. FACILITY & EXERCISES
CREATE TABLE GymEquipments (
    EquipmentID  INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(200) NOT NULL,
    Category     NVARCHAR(100),
    Zone         NVARCHAR(100),
    Quantity     INT DEFAULT 1 CHECK (Quantity >= 0),
    Status       NVARCHAR(50) DEFAULT N'Hoạt động' CHECK (Status IN (N'Hoạt động', N'Đang bảo trì', N'Hỏng')),
    CreatedAt    DATETIME DEFAULT GETDATE(),
    UpdatedAt    DATETIME DEFAULT GETDATE()
);

CREATE TABLE GymExercises (
    ExerciseID    INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(255) NOT NULL,
    AssignmentName NVARCHAR(255),
    Type          NVARCHAR(100),
    TargetMuscle  NVARCHAR(200),
    MetValue      FLOAT DEFAULT 0,
    EquipmentID   INT REFERENCES GymEquipments(EquipmentID) ON DELETE SET NULL,
    VideoURL      NVARCHAR(500) NULL,
    IsDeleted     TINYINT DEFAULT 0,
    CreatedAt     DATETIME DEFAULT GETDATE(),
    UpdatedAt     DATETIME DEFAULT GETDATE()
);

CREATE TABLE GymClasses (
    ClassID          INT IDENTITY(1,1) PRIMARY KEY,
    Name             NVARCHAR(200) NOT NULL,
    InstructorName   NVARCHAR(200),
    InstructorID     INT NULL FOREIGN KEY REFERENCES Users(UserID),
    StudioRoom       NVARCHAR(100),
    MaxCapacity      INT DEFAULT 20 CHECK (MaxCapacity >= 1),
    CurrentEnrolled  INT DEFAULT 0 CHECK (CurrentEnrolled >= 0),
    StartTime        DATETIME NOT NULL,
    EndTime          DATETIME NOT NULL,
    Intensity        NVARCHAR(20) NULL DEFAULT 'medium',
    IsRecurring      BIT NULL DEFAULT 0,
    RecurringDays    NVARCHAR(50) NULL,
    RecurringStartDate DATE NULL,
    RecurringEndDate   DATE NULL,
    ParentClassID    INT NULL,
    AttendanceSubmitted INT DEFAULT 0,
    IsDeleted        TINYINT DEFAULT 0,
    CreatedAt        DATETIME DEFAULT GETDATE(),
    UpdatedAt        DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_GymClasses_Times CHECK (EndTime > StartTime),
    CONSTRAINT CK_GymClasses_Enrolled CHECK (CurrentEnrolled <= MaxCapacity)
);

-- 6. WORKOUTS & ASSIGNMENTS
CREATE TABLE AssignedExercises (
    AssignmentID  INT IDENTITY(1,1) PRIMARY KEY,
    PTID          INT NOT NULL,
    MemberID      INT NOT NULL,
    ExerciseID    INT NOT NULL,
    Sets          INT DEFAULT 3,
    Reps          INT DEFAULT 12,
    Duration      INT NULL,
    Weight        FLOAT NULL,
    Note          NVARCHAR(500) NULL,
    AssignedDate  DATE NOT NULL,
    Status        NVARCHAR(50) DEFAULT 'Active',
    CreatedAt     DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PTID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (ExerciseID) REFERENCES GymExercises(ExerciseID)
);

CREATE TABLE ClassEnrollments (
    EnrollID   INT IDENTITY(1,1) PRIMARY KEY,
    ClassID    INT NOT NULL,
    MemberID   INT NOT NULL,
    EnrolledAt DATETIME DEFAULT GETDATE(),
    Status     NVARCHAR(50) DEFAULT 'Active',
    AttendanceStatus VARCHAR(20) NULL,
    FOREIGN KEY (ClassID) REFERENCES GymClasses(ClassID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    CONSTRAINT UQ_ClassEnroll UNIQUE (ClassID, MemberID)
);

-- 7. BOOKINGS & PT REQUESTS
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

CREATE TABLE PTRequests (
    RequestID INT IDENTITY PRIMARY KEY,
    MemberID INT NOT NULL,
    PTID INT NOT NULL,
    MemberGoal NVARCHAR(500),
    ExperienceLevel NVARCHAR(50) DEFAULT 'new',
    BodyNote NVARCHAR(1000) NULL,
    Note NVARCHAR(1000),
    Status NVARCHAR(50) DEFAULT 'Pending',
    ExpiresAt DATETIME NOT NULL,
    RespondedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (PTID) REFERENCES Users(UserID)
);

-- 8. CHECK-INS & TRACKING
CREATE TABLE CheckIns (
    CheckInID INT IDENTITY PRIMARY KEY,
    UserID INT,
    ScheduleID INT NULL,
    BookingID INT NULL,
    CheckInTime DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT CK_CheckIns_Source CHECK (CheckInTime IS NOT NULL)
);


-- 9. BODY METRICS
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

-- 10. FINANCE & SUBSCRIPTIONS
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY PRIMARY KEY,
    UserID INT,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50) DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Transactions (
    TransactionID INT IDENTITY PRIMARY KEY,
    UserID INT,
    InvoiceID INT,
    Amount DECIMAL(18,2) CHECK (Amount >= 0),
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
);

CREATE TABLE UserSubscriptions (
    SubscriptionID INT IDENTITY PRIMARY KEY,
    UserID INT NOT NULL,
    PackageType NVARCHAR(50) NOT NULL, -- 'GYM' or 'AI'
    PackageID INT NOT NULL,
    StartDate DATETIME DEFAULT GETDATE(),
    EndDate DATETIME NULL,
    Status NVARCHAR(50) DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 11. AI & SYSTEM
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

-- 12. MEAL PLANS (Thực đơn do manager tạo, member xem)
CREATE TABLE MealPlans (
    PlanID       INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(255) NOT NULL,
    Category     NVARCHAR(100) NOT NULL,        -- Bữa sáng / Bữa chính / Bữa phụ
    Goal         NVARCHAR(255) NULL,            -- tăng cơ / giảm mỡ / duy trì
    Calories     INT DEFAULT 0,
    Protein      FLOAT DEFAULT 0,               -- gram
    Carbs        FLOAT DEFAULT 0,               -- gram
    Fat          FLOAT DEFAULT 0,               -- gram
    Description  NVARCHAR(MAX) NULL,            -- Mô tả / hướng dẫn chế biến
    ImageURL     NVARCHAR(500) NULL,
    CreatedBy    INT NULL,
    CreatedAt    DATETIME DEFAULT GETDATE(),
    UpdatedAt    DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

GO

-- 13. VIEWS
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
    u.UserID,
    u.FullName,
    SUM(t.Amount) AS TotalRevenue
FROM Transactions t
JOIN Users u ON t.UserID = u.UserID
WHERE t.Status = 'Paid'
GROUP BY u.UserID, u.FullName;
GO