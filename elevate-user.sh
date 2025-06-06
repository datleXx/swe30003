#!/bin/bash

# Check if email parameter is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <user_email>"
  echo "Example: $0 user@example.com"
  exit 1
fi

EMAIL=$1

# Check if docker-compose is running
if ! docker-compose ps | grep -q "db"; then
  echo "Starting database container..."
  docker-compose up -d db
  
  # Wait for database to be ready
  echo "Waiting for database to be ready..."
  sleep 5
fi

# Execute SQL to update user role
echo "Elevating permissions for user: $EMAIL"
docker-compose exec db psql -U postgres -d swe30003 -c "UPDATE \"User\" SET role = 'admin' WHERE email = '$EMAIL';"

# Check if the update was successful
if [ $? -eq 0 ]; then
  echo "Permissions elevated successfully for $EMAIL"
  echo "User now has admin role"
else
  echo "Failed to elevate permissions. User may not exist."
fi 
