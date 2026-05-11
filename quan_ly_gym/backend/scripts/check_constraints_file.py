from sqlalchemy import text
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from src.app.database import engine

def check_constraint():
    with engine.connect() as conn:
        res = conn.execute(text("""
            SELECT name, definition 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('GymEquipments')
        """))
        with open("constraints_output.txt", "w", encoding="utf-8") as f:
            for row in res:
                f.write(f"Constraint: {row[0]}\n")
                f.write(f"Definition: {row[1]}\n\n")

if __name__ == "__main__":
    check_constraint()
