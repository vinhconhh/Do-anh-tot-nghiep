-- Migration: Add recurring scheduling columns to GymClasses
-- Run this against the existing database to support the new recurring class feature

USE qlgym;
GO

-- Only add columns if they don't already exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'Intensity')
BEGIN
    ALTER TABLE GymClasses ADD Intensity NVARCHAR(20) NULL DEFAULT 'medium';
    PRINT 'Added column: Intensity';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'IsRecurring')
BEGIN
    ALTER TABLE GymClasses ADD IsRecurring BIT NULL DEFAULT 0;
    PRINT 'Added column: IsRecurring';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'RecurringDays')
BEGIN
    ALTER TABLE GymClasses ADD RecurringDays NVARCHAR(50) NULL;
    PRINT 'Added column: RecurringDays';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'RecurringStartDate')
BEGIN
    ALTER TABLE GymClasses ADD RecurringStartDate DATE NULL;
    PRINT 'Added column: RecurringStartDate';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'RecurringEndDate')
BEGIN
    ALTER TABLE GymClasses ADD RecurringEndDate DATE NULL;
    PRINT 'Added column: RecurringEndDate';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('GymClasses') AND name = 'ParentClassID')
BEGIN
    ALTER TABLE GymClasses ADD ParentClassID INT NULL;
    PRINT 'Added column: ParentClassID';
END
GO

PRINT 'Migration complete: GymClasses recurring columns added.';
GO
