#Requires -RunAsAdministrator

param (
    [string]$action
)

$api_dir = "src\api"
$frontend_dir = "web\l4h"
$pid_file = "pids.txt"

function Start-App {
    # Start the API
    Push-Location $api_dir
    $api_process = Start-Process dotnet -ArgumentList "run" -PassThru
    Pop-Location

    # Start the frontend
    Push-Location $frontend_dir
    $frontend_process = Start-Process cmd -ArgumentList "/c npm run dev" -PassThru
    Pop-Location

    # Save the PIDs
    "$($api_process.Id)" | Out-File -FilePath $pid_file
    "$($frontend_process.Id)" | Add-Content -Path $pid_file

    Write-Host "Application started with PIDs: $($api_process.Id), $($frontend_process.Id)"
}

function Stop-App {
    if (Test-Path $pid_file) {
        $pids = Get-Content $pid_file
        foreach ($pid_item in $pids) {
            Stop-Process -Id $pid_item -Force
        }
        Remove-Item $pid_file
        Write-Host "Application stopped."
    } else {
        Write-Host "PID file not found. The application may not be running."
    }
}

switch ($action) {
    "start" { Start-App }
    "stop" { Stop-App }
    default { Write-Host "Invalid action. Use 'start' or 'stop'." }
}
