#!/bin/bash
# Reset the database by dropping and recreating it
# The next server startup will run init_db() which seeds demo data

set -e

echo "Resetting database..."

docker compose exec postgres psql -U labasi -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'labasi' AND pid <> pg_backend_pid();
"

docker compose exec postgres psql -U labasi -d postgres -c "DROP DATABASE IF EXISTS labasi;"
docker compose exec postgres psql -U labasi -d postgres -c "CREATE DATABASE labasi;"

echo "Database reset complete. Restart the backend to seed demo data."
