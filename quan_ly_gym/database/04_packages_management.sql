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
            MaGoi INT IDENTITY(1,1) PRIMARY KEY,
            TenGoi NVARCHAR(100) NOT NULL,
            Gia DECIMAL(18,2) NOT NULL,
            ThoiHan INT NOT NULL, -- Theo tháng
            MoTa NVARCHAR(500),
            QuyenLoi NVARCHAR(MAX), -- JSON array string
            HienThi BIT DEFAULT 1,
            NoiBat BIT DEFAULT 0,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT '> Da tao bang MembershipPackages.';
    END

    -- 2. Bảng Gói AI (AIPackages)
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AIPackages')
    BEGIN
        CREATE TABLE AIPackages (
            MaGoiAi INT IDENTITY(1,1) PRIMARY KEY,
            TenGoi NVARCHAR(100) NOT NULL,
            Gia DECIMAL(18,2) NOT NULL,
            SoLuot INT NOT NULL,
            MoTa NVARCHAR(500),
            HienThi BIT DEFAULT 1,
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
        INSERT INTO MembershipPackages (TenGoi, Gia, ThoiHan, MoTa, QuyenLoi, HienThi, NoiBat)
        VALUES 
        (N'GÓI TIÊU CHUẨN', 299000, 1, N'Lựa chọn tiết kiệm nhất, dành cho hội viên có nhu cầu tập luyện cố định.', 
         N'["Tập không giới hạn 24/7", "Sử dụng toàn bộ thiết bị hiện đại", "Ứng dụng The Pro Gym"]', 1, 0),
        (N'GÓI CAO CẤP', 399000, 1, N'Tập luyện không giới hạn cùng AI, kèm theo nhiều đặc quyền bổ sung.', 
         N'["Kiểm tra sức khỏe & tư thế miễn phí", "Sử dụng toàn bộ thiết bị hiện đại", "Sử dụng AI không giới hạn", "Ứng dụng The Pro Gym đầy đủ tính năng"]', 1, 1);
        PRINT '> Da them du lieu mau cho MembershipPackages.';
    END

    IF NOT EXISTS (SELECT 1 FROM AIPackages)
    BEGIN
        INSERT INTO AIPackages (TenGoi, Gia, SoLuot, MoTa, HienThi)
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
