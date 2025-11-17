# Fix literal backtick-n in entity files

$entities = @(
    "User.cs",
    "Case.cs",
    "VisaType.cs",
    "Package.cs",
    "Appointment.cs",
    "FormField.cs",
    "FormTemplate.cs",
    "InterviewSession.cs",
    "Invoice.cs",
    "MessageThread.cs",
    "ServiceCategory.cs",
    "WorkflowVersion.cs"
)

foreach ($entity in $entities) {
    $filePath = "C:/programming/L4HProject/src/infrastructure/Entities/$entity"

    if (Test-Path $filePath) {
        Write-Host "Fixing $entity..." -ForegroundColor Cyan

        $content = Get-Content $filePath -Raw

        # Remove literal backtick-n
        $content = $content -replace '``n', "`n"

        Set-Content $filePath -Value $content -NoNewline
        Write-Host "  Fixed $entity" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
