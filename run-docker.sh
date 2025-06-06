#!/bin/bash

# Build the Docker image
docker build -t swe30003-app .

# Create a Docker network if it doesn't exist
docker network create swe30003-network || true

# Run PostgreSQL container
docker run -d \
  --name swe30003-db \
  --network swe30003-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=swe30003 \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run the application container
docker run -d \
  --name swe30003-app \
  --network swe30003-network \
  -e DATABASE_URL=postgresql://postgres:postgres@swe30003-db:5432/swe30003 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=FH575ZjakYbed9wl+kE1xn9wXWy4FmaLtup6H2zDzSk= \
  -e NODE_ENV=production \
  -p 3000:3000 \
  swe30003-app

echo "Application is running at http://localhost:3000" 
