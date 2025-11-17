# Fix [JsonIgnore] attributes - put them on the line before the property

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

        # Read all lines
        $lines = Get-Content $filePath

        # Process lines
        $newLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]

            # Remove lines that are just [JsonIgnore] followed by backtick-n
            if ($line -match '^\s*\[JsonIgnore\]``n\s*$') {
                continue
            }

            # Check if this is a navigation property line
            if ($line -match 'public (ICollection<|Attorney\?|Case\?|User\?|VisaType\?|Package\?)') {
                # Add [JsonIgnore] before this line
                $indent = if ($line -match '^(\s+)') { $matches[1] } else { '    ' }
                $newLines += "$indent[JsonIgnore]"
            }

            $newLines += $line
        }

        Set-Content $filePath -Value $newLines
        Write-Host "  Fixed $entity" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
