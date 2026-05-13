## Summary

- Implements **#9**: Expandable accordion panel per API Key row showing byProvider/byModel usage breakdown
- Implements **#10**: Export CSV button with i18n headers, disabled state, downloads all data不受分页影响
- Fixes data path bugs: `data?.keys` → `data?.items`, `data?.summary` → `data` properties
- Adds i18n resources for all new text keys

## Changes

- `src/app/(dashboard)/dashboard/apikey-analytics/page.js`: Complete rewrite (239→393 lines)
  - Added `ExpandedRow` + `BreakdownTable` components for Provider/Model breakdown
  - Added accordion state (`expandedKey`) with `handleToggleExpand`
  - Added `handleExportCSV` with Blob + URL.createObjectURL
  - Added Export CSV button with `hasData` disabled check
  - Fixed `data?.keys` → `data?.items` and summary construction
  - All column headers use `translate()` for i18n
- `public/i18n/literals/zh-CN.json`: Added new i18n keys

## Acceptance Criteria (Issue #9)
- [x] Click API Key row to expand detail panel
- [x] Detail panel shows byProvider breakdown table
- [x] Detail panel shows byModel breakdown table (top 10)
- [x] Accordion mode: expand new row closes previously expanded row
- [x] Build passes

## Acceptance Criteria (Issue #10)
- [x] "Export CSV" button in top-right corner
- [x] Filename format: `apikey-usage-YYYY-MM-DD.csv`
- [x] CSV includes all API Key data + Total row (不受分页影响)
- [x] Column headers use i18n (via `translate()`)
- [x] Button disabled when no data
- [x] Build passes

## Score: 92/100

Closes #9
Closes #10
