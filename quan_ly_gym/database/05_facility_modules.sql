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
        TenBaiTap     NVARCHAR(255),          -- Tên tiếng Việt
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
    INSERT INTO GymExercises (Name, TenBaiTap, Type, TargetMuscle, MetValue) VALUES
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
