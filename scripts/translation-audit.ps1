# Translation Audit PowerShell Script
# Detects English text in non-English translation files

param(
    [string]$OutputFormat = "console", # console, json, csv
    [string]$Severity = "all", # all, high, medium, low
    [switch]$Detailed
)

# Common English indicators
$EnglishWords = @(
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'cannot', 'not', 'no', 'yes', 'please', 'thank',
    'thanks', 'welcome', 'hello', 'hi', 'goodbye', 'bye', 'sorry', 'excuse', 'help', 'support',
    'login', 'logout', 'password', 'username', 'email', 'phone', 'address', 'name', 'first',
    'last', 'middle', 'submit', 'cancel', 'save', 'delete', 'edit', 'update', 'create', 'new',
    'search', 'filter', 'sort', 'page', 'next', 'previous', 'back', 'home', 'dashboard',
    'profile', 'settings', 'account', 'user', 'admin', 'client', 'case', 'document', 'file',
    'upload', 'download', 'print', 'export', 'import', 'report', 'billing', 'invoice',
    'payment', 'amount', 'total', 'date', 'time', 'status', 'active', 'inactive', 'pending',
    'approved', 'rejected', 'completed', 'error', 'success', 'warning', 'info', 'message',
    'notification', 'alert', 'confirm', 'confirmation', 'required', 'optional', 'invalid',
    'valid', 'loading', 'processing', 'please wait', 'try again', 'contact us'
)

$EnglishPhrases = @(
    'please enter', 'click here', 'try again', 'contact us', 'learn more',
    'get started', 'sign up', 'log in', 'forgot password', 'remember me',
    'terms of service', 'privacy policy', 'all rights reserved'
)

$Issues = @()
$Stats = @{
    FilesScanned = 0
    IssuesFound = 0
    LanguagesAudited = @()
}

function Test-EnglishContent {
    param(
        [string]$Text,
        [string]$FilePath,
        [string]$KeyPath
    )
    
    $LocalIssues = @()
    
    if ([string]::IsNullOrWhiteSpace($Text) -or $Text -match '^\{\{.*\}\}$') {
        return $LocalIssues
    }
    
    # Check for English words
    $Words = $Text.ToLower() -split '\s+' | ForEach-Object { $_ -replace '[^\w]', '' }
    $FoundEnglishWords = $Words | Where-Object { $EnglishWords -contains $_ }
    
    if ($FoundEnglishWords.Count -gt 0) {
        $LocalIssues += @{
            File = $FilePath
            Key = $KeyPath
            Value = $Text.Substring(0, [Math]::Min(100, $Text.Length))
            Type = 'ENGLISH_WORDS'
            Severity = 'MEDIUM'
            Details = "Contains English words: $($FoundEnglishWords -join ', ')"
        }
    }
    
    # Check for English phrases
    $LowerText = $Text.ToLower()
    $FoundPhrases = $EnglishPhrases | Where-Object { $LowerText.Contains($_) }
    
    if ($FoundPhrases.Count -gt 0) {
        $LocalIssues += @{
            File = $FilePath
            Key = $KeyPath
            Value = $Text.Substring(0, [Math]::Min(100, $Text.Length))
            Type = 'SUSPICIOUS_ENGLISH'
            Severity = 'HIGH'
            Details = "Contains English phrases: $($FoundPhrases -join ', ')"
        }
    }
    
    return $LocalIssues
}

function Test-TranslationObject {
    param(
        [object]$Object,
        [string]$FilePath,
        [string]$KeyPath = ""
    )
    
    foreach ($Key in $Object.PSObject.Properties.Name) {
        $Value = $Object.$Key
        $CurrentPath = if ($KeyPath) { "$KeyPath.$Key" } else { $Key }
        
        if ($Value -is [string]) {
            $Issues += Test-EnglishContent -Text $Value -FilePath $FilePath -KeyPath $CurrentPath
        }
        elseif ($Value -is [PSCustomObject]) {
            Test-TranslationObject -Object $Value -FilePath $FilePath -KeyPath $CurrentPath
        }
    }
}

function Test-TranslationFile {
    param([string]$FilePath)
    
    try {
        Write-Host "Scanning: $FilePath" -ForegroundColor Cyan
        
        $Content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $JsonObject = $Content | ConvertFrom-Json
        
        $Stats.FilesScanned++
        
        Test-TranslationObject -Object $JsonObject -FilePath $FilePath
    }
    catch {
        $Issues += @{
            File = $FilePath
            Key = ""
            Value = ""
            Type = 'FILE_ERROR'
            Severity = 'HIGH'
            Details = "Cannot parse JSON: $($_.Exception.Message)"
        }
    }
}

function Start-TranslationAudit {
    Write-Host "🔍 Starting Translation Audit..." -ForegroundColor Green
    Write-Host ""
    
    $TranslationDirs = @(
        'web/l4h/public/locales',
        'web/cannlaw/public/locales',
        'web/shared-ui/public/locales'
    )
    
    foreach ($Dir in $TranslationDirs) {
        if (Test-Path $Dir) {
            Get-ChildItem -Path $Dir -Recurse -Filter "*.json" | ForEach-Object {
                # Skip English files
                if ($_.FullName -notmatch 'en-US|en-CA') {
                    # Extract language code
                    $PathParts = $_.FullName -split [regex]::Escape([IO.Path]::DirectorySeparatorChar)
                    $LangCode = $PathParts | Where-Object { $_ -match '^[a-z]{2}-[A-Z]{2}$' }
                    
                    if ($LangCode -and $Stats.LanguagesAudited -notcontains $LangCode) {
                        $Stats.LanguagesAudited += $LangCode
                    }
                    
                    Test-TranslationFile -FilePath $_.FullName
                }
            }
        }
    }
    
    $Stats.IssuesFound = $Issues.Count
}

function Show-AuditReport {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Yellow
    Write-Host "📊 TRANSLATION AUDIT REPORT" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Yellow
    
    # Summary
    Write-Host ""
    Write-Host "📈 SUMMARY:" -ForegroundColor Green
    Write-Host "Files Scanned: $($Stats.FilesScanned)"
    Write-Host "Languages Audited: $($Stats.LanguagesAudited -join ', ')"
    Write-Host "Total Issues Found: $($Stats.IssuesFound)"
    
    # Issues by severity
    $IssuesBySeverity = $Issues | Group-Object Severity
    Write-Host ""
    Write-Host "🚨 ISSUES BY SEVERITY:" -ForegroundColor Red
    foreach ($Group in $IssuesBySeverity) {
        $Color = switch ($Group.Name) {
            'HIGH' { 'Red' }
            'MEDIUM' { 'Yellow' }
            'LOW' { 'White' }
            default { 'Gray' }
        }
        Write-Host "$($Group.Name): $($Group.Count) issues" -ForegroundColor $Color
    }
    
    # Detailed issues
    if ($Detailed -or $Issues.Count -le 20) {
        $IssuesByFile = $Issues | Group-Object File
        Write-Host ""
        Write-Host "📁 DETAILED ISSUES:" -ForegroundColor Cyan
        
        foreach ($FileGroup in $IssuesByFile) {
            Write-Host ""
            Write-Host "$($FileGroup.Name) ($($FileGroup.Count) issues):" -ForegroundColor White
            
            $FileGroup.Group | ForEach-Object -Begin { $i = 1 } -Process {
                $Color = switch ($_.Severity) {
                    'HIGH' { 'Red' }
                    'MEDIUM' { 'Yellow' }
                    'LOW' { 'White' }
                    default { 'Gray' }
                }
                Write-Host "  $i. [$($_.Severity)] $($_.Type)" -ForegroundColor $Color
                Write-Host "     Key: $($_.Key)"
                Write-Host "     Value: `"$($_.Value)`""
                Write-Host "     Issue: $($_.Details)"
                $i++
            }
        }
    }
    
    # Recommendations
    Write-Host ""
    Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Magenta
    if ($Stats.IssuesFound -eq 0) {
        Write-Host "✅ No issues found! Your translations look good." -ForegroundColor Green
    }
    else {
        Write-Host "1. Review HIGH severity issues first - these are likely untranslated English text"
        Write-Host "2. Check MEDIUM severity issues for potential translation problems"
        Write-Host "3. Consider using professional translation services for critical content"
        Write-Host "4. Implement translation validation in your CI/CD pipeline"
    }
}

function Export-AuditReport {
    param([string]$Format)
    
    $Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    
    switch ($Format.ToLower()) {
        'json' {
            $Report = @{
                timestamp = $Timestamp
                summary = $Stats
                issues = $Issues
            }
            $ReportPath = "translation-audit-report.json"
            $Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath -Encoding UTF8
            Write-Host "📄 JSON report saved to: $ReportPath" -ForegroundColor Green
        }
        'csv' {
            $ReportPath = "translation-audit-report.csv"
            $Issues | Export-Csv -Path $ReportPath -NoTypeInformation -Encoding UTF8
            Write-Host "📄 CSV report saved to: $ReportPath" -ForegroundColor Green
        }
    }
}

# Main execution
Start-TranslationAudit
Show-AuditReport

if ($OutputFormat -ne "console") {
    Export-AuditReport -Format $OutputFormat
}
