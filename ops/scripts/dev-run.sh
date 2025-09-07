#!/bin/bash

echo -e "\033[32mStarting L4H API development server...\033[0m"

# Change to API directory
cd src/api

# Restore dependencies
echo -e "\033[33mRestoring dependencies...\033[0m"
dotnet restore

if [ $? -ne 0 ]; then
    echo -e "\033[31mFailed to restore dependencies\033[0m"
    exit 1
fi

# Build the project
echo -e "\033[33mBuilding project...\033[0m"
dotnet build

if [ $? -ne 0 ]; then
    echo -e "\033[31mBuild failed\033[0m"
    exit 1
fi

# Run the project
echo -e "\033[33mStarting API server...\033[0m"
dotnet run