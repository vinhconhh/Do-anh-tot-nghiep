"""
fix_passwords.py – Reset all user passwords to bcrypt hashes
Default password for all seed users: 123456
"""
import os
import pyodbc
import bcrypt

DB_SERVER = os.getenv("DB_SERVER", "host.docker.internal")
DB_PORT = os.getenv("DB_PORT", "1433")
DB_NAME = os.getenv("DB_NAME", "QLGymDB")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "111111")

DEFAULT_PASSWORD = "123456"

def main():
    hashed = bcrypt.hashpw(DEFAULT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    print(f"🔑 New bcrypt hash for '{DEFAULT_PASSWORD}': {hashed}")

    conn_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={DB_SERVER},{DB_PORT};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        f"TrustServerCertificate=yes;"
    )

    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        cursor.execute("SELECT UserID, Email, PasswordHash FROM Users")
        users = cursor.fetchall()
        print(f"📋 Found {len(users)} users")

        for user_id, email, current_hash in users:
            cursor.execute(
                "UPDATE Users SET PasswordHash = ? WHERE UserID = ?",
                hashed, user_id
            )
            print(f"   ✅ Updated: {email}")

        conn.commit()
        cursor.close()
        conn.close()
        print(f"🎉 All passwords reset to '{DEFAULT_PASSWORD}'")

    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()
