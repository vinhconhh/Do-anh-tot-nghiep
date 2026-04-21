# 🔧 Implementation Guide - Apply All Fixes

## Step 1: Apply Database Schema Fixes (CRITICAL ⚠️)

The most critical fix is updating your SQL Server database schema. Run this SQL script:

```bash
# Using SQL Server Management Studio:
# Open SQL Server Management Studio → Open File → Select: database/04_database_schema_fixes.sql
# Run the script (F5)

# OR using sqlcmd from PowerShell:
sqlcmd -S your_server_name -U sa -P your_password -i D:\Dowloads\ql_Gym\quan_ly_gym\database\04_database_schema_fixes.sql
```

**What this does:**
- ✅ Adds missing columns to LogWorkouts (CheckInTime, CheckOutTime, DurationMin, RPE)
- ✅ Adds missing columns to LogWorkoutDetails (ExerciseName, Done)
- ✅ Adds missing columns to BodyMetrics (Muscle, Height)
- ✅ Adds missing columns to PTProfiles (TotalScore, ResponseRate)
- ✅ Safe to run multiple times (checks if columns exist first)

---

## Step 2: Backend Security Fix

Already applied to your code:
```python
# File: backend/src/app/routes/dashboard.py
# Lines 195 & 269: Member report endpoints now require role check
current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
```

**No action needed** - changes already made in dashboard.py

---

## Step 3: Frontend Enhancements

Already applied to your code:

### 3a. PT Sidebar Navigation
- ✅ Added "Khách hàng của tôi" (My Clients) link for PT users
- ✅ File: `frontend/src/Layouts/DefaultLayout/components/Sidebar/index.jsx`

### 3b. New MyClients Page
- ✅ Created dedicated page for PT to manage clients
- ✅ Files: 
  - `frontend/src/page/MyClients/index.jsx`
  - `frontend/src/page/MyClients/MyClients.module.scss`

### 3c. Route Registration
- ✅ Added `/my-clients` route with PT role protection
- ✅ File: `frontend/src/components/AppRoutes/index.jsx`

**No action needed** - all changes already implemented

---

## Step 4: Restart Services

After applying database fixes, restart your services:

```bash
# From the project root directory (D:\Dowloads\ql_Gym\)

# Stop running services
docker-compose down

# Rebuild and start fresh
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Step 5: Testing Checklist ✅

### Test Check-In/Check-Out
1. Login as Member
2. Go to "Bài tập hàng ngày" (My Dashboard)
3. Click "Check-In" → Should show check-in time
4. Add exercises from schedule
5. Mark exercises as done
6. Click "Check-Out" → Should calculate duration and ask for RPE
7. ✅ Should see success message

### Test Member Reports
1. Login as Admin or Manager
2. Click "Báo cáo hội viên" (Member Reports)
3. ✅ Should see member dropdown and statistics
4. Login as Member/PT
5. Try to access `/member-report` directly
6. ✅ Should get 403 Forbidden error

### Test PT Clients
1. Login as PT user
2. Look at sidebar → Should see "Khách hàng của tôi"
3. Click it → Should show list of approved clients
4. Click a client → Should show detailed profile
5. ✅ Should see client progress and metrics

### Test AI Purchase
1. Login as Member
2. Click "Mua thêm lượt AI" (Buy AI Quota)
3. Select a package → Click "Chọn gói này"
4. Confirm purchase
5. ✅ Should show success and update quota

---

## 🐛 Troubleshooting

### Problem: Check-In/Check-Out returns 400 error
**Solution:** 
- Run the database schema fix script (04_database_schema_fixes.sql)
- Restart the backend service
- Clear browser cache

### Problem: PT can't see "Khách hàng của tôi" in sidebar
**Solution:**
- Clear browser cache
- Refresh page (Ctrl+F5)
- Check that user role is "PT" in database

### Problem: Member Reports show blank/no data
**Solution:**
- Ensure you're logged in as Admin or Manager
- Check that role=ADMIN or MANAGER in Users table
- Check browser console for 403 errors

### Problem: Can't access `/my-clients` page
**Solution:**
- Ensure you're logged in as PT user
- Check that `RequireRole roles={["PT"]}` is working
- Verify API endpoint: `GET /api/pt-requests/my-clients`

---

## 📊 Database Schema Changes Summary

Before and after the fix:

### LogWorkouts Table
```sql
-- BEFORE (Missing columns)
CREATE TABLE LogWorkouts (
    LogID INT PRIMARY KEY,
    UserID INT,
    WorkoutDate DATETIME
);

-- AFTER (Complete)
CREATE TABLE LogWorkouts (
    LogID INT PRIMARY KEY,
    UserID INT,
    WorkoutDate DATETIME,
    CheckInTime DATETIME,         -- ← NEW
    CheckOutTime DATETIME,        -- ← NEW
    DurationMin INT,              -- ← NEW
    RPE INT                       -- ← NEW
);
```

### LogWorkoutDetails Table
```sql
-- BEFORE (Missing columns)
CREATE TABLE LogWorkoutDetails (
    DetailID INT PRIMARY KEY,
    LogID INT,
    ExerciseID INT,
    SetNumber INT,
    Reps INT,
    Weight FLOAT
);

-- AFTER (Complete)
CREATE TABLE LogWorkoutDetails (
    DetailID INT PRIMARY KEY,
    LogID INT,
    ExerciseID INT (nullable),   -- ← NOW NULLABLE
    ExerciseName NVARCHAR(255),  -- ← NEW
    SetNumber INT,
    Reps INT,
    Weight FLOAT,
    Done INT DEFAULT 0           -- ← NEW
);
```

---

## ✅ Verification Query

Run this to verify all schema fixes are applied:

```sql
-- Check LogWorkouts has all columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LogWorkouts' 
ORDER BY ORDINAL_POSITION;
-- Should include: CheckInTime, CheckOutTime, DurationMin, RPE

-- Check LogWorkoutDetails
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LogWorkoutDetails' 
ORDER BY ORDINAL_POSITION;
-- Should include: ExerciseName, Done

-- Check BodyMetrics  
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'BodyMetrics' 
ORDER BY ORDINAL_POSITION;
-- Should include: Muscle, Height

-- Check PTProfiles
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PTProfiles' 
ORDER BY ORDINAL_POSITION;
-- Should include: TotalScore, ResponseRate
```

---

## 🎯 Expected Results

After all fixes are applied:

### ✅ Check-In/Check-Out
- Members can check in and check out
- Exercises are properly tracked
- Duration is calculated correctly
- RPE is saved for workout analytics

### ✅ Member Reports  
- Admin/Manager can access member reports
- Report shows: weight chart, session history, activities
- Regular members/PTs are blocked (403)

### ✅ PT Clients
- PT can see all approved clients
- "Khách hàng của tôi" link in sidebar
- Client details show progress and metrics
- Search function works

### ✅ AI Purchase
- Already working, no changes needed
- Members can buy packages
- Quota updates immediately

---

## 📞 Support

If you encounter any issues:

1. **Check database logs:**
   ```sql
   SELECT * FROM sys.sql_logins
   SELECT * FROM master.dbo.sysprocesses
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep -i error
   ```

3. **Check frontend console:**
   - Press F12 in browser
   - Go to Console tab
   - Look for any red errors

4. **Verify file changes:**
   - Compare your files with the fixed versions
   - Ensure all imports are correct

---

Generated: April 22, 2026
System: GYM Management (QL Gym)
