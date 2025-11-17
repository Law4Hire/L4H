$programPath = "C:/programming/L4HProject/src/api/Program.cs"
$content = Get-Content $programPath -Raw

# 1. Uncomment FluentValidation using statements
$content = $content -replace '// using FluentValidation;', 'using FluentValidation;'
$content = $content -replace '//  using FluentValidation.AspNetCore;', 'using FluentValidation.AspNetCore;'
$content = $content -replace '// using L4H.Api.Validators;', 'using L4H.Api.Validators;'

# 2. Uncomment FluentValidation service registrations
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<SignupRequest>, SignupRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<SignupRequest>, SignupRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<CreateApprovedDoctorRequest>, CreateApprovedDoctorRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<CreateApprovedDoctorRequest>, CreateApprovedDoctorRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<CreateWorkflowRequest>, CreateWorkflowRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<CreateWorkflowRequest>, CreateWorkflowRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<CreateWorkflowStepRequest>, CreateWorkflowStepRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<CreateWorkflowStepRequest>, CreateWorkflowStepRequestValidator>();'
$content = $content -replace '// builder\.Services\.AddScoped<IValidator<CreateWorkflowDoctorRequest>, CreateWorkflowDoctorRequestValidator>\(\);', 'builder.Services.AddScoped<IValidator<CreateWorkflowDoctorRequest>, CreateWorkflowDoctorRequestValidator>();'

$content = $content -replace '// builder\.Services\.AddFluentValidationAutoValidation\(\);', 'builder.Services.AddFluentValidationAutoValidation();'
$content = $content -replace '// builder\.Services\.AddValidatorsFromAssemblyContaining<Program>\(\);', 'builder.Services.AddValidatorsFromAssemblyContaining<Program>();'

# 3. Add OpenAPI registration (replace commented Swagger section)
$oldSwagger = '// Swagger temporarily disabled due to OpenAPI package compatibility issues in \.NET 10 RC\s+// Will be re-enabled when Swashbuckle supports \.NET 10 or we migrate to Microsoft\.AspNetCore\.OpenApi\s+// builder\.Services\.AddEndpointsApiExplorer\(\);'
$newOpenAPI = @'
// Swagger re-enabled using .NET 10 native OpenAPI
builder.Services.AddOpenApi();

// builder.Services.AddEndpointsApiExplorer();
'@
$content = $content -replace $oldSwagger, $newOpenAPI

# 4. Enable OpenAPI middleware
$oldMiddleware = '// Configure the HTTP request pipeline\s+// Swagger temporarily disabled due to OpenAPI package compatibility issues in \.NET 10 RC\s+// if \(app\.Environment\.IsDevelopment\(\)\)\s+// \{\s+//     app\.UseSwagger\(\);\s+//     app\.UseSwaggerUI\(\);\s+// \}'
$newMiddleware = @'
// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
'@
$content = $content -replace $oldMiddleware, $newMiddleware

Set-Content $programPath -Value $content -NoNewline
Write-Host "All fixes applied successfully!"
