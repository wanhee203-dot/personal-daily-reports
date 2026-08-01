# Personal Daily Reports

Generate a 1080 px-wide daily-report PNG and single-page PDF from a fixed Markdown file.

## Requirements

- Windows
- Node.js 24 LTS
- npm
- Playwright Chromium

## Install

```powershell
Set-Location 'H:\Workshop\PDR\personal-daily-reports'
npm.cmd install
npx.cmd playwright install chromium
```

## Validate Markdown Only

```powershell
npm.cmd run report -- 'reports\source\2026\08\2026-08-01.md' --dry-run
```

## Generate PNG and PDF

```powershell
npm.cmd run report -- 'reports\source\2026\08\2026-08-01.md'
```

## Generate a 2x PNG

```powershell
npm.cmd run report -- 'reports\source\2026\08\2026-08-01.md' --scale 2
```

## Open the Output Directory

```powershell
npm.cmd run report -- 'reports\source\2026\08\2026-08-01.md' --open
```

## Force Regeneration

```powershell
npm.cmd run report -- 'reports\source\2026\08\2026-08-01.md' --force
```

## Output

```text
reports/rendered/2026/08/2026-08-01/
├── report.png
├── report.pdf
├── report.json
└── manifest.json
```

## Test

```powershell
npm.cmd run test:all
```

## Runtime Data Flow

```text
Markdown
→ strict parser
→ Zod validation
→ Report JSON
→ React/CSS
→ Playwright Chromium
→ PNG + PDF
```
