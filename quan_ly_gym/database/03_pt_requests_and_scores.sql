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
