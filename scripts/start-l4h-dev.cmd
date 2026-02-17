@echo off
echo 🚀 Starting L4H Development Server...
echo.

REM Check if we're in the right directory
if exist "web\l4h" (
    echo ✅ Found web\l4h directory
    cd web\l4h
) else if exist "l4h" (
    echo ✅ Found l4h directory  
    cd l4h
) else (
    echo ❌ Cannot find L4H directory
    echo Please run this script from the project root
    pause
    exit /b 1
)

echo 📁 Working directory: %CD%

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found
    pause
    exit /b 1
)

echo ✅ Found package.json

REM Install dependencies if needed
if not exist "node_modules" (
    echo ⚠️ Installing dependencies...
    npm install
)

REM Build shared-ui
if exist "..\shared-ui" (
    echo 🔧 Building shared-ui...
    pushd ..\shared-ui
    npm run build
    popd
)

REM Start the server
echo.
echo 🌐 Starting development server...
echo The site will be available at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev