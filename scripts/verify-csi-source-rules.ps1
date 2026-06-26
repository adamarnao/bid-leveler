Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$requiredFolders = @(
  "docs/source-rules/csi-catalog-normalization",
  "docs/source-rules/csi-crosswalk-normalization"
)

$requiredFiles = @(
  "docs/source-rules/csi-catalog-normalization/README.md",
  "docs/source-rules/csi-catalog-normalization/CSI_CATALOG_NORMALIZATION_SPEC.md",
  "docs/source-rules/csi-catalog-normalization/csiCatalogNormalizationSource.ts",
  "docs/source-rules/csi-crosswalk-normalization/README.md",
  "docs/source-rules/csi-crosswalk-normalization/CSI_CROSSWALK_NORMALIZATION_SPEC.md",
  "docs/source-rules/csi-crosswalk-normalization/csiCrosswalkNormalizationSource.ts"
)

$catalogSpecPath = "docs/source-rules/csi-catalog-normalization/CSI_CATALOG_NORMALIZATION_SPEC.md"
$crosswalkSpecPath = "docs/source-rules/csi-crosswalk-normalization/CSI_CROSSWALK_NORMALIZATION_SPEC.md"

$catalogRequiredPhrases = @(
  "one normalized active catalog per supported MasterFormat version",
  "raw source files are development evidence only",
  "production release must use properly licensed CSI/MasterFormat source material",
  "source-agnostic",
  "runtime app must not depend directly on raw PDFs",
  "Division 00",
  "incomplete_source"
)

$crosswalkRequiredPhrases = @(
  "CSI Crosswalk Excel.xlsx is raw relationship evidence only",
  "raw imported values must be preserved",
  "resolvedTargetCode",
  "relationshipType",
  "relationshipRole",
  "cardinality",
  "reviewStatus",
  "issueType",
  "over_broad_parent_target",
  "02775",
  "32 10 00",
  "32 16 23",
  "no numeric confidence percentages",
  "keyword index terms are search metadata only"
)

$typescriptSourceFiles = @(
  "docs/source-rules/csi-catalog-normalization/csiCatalogNormalizationSource.ts",
  "docs/source-rules/csi-crosswalk-normalization/csiCrosswalkNormalizationSource.ts"
)

$missingFolders = New-Object System.Collections.Generic.List[string]
$missingFiles = New-Object System.Collections.Generic.List[string]
$missingPhrases = New-Object System.Collections.Generic.List[string]
$missingExports = New-Object System.Collections.Generic.List[string]

function Get-RepoPath {
  param([Parameter(Mandatory = $true)][string] $RelativePath)

  return Join-Path $repoRoot $RelativePath
}

function Test-ContentIncludes {
  param(
    [Parameter(Mandatory = $true)][string] $Content,
    [Parameter(Mandatory = $true)][string] $Phrase
  )

  return $Content.IndexOf($Phrase, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

foreach ($folder in $requiredFolders) {
  if (-not (Test-Path -LiteralPath (Get-RepoPath $folder) -PathType Container)) {
    $missingFolders.Add($folder)
  }
}

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Get-RepoPath $file) -PathType Leaf)) {
    $missingFiles.Add($file)
  }
}

if (Test-Path -LiteralPath (Get-RepoPath $catalogSpecPath) -PathType Leaf) {
  $catalogSpec = Get-Content -LiteralPath (Get-RepoPath $catalogSpecPath) -Raw

  foreach ($phrase in $catalogRequiredPhrases) {
    if (-not (Test-ContentIncludes -Content $catalogSpec -Phrase $phrase)) {
      $missingPhrases.Add("${catalogSpecPath}: ${phrase}")
    }
  }
}

if (Test-Path -LiteralPath (Get-RepoPath $crosswalkSpecPath) -PathType Leaf) {
  $crosswalkSpec = Get-Content -LiteralPath (Get-RepoPath $crosswalkSpecPath) -Raw

  foreach ($phrase in $crosswalkRequiredPhrases) {
    if (-not (Test-ContentIncludes -Content $crosswalkSpec -Phrase $phrase)) {
      $missingPhrases.Add("${crosswalkSpecPath}: ${phrase}")
    }
  }
}

foreach ($sourceFile in $typescriptSourceFiles) {
  $sourcePath = Get-RepoPath $sourceFile

  if (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
    $sourceContent = Get-Content -LiteralPath $sourcePath -Raw

    if ($sourceContent -notmatch "\bexport\s+(const|type|interface|enum|function)\b") {
      $missingExports.Add($sourceFile)
    }
  }
}

$hasFailures =
  $missingFolders.Count -gt 0 -or
  $missingFiles.Count -gt 0 -or
  $missingPhrases.Count -gt 0 -or
  $missingExports.Count -gt 0

if ($hasFailures) {
  Write-Host "FAIL"

  if ($missingFolders.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing folders:"
    foreach ($item in $missingFolders) {
      Write-Host "- $item"
    }
  }

  if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing files:"
    foreach ($item in $missingFiles) {
      Write-Host "- $item"
    }
  }

  if ($missingPhrases.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing required phrases:"
    foreach ($item in $missingPhrases) {
      Write-Host "- $item"
    }
  }

  if ($missingExports.Count -gt 0) {
    Write-Host ""
    Write-Host "TypeScript source files without exports:"
    foreach ($item in $missingExports) {
      Write-Host "- $item"
    }
  }

  exit 1
}

Write-Host "PASS"
exit 0
