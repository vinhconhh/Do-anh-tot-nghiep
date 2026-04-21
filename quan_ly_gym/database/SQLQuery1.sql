CREATE DATABASE QLGymDB;
USE QLGymDB;

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

CREATE UNIQUE INDEX UX_CheckIn_Schedule ON CheckIns(UserID, ScheduleID) WHERE ScheduleID IS NOT NULL;
CREATE UNIQUE INDEX UX_CheckIn_Booking ON CheckIns(UserID, BookingID) WHERE BookingID IS NOT NULL;

-- ======================
-- WORKOUT LOG
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

-- ======================
-- ANALYTICS VIEWS (đã sửa lỗi chia cho 0)
-- ======================
GO
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