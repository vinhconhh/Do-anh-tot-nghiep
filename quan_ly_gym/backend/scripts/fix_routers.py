import os
import re

directory = r"C:\Users\vinhc\OneDrive\Máy tính\Do-anh-tot-nghiep\quan_ly_gym\backend\src\app\routes"
pattern = re.compile(r'router\s*=\s*APIRouter\(.*?\)', re.DOTALL)

for filename in os.listdir(directory):
    if filename.endswith(".py") and filename != "__init__.py":
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = pattern.sub('router = APIRouter()', content)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
