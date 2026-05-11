USE QLGymDB;
GO

-- Add columns to MemberProfiles
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MemberProfiles') AND name = 'PackageID')
BEGIN
    ALTER TABLE MemberProfiles ADD PackageID INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MemberProfiles') AND name = 'AIPackageID')
BEGIN
    ALTER TABLE MemberProfiles ADD AIPackageID INT NULL;
END
GO

-- Add Foreign Keys for MemberProfiles if they don't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MemberProfiles_MembershipPackages')
BEGIN
    ALTER TABLE MemberProfiles
    ADD CONSTRAINT FK_MemberProfiles_MembershipPackages 
    FOREIGN KEY (PackageID) REFERENCES MembershipPackages(PackageID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MemberProfiles_AIPackages')
BEGIN
    ALTER TABLE MemberProfiles
    ADD CONSTRAINT FK_MemberProfiles_AIPackages 
    FOREIGN KEY (AIPackageID) REFERENCES AIPackages(PackageID);
END
GO

-- Create UserSubscriptions table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSubscriptions')
BEGIN
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
END
GO
