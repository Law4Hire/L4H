$programPath = "C:/programming/L4HProject/src/api/Program.cs"
$csprojPath = "C:/programming/L4HProject/src/api/L4H.Api.csproj"

# 1. Remove Validators exclusion from csproj
$csproj = Get-Content $csprojPath -Raw
$csproj = $csproj -replace '  <ItemGroup>\s+<Compile Remove="Validators\\\*\*" />\s+</ItemGroup>\s+\r?\n', ''
Set-Content $csprojPath -Value $csproj -NoNewline

# 2. Fix Program.cs
$content = Get-Content $programPath -Raw

# Un comment FluentValidation
$content = $content -replace '// using FluentValidation;', 'using FluentValidation;'
$content = $content -replace '// using FluentValidation.AspNetCore;', 'using FluentValidation.AspNetCore;'
$content = $content -replace '// using L4H.Api.Validators;', 'using L4H.Api.Validators;'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator', 'builder.Services.AddScoped<IValidator'
$content = $content -replace '// builder\.Services\.AddFluentValidationAutoValidation', 'builder.Services.AddFluentValidationAutoValidation'
$content = $content -replace '// builder\.Services\.AddValidatorsFromAssemblyContaining', 'builder.Services.AddValidatorsFromAssemblyContaining'

# Add OpenAPI
$content = $content -replace '// Swagger temporarily disabled due to OpenAPI package compatibility issues in \.NET 10 RC\s+// Will be re-enabled when Swashbuckle supports \.NET 10 or we migrate to Microsoft\.AspNetCore\.OpenApi\s+// builder\.Services\.AddEndpointsApiExplorer\(\);', 'builder.Services.AddOpenApi();'

$content = $content -replace '// if \(app\.Environment\.IsDevelopment\(\)\)\s+// \{\s+//     app\.UseSwagger\(\);\s+//     app\.UseSwaggerUI\(\);\s+// \}', 'if (app.Environment.IsDevelopment()) { app.MapOpenApi(); }'

Set-Content $programPath -Value $content -NoNewline

Write-Host "Done!" -ForegroundColor Green
