/*
================================================================
FILE: 02_seed_data.sql
MỤC ĐÍCH: Nạp toàn bộ dữ liệu mẫu vào QLGymDB theo 5 vai trò mới
================================================================
*/

USE QLGymDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT '=== BẮT ĐẦU SEED DỮ LIỆU ===';

BEGIN TRY
    BEGIN TRAN;

    -- =====================================================
    -- PHẦN 1: RBAC (ROLES & PERMISSIONS)
    -- =====================================================
    PRINT '>> B1: Đồng bộ Roles...';
    MERGE Roles AS target
    USING (VALUES 
        ('ADMIN', N'Quản trị Hệ thống'),
        ('MANAGER', N'Ban Quản lý'),
        ('RECEPTIONIST', N'Lễ tân'),
        ('PT', N'Khối Chuyên môn'),
        ('MEMBER', N'Khách hàng')
    ) AS source (RoleCode, Department)
    ON target.RoleCode = source.RoleCode
    WHEN NOT MATCHED THEN
        INSERT (RoleCode, Department) VALUES (source.RoleCode, source.Department);

    DECLARE @Role_Admin INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'ADMIN');
    DECLARE @Role_Manager INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MANAGER');
    DECLARE @Role_Receptionist INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'RECEPTIONIST');
    DECLARE @Role_PT INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'PT');
    DECLARE @Role_Member INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MEMBER');

    PRINT '>> B2: Đồng bộ Permissions...';
    MERGE Permissions AS target
    USING (VALUES
        ('ADMIN_ALL', N'Quản trị hệ thống'),
        ('MANAGER_HR', N'Quản lý nhân sự và phân bổ PT'),
        ('RECEPTIONIST_BASIC', N'Quản lý hội viên cơ bản'),
        ('PT_COACHING', N'Lên giáo án và theo dõi hội viên'),
        ('MEMBER_ACCESS', N'Xem lộ trình và đặt lịch')
    ) AS source (Code, Description)
    ON target.Code = source.Code
    WHEN NOT MATCHED THEN
        INSERT (Code, Description) VALUES (source.Code, source.Description);

    -- =====================================================
    -- PHẦN 2: DỮ LIỆU NGHIỆP VỤ
    -- =====================================================
    PRINT '>> B4: Tạo Users mẫu...';

    DECLARE @AdminID INT, @ManagerID INT, @ReceptID INT, @PT_JohnID INT, @PT_AnnaID INT, @Member_AliceID INT, @Member_BobID INT;

    MERGE Users AS target USING (VALUES (N'Admin Tối Cao', 'admin@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_Admin, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @AdminID = (SELECT UserID FROM Users WHERE Email = 'admin@gym.vn');

    MERGE Users AS target USING (VALUES (N'Quản lý Hoàng', 'manager@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_Manager, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @ManagerID = (SELECT UserID FROM Users WHERE Email = 'manager@gym.vn');

    MERGE Users AS target USING (VALUES (N'Lễ tân Mai', 'receptionist@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_Receptionist, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @ReceptID = (SELECT UserID FROM Users WHERE Email = 'receptionist@gym.vn');

    MERGE Users AS target USING (VALUES (N'PT John Cena', 'pt.john@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_PT, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @PT_JohnID = (SELECT UserID FROM Users WHERE Email = 'pt.john@gym.vn');

    MERGE Users AS target USING (VALUES (N'PT Anna Fitness', 'pt.anna@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_PT, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @PT_AnnaID = (SELECT UserID FROM Users WHERE Email = 'pt.anna@gym.vn');

    MERGE Users AS target USING (VALUES (N'Alice Nguyễn', 'alice.member@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_Member, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @Member_AliceID = (SELECT UserID FROM Users WHERE Email = 'alice.member@gym.vn');

    MERGE Users AS target USING (VALUES (N'Bob Trần', 'bob.member@gym.vn', '$2b$12$ja8z4xjaj6fl70DHzReid.A0ufaGXNqXNpOQRci425XXqXcTMtZ4i', @Role_Member, 1)) AS source (FullName, Email, PasswordHash, RoleID, IsActive) ON target.Email = source.Email WHEN NOT MATCHED THEN INSERT (FullName, Email, PasswordHash, RoleID, IsActive) VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @Member_BobID = (SELECT UserID FROM Users WHERE Email = 'bob.member@gym.vn');

    PRINT '   -> Tạo Profiles...';
    INSERT INTO MemberProfiles (UserID, Goal, Height, Weight) SELECT @Member_AliceID, N'Giảm mỡ, tăng cơ', 160, 55 WHERE NOT EXISTS (SELECT 1 FROM MemberProfiles WHERE UserID = @Member_AliceID);
    INSERT INTO MemberProfiles (UserID, Goal, Height, Weight) SELECT @Member_BobID, N'Tăng sức mạnh', 175, 80 WHERE NOT EXISTS (SELECT 1 FROM MemberProfiles WHERE UserID = @Member_BobID);
    INSERT INTO PTProfiles (UserID, ExperienceYears, Certifications, Specialty) SELECT @PT_JohnID, 8, N'NASM, CrossFit L2', N'Powerlifting' WHERE NOT EXISTS (SELECT 1 FROM PTProfiles WHERE UserID = @PT_JohnID);
    INSERT INTO PTProfiles (UserID, ExperienceYears, Certifications, Specialty) SELECT @PT_AnnaID, 5, N'ACE, Yoga 200H', N'Pilates, Yoga' WHERE NOT EXISTS (SELECT 1 FROM PTProfiles WHERE UserID = @PT_AnnaID);

    PRINT '>> B5: Gán PT cho Hội viên...';
    INSERT INTO MemberPTRelations (MemberID, PTID, AssignedBy, Status)
    SELECT @Member_AliceID, @PT_AnnaID, @ManagerID, 'Active'
    WHERE NOT EXISTS (SELECT 1 FROM MemberPTRelations WHERE MemberID = @Member_AliceID AND PTID = @PT_AnnaID);

    INSERT INTO MemberPTRelations (MemberID, PTID, AssignedBy, Status)
    SELECT @Member_BobID, @PT_JohnID, @ManagerID, 'Active'
    WHERE NOT EXISTS (SELECT 1 FROM MemberPTRelations WHERE MemberID = @Member_BobID AND PTID = @PT_JohnID);

    PRINT '>> B6: Thiết bị & Bài tập mẫu...';
    IF NOT EXISTS (SELECT 1 FROM GymEquipments)
    BEGIN
        INSERT INTO GymEquipments (Name, Category, Zone, Quantity, Status) VALUES
        (N'Máy chạy bộ (Treadmill)',  N'Cardio',    N'Khu Cardio',    12, N'Hoạt động'),
        (N'Tạ tay (Dumbbell set)',    N'Tạ tự do',  N'Khu Free Weight',1, N'Hoạt động');
    END

    IF NOT EXISTS (SELECT 1 FROM GymExercises)
    BEGIN
        INSERT INTO GymExercises (Name, AssignmentName, Type, TargetMuscle, MetValue) VALUES
        (N'Bench Press',    N'Đẩy ngực nằm',    N'Free Weights', N'Ngực',  5.0),
        (N'Squat',          N'Squat',            N'Free Weights', N'Đùi',   6.0);
    END

    COMMIT TRAN;
    PRINT '=== HOÀN TẤT SEED DỮ LIỆU ===';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT '--- LỖI XẢY RA, ĐÃ ROLLBACK ---';
    PRINT ERROR_MESSAGE();
END CATCH;
GO