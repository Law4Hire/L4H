$programPath = "C:/programming/L4HProject/src/api/Program.cs"
$content = Get-Content $programPath -Raw

# Replace simple AddOpenAPI() with configured version including Scalar
$content = $content -replace 'builder\.Services\.AddOpenApi\(\);', @'
// Swagger/OpenAPI re-enabled with Scalar
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info.Title = "L4H API";
        document.Info.Version = "v1";
        document.Info.Description = "Law4Hire Immigration Services API";
        return Task.CompletedTask;
    });
});

// Configure JSON options to handle circular references
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.MaxDepth = 128;
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
'@

# Update the MapOpenApi middleware to also include Scalar
$content = $content -replace 'if \(app\.Environment\.IsDevelopment\(\)\) \{ app\.MapOpenApi\(\); \}', @'
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Scalar UI at /scalar
}
'@

Set-Content $programPath -Value $content -NoNewline
Write-Host "Scalar and OpenAPI configuration added successfully!" -ForegroundColor Green
