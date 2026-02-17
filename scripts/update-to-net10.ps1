# Update all .NET project files from net9.0 to net10.0
# This script updates TargetFramework and package versions for .NET 10 RC2

$projectFiles = Get-ChildItem -Path . -Recurse -Filter *.csproj

Write-Host "Found $($projectFiles.Count) project files to update..." -ForegroundColor Cyan

foreach ($file in $projectFiles) {
    Write-Host "`nUpdating: $($file.FullName)" -ForegroundColor Yellow

    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Update TargetFramework from net9.0 to net10.0
    $content = $content -replace '<TargetFramework>net9\.0</TargetFramework>', '<TargetFramework>net10.0</TargetFramework>'

    # Update Microsoft packages from 9.0.x to 10.0.3.x
    # EntityFrameworkCore packages
    $content = $content -replace 'Microsoft\.EntityFrameworkCore" Version="9\.0\.\d+"', 'Microsoft.EntityFrameworkCore" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.EntityFrameworkCore\.SqlServer" Version="9\.0\.\d+"', 'Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.EntityFrameworkCore\.Design" Version="9\.0\.\d+"', 'Microsoft.EntityFrameworkCore.Design" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.EntityFrameworkCore\.InMemory" Version="9\.0\.\d+"', 'Microsoft.EntityFrameworkCore.InMemory" Version="10.0.3.1"'

    # ASP.NET Core packages
    $content = $content -replace 'Microsoft\.AspNetCore\.Authentication\.JwtBearer" Version="9\.0\.\d+"', 'Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.3.4"'
    $content = $content -replace 'Microsoft\.AspNetCore\.OpenApi" Version="9\.0\.\d+"', 'Microsoft.AspNetCore.OpenApi" Version="10.0.3.4"'
    $content = $content -replace 'Microsoft\.AspNetCore\.Mvc\.Testing" Version="9\.0\.\d+"', 'Microsoft.AspNetCore.Mvc.Testing" Version="10.0.3.4"'

    # Extensions packages
    $content = $content -replace 'Microsoft\.Extensions\.Hosting" Version="9\.0\.\d+"', 'Microsoft.Extensions.Hosting" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.Extensions\.Http" Version="9\.0\.\d+"', 'Microsoft.Extensions.Http" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.Extensions\.Localization" Version="9\.0\.\d+"', 'Microsoft.Extensions.Localization" Version="10.0.3.4"'
    $content = $content -replace 'Microsoft\.Extensions\.Hosting\.Abstractions" Version="9\.0\.\d+"', 'Microsoft.Extensions.Hosting.Abstractions" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.Extensions\.Logging\.Abstractions" Version="9\.0\.\d+"', 'Microsoft.Extensions.Logging.Abstractions" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.Extensions\.Options" Version="9\.0\.\d+"', 'Microsoft.Extensions.Options" Version="10.0.3.1"'
    $content = $content -replace 'Microsoft\.Extensions\.Localization\.Abstractions" Version="9\.0\.\d+"', 'Microsoft.Extensions.Localization.Abstractions" Version="10.0.3.4"'
    $content = $content -replace 'Microsoft\.Extensions\.Configuration\.Abstractions" Version="9\.0\.\d+"', 'Microsoft.Extensions.Configuration.Abstractions" Version="10.0.3.1"'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated successfully" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Update complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: dotnet restore" -ForegroundColor White
Write-Host "2. Run: dotnet build" -ForegroundColor White
Write-Host "3. Run: dotnet test" -ForegroundColor White
