# Add [JsonIgnore] to navigation properties in entity files

$entityFiles = @(
    "User.cs", "Case.cs", "VisaType.cs", "Package.cs", "Appointment.cs",
    "FormField.cs", "FormTemplate.cs", "InterviewSession.cs", "Invoice.cs",
    "MessageThread.cs", "ServiceCategory.cs", "WorkflowVersion.cs",
    "Attorney.cs", "VisaRecommendation.cs", "RememberMeToken.cs",
    "PasswordResetToken.cs", "VisaChangeRequest.cs", "AvailabilityBlock.cs",
    "Message.cs", "DailyDigestQueue.cs", "EmailVerificationToken.cs",
    "UserSession.cs", "VisaEvaluation.cs"
)

foreach ($file in $entityFiles) {
    $path = "C:/programming/L4HProject/src/infrastructure/Entities/$file"
    
    if (Test-Path $path) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        $content = Get-Content $path -Raw
        
        # Add JsonIgnore import if not present
        if ($content -notmatch 'using System.Text.Json.Serialization') {
            $content = $content -replace '(using L4H\.[^;]+;)', "`$1`nusing System.Text.Json.Serialization;"
        }
        
        # Add [JsonIgnore] to navigation properties that are collections
        $content = $content -replace '(\s+)(public (?:virtual )?ICollection<[^>]+> [A-Z][a-zA-Z0-9_]*\s+\{)', "`$1[JsonIgnore]`n`$1`$2"
        
        # Add [JsonIgnore] to navigation properties that are single entities (common patterns)
        $content = $content -replace '(\s+)(public (?:virtual )?(?:User|Case|Attorney|Package|VisaType|Appointment|FormField|FormTemplate|InterviewSession|Invoice|MessageThread|ServiceCategory|WorkflowVersion|VisaRecommendation|RememberMeToken|PasswordResetToken|VisaChangeRequest|AvailabilityBlock|Message|DailyDigestQueue|EmailVerificationToken|UserSession|VisaEvaluation)\?? [A-Z][a-zA-Z0-9_]*\s+\{)', "`$1[JsonIgnore]`n`$1`$2"
        
        Set-Content $path -Value $content -NoNewline
        Write-Host "  Updated $file" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
