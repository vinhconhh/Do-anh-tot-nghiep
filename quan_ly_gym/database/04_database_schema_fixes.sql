-- ============================================================
-- DATABASE FIXES FOR GYM MANAGEMENT SYSTEM
-- Run this script to fix missing columns and tables
-- ============================================================
-- Date: 2026-04-22
-- These are migration scripts to add missing columns that were
-- defined in the models but not in the database schema

USE QLGymDB;
GO

PRINT '========== DATABASE SCHEMA FIXES ==========';

-- ============================================================
-- FIX 1: Add missing columns to LogWorkouts table
-- ============================================================
PRINT '';
PRINT 'FIX 1: Adding missing columns to LogWorkouts...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkouts') AND name = 'CheckInTime')
BEGIN
    ALTER TABLE LogWorkouts ADD CheckInTime DATETIME NULL;
    PRINT '  ✅ Added CheckInTime column';
END
ELSE PRINT '  ⏭️ CheckInTime already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkouts') AND name = 'CheckOutTime')
BEGIN
    ALTER TABLE LogWorkouts ADD CheckOutTime DATETIME NULL;
    PRINT '  ✅ Added CheckOutTime column';
END
ELSE PRINT '  ⏭️ CheckOutTime already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkouts') AND name = 'DurationMin')
BEGIN
    ALTER TABLE LogWorkouts ADD DurationMin INT NULL;
    PRINT '  ✅ Added DurationMin column';
END
ELSE PRINT '  ⏭️ DurationMin already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkouts') AND name = 'RPE')
BEGIN
    ALTER TABLE LogWorkouts ADD RPE INT NULL;
    PRINT '  ✅ Added RPE column';
END
ELSE PRINT '  ⏭️ RPE already exists';

-- ============================================================
-- FIX 2: Add missing columns to LogWorkoutDetails table
-- ============================================================
PRINT '';
PRINT 'FIX 2: Adding missing columns to LogWorkoutDetails...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkoutDetails') AND name = 'ExerciseName')
BEGIN
    ALTER TABLE LogWorkoutDetails ADD ExerciseName NVARCHAR(255) NULL;
    PRINT '  ✅ Added ExerciseName column';
END
ELSE PRINT '  ⏭️ ExerciseName already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LogWorkoutDetails') AND name = 'Done')
BEGIN
    ALTER TABLE LogWorkoutDetails ADD Done INT DEFAULT 0;
    PRINT '  ✅ Added Done column';
END
ELSE PRINT '  ⏭️ Done already exists';

-- Make ExerciseID nullable
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LogWorkoutDetails' AND COLUMN_NAME = 'ExerciseID' AND IS_NULLABLE = 'NO')
BEGIN
    ALTER TABLE LogWorkoutDetails ALTER COLUMN ExerciseID INT NULL;
    PRINT '  ✅ Made ExerciseID nullable';
END

-- ============================================================
-- FIX 3: Add missing columns to BodyMetrics table
-- ============================================================
PRINT '';
PRINT 'FIX 3: Adding missing columns to BodyMetrics...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BodyMetrics') AND name = 'Muscle')
BEGIN
    ALTER TABLE BodyMetrics ADD Muscle FLOAT NULL;
    PRINT '  ✅ Added Muscle column';
END
ELSE PRINT '  ⏭️ Muscle already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('BodyMetrics') AND name = 'Height')
BEGIN
    ALTER TABLE BodyMetrics ADD Height FLOAT NULL;
    PRINT '  ✅ Added Height column';
END
ELSE PRINT '  ⏭️ Height already exists';

-- ============================================================
-- FIX 4: Add missing columns to PTProfiles table
-- ============================================================
PRINT '';
PRINT 'FIX 4: Adding missing columns to PTProfiles...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTProfiles') AND name = 'TotalScore')
BEGIN
    ALTER TABLE PTProfiles ADD TotalScore INT DEFAULT 100;
    PRINT '  ✅ Added TotalScore column';
END
ELSE PRINT '  ⏭️ TotalScore already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PTProfiles') AND name = 'ResponseRate')
BEGIN
    ALTER TABLE PTProfiles ADD ResponseRate DECIMAL(5,2) DEFAULT 100.00;
    PRINT '  ✅ Added ResponseRate column';
END
ELSE PRINT '  ⏭️ ResponseRate already exists';

-- ============================================================
-- VERIFICATION
-- ============================================================
PRINT '';
PRINT '========== VERIFICATION ==========';
PRINT 'Checking LogWorkouts columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LogWorkouts' ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'Checking LogWorkoutDetails columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LogWorkoutDetails' ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'Checking BodyMetrics columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BodyMetrics' ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '========== ALL FIXES COMPLETED ==========';
