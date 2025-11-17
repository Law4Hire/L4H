$programPath = "C:/programming/L4HProject/src/api/Program.cs"
$content = Get-Content $programPath -Raw

# Replace the Swagger registration section (lines 58-89)
$content = $content -replace '// Swagger temporarily disabled due to OpenAPI package compatibility issues in \.NET 10 RC\s+// Will be re-enabled when Swashbuckle supports \.NET 10 or we migrate to Microsoft\.AspNetCore\.OpenApi\s+// builder\.Services\.AddEndpointsApiExplorer\(\);[\s\S]*?// \}\);', @'
// Swagger re-enabled
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "L4H API", Version = "v1" });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
'@

# Replace the Swagger middleware section (around line 319)
$content = $content -replace '// Configure the HTTP request pipeline\s+// Swagger temporarily disabled due to OpenAPI package compatibility issues in \.NET 10 RC\s+// if \(app\.Environment\.IsDevelopment\(\)\)\s+// \{\s+//     app\.UseSwagger\(\);\s+//     app\.UseSwaggerUI\(\);\s+// \}', @'
// Configure the HTTP request pipeline
// Swagger re-enabled
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
'@

Set-Content $programPath -Value $content -NoNewline
Write-Host "Swagger has been re-enabled in Program.cs"
