USE QLGymDB;
GO

PRINT '=== BẮT ĐẦU SEED DỮ LIỆU NGHIỆP VỤ TOÀN DIỆN ===';

BEGIN TRY
    BEGIN TRAN;

    -- TRÍCH XUẤT LẠI ROLE ID (Bắt buộc để đảm bảo kết nối với File 02)
    DECLARE @Role_Admin INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'ADMIN');
    DECLARE @Role_Manager INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MANAGER');
    DECLARE @Role_PT INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'PT');
    DECLARE @Role_Member INT = (SELECT RoleID FROM Roles WHERE RoleCode = 'MEMBER');

    -- =====================================================
    -- 1. USERS (có Profile)
    -- =====================================================
    PRINT '>> B1: Tạo Users mẫu...';

    DECLARE @AdminID INT, @ManagerID INT, @PT_JohnID INT, @PT_AnnaID INT, @Member_AliceID INT, @Member_BobID INT;

    -- Admin
    MERGE Users AS target
    USING (VALUES (N'Admin Tối Cao', 'admin@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_Admin, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @AdminID = (SELECT UserID FROM Users WHERE Email = 'admin@gym.vn');

    -- Manager
    MERGE Users AS target
    USING (VALUES (N'Quản lý Hoàng', 'manager@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_Manager, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @ManagerID = (SELECT UserID FROM Users WHERE Email = 'manager@gym.vn');

    -- PT John
    MERGE Users AS target
    USING (VALUES (N'PT John Cena', 'pt.john@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_PT, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @PT_JohnID = (SELECT UserID FROM Users WHERE Email = 'pt.john@gym.vn');

    -- PT Anna
    MERGE Users AS target
    USING (VALUES (N'PT Anna Fitness', 'pt.anna@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_PT, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @PT_AnnaID = (SELECT UserID FROM Users WHERE Email = 'pt.anna@gym.vn');

    -- Member Alice
    MERGE Users AS target
    USING (VALUES (N'Alice Nguyễn', 'alice.member@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_Member, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @Member_AliceID = (SELECT UserID FROM Users WHERE Email = 'alice.member@gym.vn');

    -- Member Bob
    MERGE Users AS target
    USING (VALUES (N'Bob Trần', 'bob.member@gym.vn', '$2b$12$5LO4RG5.97fwfyMJupgGWeUjvtT9Dv5DIffDaXNDbn2jAgFA9iDhO', @Role_Member, 1))
    AS source (FullName, Email, PasswordHash, RoleID, IsActive)
    ON target.Email = source.Email
    WHEN NOT MATCHED THEN
        INSERT (FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (source.FullName, source.Email, source.PasswordHash, source.RoleID, source.IsActive);
    SET @Member_BobID = (SELECT UserID FROM Users WHERE Email = 'bob.member@gym.vn');

    -- Profiles
    PRINT '   -> Tạo MemberProfiles và PTProfiles...';
    
    INSERT INTO MemberProfiles (UserID, Goal, Height, Weight, AIQuota)
    SELECT @Member_AliceID, N'Giảm mỡ, tăng cơ', 160, 55, 10
    WHERE NOT EXISTS (SELECT 1 FROM MemberProfiles WHERE UserID = @Member_AliceID);

    INSERT INTO MemberProfiles (UserID, Goal, Height, Weight, AIQuota)
    SELECT @Member_BobID, N'Tăng sức mạnh', 175, 80, 5
    WHERE NOT EXISTS (SELECT 1 FROM MemberProfiles WHERE UserID = @Member_BobID);

    INSERT INTO PTProfiles (UserID, ExperienceYears, Certifications, Specialty)
    SELECT @PT_JohnID, 8, N'NASM, CrossFit L2', N'Powerlifting'
    WHERE NOT EXISTS (SELECT 1 FROM PTProfiles WHERE UserID = @PT_JohnID);

    INSERT INTO PTProfiles (UserID, ExperienceYears, Certifications, Specialty)
    SELECT @PT_AnnaID, 5, N'ACE, Yoga 200H', N'Pilates, Yoga'
    WHERE NOT EXISTS (SELECT 1 FROM PTProfiles WHERE UserID = @PT_AnnaID);

    -- =====================================================
    -- 2. MASTER DATA (MuscleGroups, Equipments, Exercises)
    -- =====================================================
    PRINT '>> B2: Tạo danh mục Master Data...';

    DECLARE @Muscle_Chest INT, @Muscle_Legs INT, @Equip_Barbell INT, @Equip_Dumbbell INT;

    MERGE MuscleGroups AS target
    USING (VALUES (N'Ngực'), (N'Chân'), (N'Lưng'), (N'Tay trước'), (N'Vai'))
    AS source (Name) ON target.Name = source.Name
    WHEN NOT MATCHED THEN INSERT (Name) VALUES (source.Name);
    SET @Muscle_Chest = (SELECT MuscleGroupID FROM MuscleGroups WHERE Name = N'Ngực');
    SET @Muscle_Legs = (SELECT MuscleGroupID FROM MuscleGroups WHERE Name = N'Chân');

    MERGE Equipments AS target
    USING (VALUES ('Barbell'), ('Dumbbell'), ('Machine'), ('Bodyweight'))
    AS source (Name) ON target.Name = source.Name
    WHEN NOT MATCHED THEN INSERT (Name) VALUES (source.Name);
    SET @Equip_Barbell = (SELECT EquipmentID FROM Equipments WHERE Name = 'Barbell');
    SET @Equip_Dumbbell = (SELECT EquipmentID FROM Equipments WHERE Name = 'Dumbbell');

    DECLARE @Ex_BenchPress INT, @Ex_Squat INT;
    MERGE Exercises AS target
    USING (VALUES 
        ('Bench Press', @Muscle_Chest, @Equip_Barbell),
        ('Squat', @Muscle_Legs, @Equip_Barbell),
        ('Dumbbell Fly', @Muscle_Chest, @Equip_Dumbbell)
    ) AS source (Name, MuscleGroupID, EquipmentID)
    ON target.Name = source.Name
    WHEN NOT MATCHED THEN
        INSERT (Name, MuscleGroupID, EquipmentID)
        VALUES (source.Name, source.MuscleGroupID, source.EquipmentID);
    SET @Ex_BenchPress = (SELECT ExerciseID FROM Exercises WHERE Name = 'Bench Press');
    SET @Ex_Squat = (SELECT ExerciseID FROM Exercises WHERE Name = 'Squat');

    -- =====================================================
    -- 3. WORKOUT ROUTINES (Giáo án mẫu)
    -- =====================================================
    PRINT '>> B3: Tạo Workout Routines...';
    DECLARE @Routine_FullBody INT;

    MERGE WorkoutRoutines AS target
    USING (VALUES (N'Full Body Beginner', @PT_JohnID))
    AS source (Name, CreatedBy)
    ON target.Name = source.Name
    WHEN NOT MATCHED THEN
        INSERT (Name, CreatedBy) VALUES (source.Name, source.CreatedBy);
    SET @Routine_FullBody = (SELECT RoutineID FROM WorkoutRoutines WHERE Name = N'Full Body Beginner');

    -- Routine Details
    INSERT INTO WorkoutRoutineDetails (RoutineID, ExerciseID, Sets, Reps)
    SELECT @Routine_FullBody, @Ex_BenchPress, 3, 10
    WHERE NOT EXISTS (SELECT 1 FROM WorkoutRoutineDetails WHERE RoutineID = @Routine_FullBody AND ExerciseID = @Ex_BenchPress);

    INSERT INTO WorkoutRoutineDetails (RoutineID, ExerciseID, Sets, Reps)
    SELECT @Routine_FullBody, @Ex_Squat, 3, 12
    WHERE NOT EXISTS (SELECT 1 FROM WorkoutRoutineDetails WHERE RoutineID = @Routine_FullBody AND ExerciseID = @Ex_Squat);

    -- =====================================================
    -- 4. SCHEDULES & BOOKINGS
    -- =====================================================
    PRINT '>> B4: Tạo Schedules và Bookings...';
    DECLARE @Schedule_Alice1 INT, @Booking_Bob1 INT;

    -- Lịch tự tập cho Alice
    INSERT INTO Schedules (UserID, RoutineID, WorkoutDate)
    SELECT @Member_AliceID, @Routine_FullBody, '2026-04-20'
    WHERE NOT EXISTS (SELECT 1 FROM Schedules WHERE UserID = @Member_AliceID AND WorkoutDate = '2026-04-20');
    SET @Schedule_Alice1 = (SELECT ScheduleID FROM Schedules WHERE UserID = @Member_AliceID AND WorkoutDate = '2026-04-20');

    -- Đặt lịch PT cho Bob
    INSERT INTO Bookings (MemberID, PTID, StartTime, EndTime, Status)
    SELECT @Member_BobID, @PT_AnnaID, '2026-04-21 09:00', '2026-04-21 10:00', 'Confirmed'
    WHERE NOT EXISTS (SELECT 1 FROM Bookings WHERE MemberID = @Member_BobID AND StartTime = '2026-04-21 09:00');
    SET @Booking_Bob1 = (SELECT BookingID FROM Bookings WHERE MemberID = @Member_BobID AND StartTime = '2026-04-21 09:00');

    -- =====================================================
    -- 5. CHECK-INS
    -- =====================================================
    PRINT '>> B5: Tạo Check-ins...';
    INSERT INTO CheckIns (UserID, ScheduleID)
    SELECT @Member_AliceID, @Schedule_Alice1
    WHERE NOT EXISTS (SELECT 1 FROM CheckIns WHERE UserID = @Member_AliceID AND ScheduleID = @Schedule_Alice1);

    INSERT INTO CheckIns (UserID, BookingID)
    SELECT @Member_BobID, @Booking_Bob1
    WHERE NOT EXISTS (SELECT 1 FROM CheckIns WHERE UserID = @Member_BobID AND BookingID = @Booking_Bob1);

    -- =====================================================
    -- 6. WORKOUT LOGS
    -- =====================================================
    PRINT '>> B6: Tạo Log Workouts...';
    DECLARE @Log_Alice1 INT;
    
    INSERT INTO LogWorkouts (UserID, WorkoutDate)
    SELECT @Member_AliceID, GETDATE()
    WHERE NOT EXISTS (SELECT 1 FROM LogWorkouts WHERE UserID = @Member_AliceID AND CAST(WorkoutDate AS DATE) = CAST(GETDATE() AS DATE));
    
    SET @Log_Alice1 = (SELECT LogID FROM LogWorkouts WHERE UserID = @Member_AliceID AND CAST(WorkoutDate AS DATE) = CAST(GETDATE() AS DATE));

    INSERT INTO LogWorkoutDetails (LogID, ExerciseID, SetNumber, Reps, Weight)
    SELECT @Log_Alice1, @Ex_BenchPress, 1, 10, 20
    WHERE NOT EXISTS (SELECT 1 FROM LogWorkoutDetails WHERE LogID = @Log_Alice1 AND ExerciseID = @Ex_BenchPress AND SetNumber = 1);

    -- =====================================================
    -- 7. DIET PLANS & MEALS
    -- =====================================================
    PRINT '>> B7: Tạo Diet Plans...';
    DECLARE @Diet_Alice INT;
    MERGE DietPlans AS target
    USING (VALUES (N'Giảm cân 1500 cal', @PT_AnnaID))
    AS source (Name, UserID) ON target.Name = source.Name
    WHEN NOT MATCHED THEN INSERT (Name, UserID) VALUES (source.Name, source.UserID);
    SET @Diet_Alice = (SELECT DietID FROM DietPlans WHERE Name = N'Giảm cân 1500 cal');

    DECLARE @Meal_Breakfast INT;
    INSERT INTO Meals (DietID, MealType)
    SELECT @Diet_Alice, N'Breakfast'
    WHERE NOT EXISTS (SELECT 1 FROM Meals WHERE DietID = @Diet_Alice AND MealType = N'Breakfast');
    
    SET @Meal_Breakfast = (SELECT MealID FROM Meals WHERE DietID = @Diet_Alice AND MealType = N'Breakfast');

    INSERT INTO MealItems (MealID, FoodName, Calories, Protein, Carbs, Fat)
    SELECT @Meal_Breakfast, N'Yến mạch + Sữa chua', 350, 15, 45, 8
    WHERE NOT EXISTS (SELECT 1 FROM MealItems WHERE MealID = @Meal_Breakfast AND FoodName = N'Yến mạch + Sữa chua');

    -- =====================================================
    -- 8. BODY METRICS & PHOTOS
    -- =====================================================
    PRINT '>> B8: Tạo Body Metrics...';
    INSERT INTO BodyMetrics (UserID, Weight, BodyFat, BMI)
    SELECT @Member_AliceID, 54.5, 22.5, 21.3
    WHERE NOT EXISTS (SELECT 1 FROM BodyMetrics WHERE UserID = @Member_AliceID AND CAST(MeasuredAt AS DATE) = CAST(GETDATE() AS DATE));

    INSERT INTO ProgressPhotos (UserID, ImageURL)
    SELECT @Member_AliceID, '/uploads/progress/alice_20260418.jpg'
    WHERE NOT EXISTS (SELECT 1 FROM ProgressPhotos WHERE UserID = @Member_AliceID AND ImageURL = '/uploads/progress/alice_20260418.jpg');

    -- =====================================================
    -- 9. FINANCE: Invoices, Transactions
    -- =====================================================
    PRINT '>> B9: Tạo dữ liệu Tài chính...';
    DECLARE @Invoice_Alice INT;

    INSERT INTO Invoices (UserID, TotalAmount, Status)
    SELECT @Member_AliceID, 1500000, 'Paid'
    WHERE NOT EXISTS (SELECT 1 FROM Invoices WHERE UserID = @Member_AliceID AND TotalAmount = 1500000 AND Status = 'Paid');
    SET @Invoice_Alice = (SELECT InvoiceID FROM Invoices WHERE UserID = @Member_AliceID AND TotalAmount = 1500000);

    INSERT INTO Transactions (UserID, InvoiceID, Amount, Status)
    SELECT @Member_AliceID, @Invoice_Alice, 1500000, 'Paid'
    WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE InvoiceID = @Invoice_Alice);

    -- Gói theo buổi cho Bob
    DECLARE @Invoice_Bob INT;
    INSERT INTO Invoices (UserID, TotalAmount, Status)
    SELECT @Member_BobID, 2500000, 'Paid'
    WHERE NOT EXISTS (SELECT 1 FROM Invoices WHERE UserID = @Member_BobID AND TotalAmount = 2500000);
    
    SET @Invoice_Bob = (SELECT InvoiceID FROM Invoices WHERE UserID = @Member_BobID AND TotalAmount = 2500000);

    INSERT INTO Transactions (UserID, InvoiceID, Amount, Status)
    SELECT @Member_BobID, @Invoice_Bob, 2500000, 'Paid'
    WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE InvoiceID = @Invoice_Bob);

    -- =====================================================
    -- 10. AI REQUESTS & RESPONSES
    -- =====================================================
    PRINT '>> B10: Tạo dữ liệu AI...';
    DECLARE @AIReq1 INT;
    
    INSERT INTO AIRequests (UserID, Prompt, Model)
    SELECT @Member_AliceID, N'Tạo lịch tập giảm mỡ 4 buổi/tuần', 'gemini-1.5-pro'
    WHERE NOT EXISTS (SELECT 1 FROM AIRequests WHERE UserID = @Member_AliceID AND Prompt LIKE N'Tạo lịch tập giảm mỡ%');
    
    SET @AIReq1 = (SELECT RequestID FROM AIRequests WHERE UserID = @Member_AliceID AND Prompt LIKE N'Tạo lịch tập giảm mỡ%');

    INSERT INTO AIResponses (RequestID, ResponseData, TokensUsed, Cost, Status)
    SELECT @AIReq1, N'{"plan": "Day1: Upper...", "calories": 1800}', 1250, 0.0045, 'Success'
    WHERE NOT EXISTS (SELECT 1 FROM AIResponses WHERE RequestID = @AIReq1);

    -- =====================================================
    -- 11. NOTIFICATIONS & AUDIT LOGS
    -- =====================================================
    PRINT '>> B11: Tạo Notifications và Audit Logs...';
    INSERT INTO Notifications (UserID, Message, Type)
    SELECT @Member_AliceID, N'Chào mừng bạn đến với QLGym!', 'System'
    WHERE NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @Member_AliceID AND Message = N'Chào mừng bạn đến với QLGym!');

    INSERT INTO AuditLogs (UserID, Action, TableName, RecordID, NewData)
    SELECT @AdminID, 'CREATE', 'Users', @Member_AliceID, N'{"Email":"alice.member@gym.vn"}'
    WHERE NOT EXISTS (SELECT 1 FROM AuditLogs WHERE TableName = 'Users' AND RecordID = @Member_AliceID AND Action = 'CREATE');

    COMMIT TRAN;
    PRINT '=== HOÀN TẤT SEED DỮ LIỆU NGHIỆP VỤ THÀNH CÔNG (COMMIT) ===';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT '--- LỖI XẢY RA TRONG QUÁ TRÌNH SEED NGHIỆP VỤ ---';
    PRINT ERROR_MESSAGE();
    PRINT 'Dòng: ' + CAST(ERROR_LINE() AS VARCHAR);
    THROW;
END CATCH;
GO