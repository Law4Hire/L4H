# Clean up [JsonIgnore] attributes - remove malformed ones

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
        Write-Host "Cleaning $entity..." -ForegroundColor Cyan

        # Read all lines
        $lines = Get-Content $filePath

        # Process lines - remove lines with backtick-n
        $newLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]

            # Skip lines that contain backtick-n
            if ($line -match '``n') {
                continue
            }

            $newLines += $line
        }

        Set-Content $filePath -Value $newLines
        Write-Host "  Cleaned $entity" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
