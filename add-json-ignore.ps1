# Add JsonIgnore to entity navigation properties

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
        Write-Host "Processing $entity..." -ForegroundColor Cyan

        $content = Get-Content $filePath -Raw

        # Add using statement if not already present
        if ($content -notmatch 'using System\.Text\.Json\.Serialization;') {
            $content = $content -replace '(using L4H\.[^;]+;)', '$1`nusing System.Text.Json.Serialization;'
        }

        # Add [JsonIgnore] to all ICollection properties
        $content = $content -replace '(\s+)(public ICollection<[^>]+> \w+ \{ get; set; \})', '$1[JsonIgnore]`n$1$2'

        # Add [JsonIgnore] to navigation properties (properties of entity types)
        $content = $content -replace '(\s+)(public (Attorney|Case|User|VisaType|Package)\? \w+ \{ get; set; \})', '$1[JsonIgnore]`n$1$2'

        Set-Content $filePath -Value $content -NoNewline
        Write-Host "  Updated $entity" -ForegroundColor Green
    } else {
        Write-Host "  File not found: $entity" -ForegroundColor Red
    }
}

Write-Host "Done!" -ForegroundColor Green
