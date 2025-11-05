# PowerShell build script for report.tex (Windows)
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BuildDir = Join-Path $ScriptDir 'build'
$Src = Join-Path $ScriptDir 'report.tex'
$Out = Join-Path $ScriptDir 'report.pdf'

if (-not (Test-Path $BuildDir)) { New-Item -ItemType Directory -Path $BuildDir | Out-Null }

function Run-Latexmk {
    latexmk -pdf -outdir=$BuildDir -pdflatex="pdflatex -interaction=nonstopmode -file-line-error" $Src
}

if (Get-Command latexmk -ErrorAction SilentlyContinue) {
    Run-Latexmk
    Copy-Item -Path (Join-Path $BuildDir 'report.pdf') -Destination $Out -Force
} else {
    pdflatex -interaction=nonstopmode -output-directory=$BuildDir $Src
    Push-Location $BuildDir
    biber report | Out-Null
    Pop-Location
    pdflatex -interaction=nonstopmode -output-directory=$BuildDir $Src
    pdflatex -interaction=nonstopmode -output-directory=$BuildDir $Src
    Copy-Item -Path (Join-Path $BuildDir 'report.pdf') -Destination $Out -Force
}

Write-Host "Built $Out"

