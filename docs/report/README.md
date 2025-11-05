Report build instructions

This folder contains the LaTeX source for the project report and a small build helper.

Files
- report.tex  : Main LaTeX source
- refs.bib    : Bibliography file
- build.sh    : POSIX shell build script (macOS / Linux)

Building

Run the POSIX build script. It will create artifacts in `docs/report/build/`.

```bash
cd docs/report
./build.sh
```

Notes
- The scripts prefer latexmk (recommended). If not present they fall back to pdflatex + biber + pdflatex.
- Intermediary build files are written to `docs/report/build/` which is ignored by git; only `report.pdf` and source files are tracked.

