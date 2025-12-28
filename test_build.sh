#!/bin/bash
echo "Building project..."
dotnet build src/api/L4H.Api.csproj > build_and_test_output.txt 2>&1

echo "Running tests..."
dotnet test >> build_and_test_output.txt 2>&1
