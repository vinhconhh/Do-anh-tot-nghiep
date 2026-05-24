/*
================================================================
FILE: 03_meal_plans.sql
MỤC ĐÍCH: Tạo bảng MealPlans cho tính năng thực đơn cá nhân
          do Manager quản lý, Member xem.
CHẠY: Thực thi file này một lần trên database QLGymDB hiện có.
================================================================
*/

USE QLGymDB;
GO

-- Tạo bảng MealPlans nếu chưa tồn tại
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'MealPlans' AND TABLE_SCHEMA = 'dbo'
)
BEGIN
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

    PRINT N'✅ Đã tạo bảng MealPlans thành công.';
END
ELSE
BEGIN
    PRINT N'ℹ️ Bảng MealPlans đã tồn tại, bỏ qua.';
END
GO
