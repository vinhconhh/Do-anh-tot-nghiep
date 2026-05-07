#!/bin/bash
# wait-for-db.sh – Wait for SQL Server to be ready, then init DB and start app
set -e

DB_HOST="${DB_SERVER:-db}"
DB_PORT_NUM="${DB_PORT:-1433}"
SQL_SERVER="${DB_HOST},${DB_PORT_NUM}"

echo "⏳ Waiting for SQL Server at ${SQL_SERVER} to be ready..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if /opt/mssql-tools18/bin/sqlcmd -S "$SQL_SERVER" -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "✅ SQL Server is ready!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "   Attempt $RETRY/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Could not connect to SQL Server after $MAX_RETRIES attempts."
    echo "⚠️  Starting uvicorn anyway..."
    exec uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
fi

# Run SQL init scripts if DB doesn't exist yet
echo "🔍 Checking if database exists..."
DB_EXISTS=$(/opt/mssql-tools18/bin/sqlcmd -S "$SQL_SERVER" -U sa -P "$DB_PASSWORD" -C -Q "SELECT COUNT(*) FROM sys.databases WHERE name='$DB_NAME'" -h -1 -W 2>/dev/null | head -1 | tr -d '[:space:]')

if [ "$DB_EXISTS" = "0" ] || [ -z "$DB_EXISTS" ]; then
    echo "📦 Creating database and seeding..."
    for f in /docker-entrypoint-initdb.d/*.sql; do
        if [ -f "$f" ]; then
            echo "   Running: $(basename $f)"
            /opt/mssql-tools18/bin/sqlcmd -S "$SQL_SERVER" -U sa -P "$DB_PASSWORD" -C -f 65001 -i "$f" || echo "⚠️  Warning: $f had errors"
        fi
    done
    echo "✅ Database initialized!"
else
    echo "✅ Database '$DB_NAME' already exists, skipping init."
fi

echo "🚀 Starting FastAPI..."
exec uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
