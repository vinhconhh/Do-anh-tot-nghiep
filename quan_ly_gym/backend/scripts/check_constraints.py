from sqlalchemy import text
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from src.app.database import engine

def check_constraint():
    with engine.connect() as conn:
        # Find the constraint name for GymEquipments Status
        res = conn.execute(text("""
            SELECT name, definition 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('GymEquipments')
        """))
        for row in res:
            print(f"Constraint: {row[0]}")
            print(f"Definition: {row[1]}")

if __name__ == "__main__":
    check_constraint()
