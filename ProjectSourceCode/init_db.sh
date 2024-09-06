#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://sporthub_user:gedmbH68ZLEUPzoN0IrCXpaQCmwBIkHY@dpg-cqgj2c8gph6c73dt4lh0-a.oregon-postgres.render.com/sport_db_9lhk"

# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done