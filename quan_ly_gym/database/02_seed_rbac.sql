USE QLGymDB;
GO

PRINT '=== BẮT ĐẦU SEED DỮ LIỆU RBAC (ROLES & PERMISSIONS) ===';

BEGIN TRY
    BEGIN TRAN;

    PRINT '>> B1: Đồng bộ Roles...';
    MERGE Roles AS target
    USING (VALUES 
        ('ADMIN', N'Quản trị Hệ thống'),
        ('MANAGER', N'Ban Quản lý'),
        ('PT', N'Khối Chuyên môn'),
        ('MEMBER', N'Khách hàng')
    ) AS source (RoleCode, Department)
    ON target.RoleCode = source.RoleCode
    WHEN NOT MATCHED THEN
        INSERT (RoleCode, Department) VALUES (source.RoleCode, source.Department);

    DECLARE @Role_Admin INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'ADMIN');
    DECLARE @Role_Manager INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MANAGER');
    DECLARE @Role_PT INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'PT');
    DECLARE @Role_Member INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MEMBER');

    PRINT '>> B2: Đồng bộ Permissions...';
    MERGE Permissions AS target
    USING (VALUES
        ('AI_CONFIG_ALL', N'Toàn quyền cấu hình AI'),
        ('ADMIN_ACCOUNT_ALL', N'Quản lý tài khoản Admin'),
        ('MANAGER_ACCOUNT_ALL', N'Quản lý tài khoản Manager'),
        ('PT_ACCOUNT_ALL', N'Quản lý tài khoản PT'),
        ('MEMBER_ACCOUNT_ALL', N'Quản lý tài khoản Member'),
        ('PACKAGE_EQUIPMENT_ALL', N'Quản lý gói tập & thiết bị'),
        ('TRANSACTION_ALL', N'Xử lý giao dịch'),
        ('REPORT_REVENUE_ALL', N'Xem báo cáo doanh thu'),
        ('PT_ACCOUNT_OWN_EDIT', N'Sửa tài khoản cá nhân PT'),
        ('MEMBER_ACCOUNT_VIEW_ASSIGNED', N'Xem member được chỉ định'),
        ('MEMBER_ACCOUNT_OWN_EDIT', N'Sửa tài khoản cá nhân Member'),
        ('TRANSACTION_EXECUTE_OWN', N'Thực hiện giao dịch cá nhân')
    ) AS source (Code, Description)
    ON target.Code = source.Code
    WHEN NOT MATCHED THEN
        INSERT (Code, Description) VALUES (source.Code, source.Description);

    PRINT '>> B3: Gán quyền cho Roles...';
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @Role_Admin, PermissionID FROM Permissions 
    WHERE NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleID = @Role_Admin AND rp.PermissionID = Permissions.PermissionID);

    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @Role_Manager, PermissionID FROM Permissions WHERE Code IN ('PT_ACCOUNT_ALL','MEMBER_ACCOUNT_ALL','PACKAGE_EQUIPMENT_ALL','TRANSACTION_ALL','REPORT_REVENUE_ALL')
    AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleID = @Role_Manager AND rp.PermissionID = Permissions.PermissionID);

    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @Role_PT, PermissionID FROM Permissions WHERE Code IN ('PT_ACCOUNT_OWN_EDIT','MEMBER_ACCOUNT_VIEW_ASSIGNED')
    AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleID = @Role_PT AND rp.PermissionID = Permissions.PermissionID);

    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @Role_Member, PermissionID FROM Permissions WHERE Code IN ('MEMBER_ACCOUNT_OWN_EDIT','TRANSACTION_EXECUTE_OWN')
    AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleID = @Role_Member AND rp.PermissionID = Permissions.PermissionID);

    COMMIT TRAN;
    PRINT '=== HOÀN TẤT SEED RBAC THÀNH CÔNG (COMMIT) ===';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT '--- LỖI XẢY RA TRONG QUÁ TRÌNH SEED RBAC ---';
    PRINT ERROR_MESSAGE();
    PRINT 'Dòng: ' + CAST(ERROR_LINE() AS VARCHAR);
    THROW;
END CATCH;
GO