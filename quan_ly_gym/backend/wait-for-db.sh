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

# Always run migration/init scripts (they use IF NOT EXISTS so safe to re-run)
echo "📦 Running SQL init/migration scripts..."
for f in /docker-entrypoint-initdb.d/*.sql; do
    if [ -f "$f" ]; then
        echo "   Running: $(basename $f)"
        /opt/mssql-tools18/bin/sqlcmd -S "$SQL_SERVER" -U sa -P "$DB_PASSWORD" -C -f 65001 -i "$f" || echo "⚠️  Warning: $f had errors"
    fi
done
echo "✅ SQL scripts done!"

echo "🚀 Starting FastAPI..."
exec uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
