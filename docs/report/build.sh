#!/usr/bin/env bash
set -euo pipefail

# Build script for report.tex (POSIX-compatible)
# Writes intermediate files into docs/report/build/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
SRC="$SCRIPT_DIR/report.tex"
OUT="$SCRIPT_DIR/report.pdf"

mkdir -p "$BUILD_DIR"

# Use latexmk if available
if command -v latexmk >/dev/null 2>&1; then
  latexmk -pdf -outdir="$BUILD_DIR" -pdflatex="pdflatex -interaction=nonstopmode -file-line-error" "$SRC"
  # copy final pdf to folder root
  cp "$BUILD_DIR/report.pdf" "$OUT"
else
  # Fallback: pdflatex + biber
  pdflatex -interaction=nonstopmode -output-directory="$BUILD_DIR" "$SRC"
  (cd "$BUILD_DIR" && biber report) || true
  pdflatex -interaction=nonstopmode -output-directory="$BUILD_DIR" "$SRC"
  pdflatex -interaction=nonstopmode -output-directory="$BUILD_DIR" "$SRC"
  cp "$BUILD_DIR/report.pdf" "$OUT"
fi

echo "Built $OUT"

