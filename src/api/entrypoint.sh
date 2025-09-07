#!/bin/sh

# Check if --migrate flag is provided
if [ "$1" = "--migrate" ]; then
    echo "Running database migrations..."
    dotnet ef database update -p L4H.Infrastructure -s L4H.Api
    if [ $? -eq 0 ]; then
        echo "Database migrations completed successfully."
    else
        echo "Database migrations failed."
        exit 1
    fi
    shift # Remove --migrate from arguments
fi

# Start the application
echo "Starting L4H API..."
exec dotnet L4H.Api.dll "$@"
