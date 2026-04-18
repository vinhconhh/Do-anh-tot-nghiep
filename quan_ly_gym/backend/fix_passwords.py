import bcrypt
import sys
sys.path.insert(0, '/app')
from src.app.database import engine
from sqlalchemy import text

h = bcrypt.hashpw(b'Admin@1234', bcrypt.gensalt(12)).decode()
print('New hash:', h[:20], '...')

emails = ['admin@gym.vn', 'manager@gym.vn', 'pt.john@gym.vn', 'alice.member@gym.vn']
with engine.begin() as conn:
    for email in emails:
        conn.execute(text("UPDATE Users SET PasswordHash=:h WHERE Email=:e"), {'h': h, 'e': email})
        print(f'Updated: {email}')
print('Done!')
