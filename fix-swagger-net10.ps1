$programPath = "C:/programming/L4HProject/src/api/Program.cs"
$content = Get-Content $programPath -Raw

# Replace Swagger configuration to use .NET 10 native OpenAPI
$swaggerConfig = @'
// Swagger re-enabled using .NET 10 native OpenAPI
builder.Services.AddOpenApi();
'@

$content = $content -replace '// Swagger re-enabled[\s\S]*?}\);', $swaggerConfig

# Replace app.UseSwagger() section
$appSwagger = @'
// Swagger UI re-enabled
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
'@

$content = $content -replace '// Swagger re-enabled\s+if \(app\.Environment\.IsDevelopment\(\)\)[\s\S]*?}', $appSwagger

Set-Content $programPath -Value $content -NoNewline
Write-Host "Updated to use .NET 10 native Open API"
