#!/bin/bash

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "Error: $1 is not installed. Installing it now..."
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get -y install "$1" > /dev/null 2>&1
  fi
}

start_postgres_server() {
  if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "Starting PostgreSQL server..."
    sudo service postgresql start
    sleep 5
  fi
}

# Check if wget and psql commands are available
check_command "wget"
check_command "psql"

# Download and install the latest version of PostgreSQL
echo "Downloading and installing PostgreSQL..."

RELEASE=$(lsb_release -cs)
echo "deb http://apt.postgresql.org/pub/repos/apt/ $RELEASE-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update > /dev/null 2>&1
sudo apt-get -y install postgresql > /dev/null 2>&1

start_postgres_server

# Create dashboard database
DB_NAME="dashboard_storage"
echo "Creating the database $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null


SQL_FILE="dashboard_schema.sql"

echo "Creating table cdn_distributions..."
sudo -u postgres psql $DB_NAME -f "$SQL_FILE"

echo "Database and table created successfully."

exit 0