# Fix missing using statements in entity files

$entityPath = "C:/programming/L4HProject/src/infrastructure/Entities"
$entityFiles = Get-ChildItem -Path $entityPath -Filter "*.cs"

foreach ($file in $entityFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match '\[JsonIgnore\]' -and $content -notmatch 'using System\.Text\.Json\.Serialization') {
        Write-Host "Adding using statement to $($file.Name)..." -ForegroundColor Yellow
        
        # Add the using statement after the last using statement
        $content = $content -replace '(using [^;]+;\s*)\n(namespace)', "`$1`nusing System.Text.Json.Serialization;`n`n`$2"
        
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
