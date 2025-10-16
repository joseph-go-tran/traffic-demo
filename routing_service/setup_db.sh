#!/bin/bash
# Setup script for routing service database

echo "======================================"
echo "Routing Service Database Setup"
echo "======================================"
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
if ! pg_isready > /dev/null 2>&1; then
    echo "⚠ PostgreSQL is not running!"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    exit 1
fi
echo "✓ PostgreSQL is running"
echo ""

# Check if database exists
echo "Checking if database 'gos_routing' exists..."
DB_EXISTS=$(psql -U admin -lqt | cut -d \| -f 1 | grep -qw gos_routing && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
    echo "Creating database 'gos_routing'..."
    createdb -U admin gos_routing
    echo "✓ Database created"
else
    echo "✓ Database already exists"
fi
echo ""

# Run migrations
echo "Running database migrations..."
cd app
alembic upgrade head
cd ..
echo "✓ Migrations complete"
echo ""

# Test database
echo "Testing database connection and tables..."
python test_db.py

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
