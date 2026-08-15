#!/usr/bin/env pwsh
param(
    [ValidateSet('All', 'Python', 'TypeScript', 'DotNet', 'Go', 'Java')]
    [string]$Language = 'All'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$Runner = Join-Path $RepoRoot '.github\scripts\run-all-create-index.ps1'
$EvidenceTimestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$EvidenceDir = Join-Path $RepoRoot ".github\scripts\output\validation-$EvidenceTimestamp"
$ConsoleLog = Join-Path $EvidenceDir 'run-all-create-index.txt'
$ValidationLog = Join-Path $EvidenceDir 'validation-summary.txt'

$Samples = @(
    [PSCustomObject]@{ Language = 'Python';     Directory = 'nosql-create-index-python';     RunFile = 'run-python.txt' },
    [PSCustomObject]@{ Language = 'TypeScript'; Directory = 'nosql-create-index-typescript'; RunFile = 'run-typescript.txt' },
    [PSCustomObject]@{ Language = 'DotNet';     Directory = 'nosql-create-index-dotnet';     RunFile = 'run-dotnet.txt' },
    [PSCustomObject]@{ Language = 'Go';         Directory = 'nosql-create-index-go';         RunFile = 'run-go.txt' },
    [PSCustomObject]@{ Language = 'Java';       Directory = 'nosql-create-index-java';       RunFile = 'run-java.txt' }
)
$SelectedSamples = @($Samples | Where-Object { $Language -eq 'All' -or $_.Language -eq $Language })

function Get-TimestampDirectories {
    param([string]$OutputDirectory)

    if (-not (Test-Path -LiteralPath $OutputDirectory -PathType Container)) {
        return @()
    }

    return @(
        Get-ChildItem -LiteralPath $OutputDirectory -Directory |
            Where-Object { $_.Name -match '^(?:create-index-run-|run-)\d{8}-\d{6}$' } |
            Select-Object -ExpandProperty Name
    )
}

function Get-FinalMarkdownTable {
    param([string]$Path)

    $lines = @(Get-Content -LiteralPath $Path)
    $separatorIndexes = @()
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match '^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$') {
            $separatorIndexes += $index
        }
    }

    if ($separatorIndexes.Count -eq 0) {
        throw 'No Markdown table separator was found.'
    }

    $separatorIndex = $separatorIndexes[-1]
    if ($separatorIndex -eq 0 -or $lines[$separatorIndex - 1] -notmatch '^\s*\|') {
        throw 'The final Markdown table has no header row.'
    }

    $header = @(
        $lines[$separatorIndex - 1].Trim().Trim('|').Split('|') |
            ForEach-Object { $_.Trim() }
    )
    $rows = [System.Collections.Generic.List[object]]::new()

    for ($index = $separatorIndex + 1; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -notmatch '^\s*\|') {
            break
        }

        $cells = @(
            $lines[$index].Trim().Trim('|').Split('|') |
                ForEach-Object { $_.Trim() }
        )
        $rows.Add($cells)
    }

    if ($rows.Count -eq 0) {
        throw 'The final Markdown table has no data rows.'
    }

    return [PSCustomObject]@{
        Header = $header
        Rows = $rows
        Text = (($header -join ' ') + ' ' + (($rows | ForEach-Object { $_ -join ' ' }) -join ' '))
    }
}

function Test-OutputTable {
    param(
        [string]$ActualPath,
        [string]$ReferencePath
    )

    $issues = [System.Collections.Generic.List[string]]::new()

    try {
        $reference = Get-FinalMarkdownTable -Path $ReferencePath
    }
    catch {
        $issues.Add("Reference output is invalid: $($_.Exception.Message)")
        return $issues
    }

    try {
        $actual = Get-FinalMarkdownTable -Path $ActualPath
    }
    catch {
        $issues.Add("Generated output is invalid: $($_.Exception.Message)")
        return $issues
    }

    if ($actual.Header.Count -ne $reference.Header.Count) {
        $issues.Add("Expected $($reference.Header.Count) table columns but found $($actual.Header.Count).")
    }
    if ($actual.Rows.Count -ne $reference.Rows.Count) {
        $issues.Add("Expected $($reference.Rows.Count) table rows but found $($actual.Rows.Count).")
    }

    foreach ($row in $actual.Rows) {
        if ($row.Count -ne $actual.Header.Count) {
            $issues.Add("A table row has $($row.Count) cells; expected $($actual.Header.Count).")
            break
        }
    }

    foreach ($token in @('DiskANN', 'Quantized', 'Cosine', 'DotProduct', 'Euclidean')) {
        if ($actual.Text -notmatch [regex]::Escape($token)) {
            $issues.Add("Final table is missing '$token'.")
        }
    }

    return $issues
}

if (-not (Test-Path -LiteralPath $Runner -PathType Leaf)) {
    throw "Runner not found: $Runner"
}

$before = @{}
foreach ($sample in $SelectedSamples) {
    $outputDirectory = Join-Path $RepoRoot "$($sample.Directory)\output"
    $before[$sample.Language] = @(Get-TimestampDirectories -OutputDirectory $outputDirectory)
}

$null = New-Item -ItemType Directory -Force -Path $EvidenceDir
Write-Host "Capturing complete run output in $ConsoleLog" -ForegroundColor Cyan

& pwsh -NoProfile -File $Runner -Language $Language 2>&1 |
    Tee-Object -FilePath $ConsoleLog
$runnerExitCode = $LASTEXITCODE

$results = [System.Collections.Generic.List[object]]::new()
foreach ($sample in $SelectedSamples) {
    $outputDirectory = Join-Path $RepoRoot "$($sample.Directory)\output"
    $newTimestamps = @(
        Get-TimestampDirectories -OutputDirectory $outputDirectory |
            Where-Object { $_ -notin $before[$sample.Language] } |
            Sort-Object -Descending
    )

    if ($newTimestamps.Count -eq 0) {
        $results.Add([PSCustomObject]@{
            Language = $sample.Language
            Passed = $false
            Output = '(not created)'
            Details = 'No new timestamped output directory was created.'
        })
        continue
    }

    $actualPath = Join-Path $outputDirectory "$($newTimestamps[0])\$($sample.RunFile)"
    $referencePath = Join-Path $outputDirectory 'sample-output.txt'
    if (-not (Test-Path -LiteralPath $actualPath -PathType Leaf)) {
        $results.Add([PSCustomObject]@{
            Language = $sample.Language
            Passed = $false
            Output = $actualPath
            Details = 'The expected generated run log was not created.'
        })
        continue
    }
    if (-not (Test-Path -LiteralPath $referencePath -PathType Leaf)) {
        $results.Add([PSCustomObject]@{
            Language = $sample.Language
            Passed = $false
            Output = $actualPath
            Details = "Reference output not found: $referencePath"
        })
        continue
    }

    $issues = @(Test-OutputTable -ActualPath $actualPath -ReferencePath $referencePath)
    $results.Add([PSCustomObject]@{
        Language = $sample.Language
        Passed = ($issues.Count -eq 0)
        Output = $actualPath
        Details = if ($issues.Count -eq 0) { 'Final results table matches the reference structure.' } else { $issues -join ' ' }
    })
}

$summary = [System.Collections.Generic.List[string]]::new()
$summary.Add("Create-index validation run: $EvidenceTimestamp")
$summary.Add("Runner exit code: $runnerExitCode")
$summary.Add('')
foreach ($result in $results) {
    $status = if ($result.Passed) { 'PASS' } else { 'FAIL' }
    $summary.Add("$status  $($result.Language)")
    $summary.Add("  Output: $($result.Output)")
    $summary.Add("  $($result.Details)")
}

$allPassed = $runnerExitCode -eq 0 -and $results.Count -eq $SelectedSamples.Count -and
    @($results | Where-Object { -not $_.Passed }).Count -eq 0
$summary.Add('')
if ($allPassed) {
    if ($Language -eq 'All') {
        $summary.Add('All five create-index samples passed.')
    }
    else {
        $summary.Add("Create-index sample passed: $Language.")
    }
}
else {
    $summary.Add('Create-index sample validation failed.')
}

$summary | Set-Content -LiteralPath $ValidationLog -Encoding utf8
$summary | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Validation report: $ValidationLog" -ForegroundColor Cyan

if (-not $allPassed) {
    exit 1
}
