#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Generate Prisma client if needed
if [ ! -f "node_modules/.prisma/client/index.js" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run seed script
echo "Seeding database..."
npx tsx prisma/seed.ts

# Start the application
echo "Starting application..."
npm start 
