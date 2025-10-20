# Insurance Gap Review – Lightweight (Vanilla JS)

A minimal, dependency-free web app to upload insurance documents (.pdf or .txt), extract coverage, and compare against Finnish baselines (health + home). Everything runs fully in the browser; files stay in memory and are not uploaded.

## Features
- Upload .pdf or .txt policy files (kept in memory only)
- PDF text extraction via PDF.js (CDN)
- Coverage extraction for:
  - Finnish basic healthcare baseline (STM-inspired)
  - Home insurance typical cover items
- Detected coverage vs gaps, with counts
- Click any detected item to open a modal reader with the original paragraph
- Industrial light theme with magnetic cards and buttons

## Run
Open directly from disk or serve locally.

- Direct open:
  - Open `static/vanilla/index.html` in your browser

- Local server (recommended):
  - PowerShell: `cd static/vanilla; npx serve -p 8080`
  - Open http://localhost:8080

## Files
- `index.html` – UI and styles
- `app.js` – logic and extractors

## Notes
- No build tools, no dependencies to install
- PDF extraction uses PDF.js from CDN
- Designed to push only this folder to GitHub

## License
MIT


