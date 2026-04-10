# Session 5 Prompt — DataOps Suite: Ingest Wizard, Datasets, UI Overhaul

**Commit:** `75de970` — 31 files changed, 138,964 insertions, 51 deletions

---

## What Was Built

Build the DataOps Suite application at route `/apps/dataops` — a 4-step Ingest Wizard with LLM-powered quality checks and metadata generation, 12 synthetic industry datasets (500 rows each), a Data Catalog placeholder, an Obfuscation Service placeholder, and a full UI overhaul of the landing page. All components must use the Fuse React template's component library (FuseSvgIcon, DataTable, PageBreadcrumb, FusePageSimple, motion animations) — zero emoji, zero raw HTML tables, compact finance-dashboard-style spacing throughout.

---

## FILE-BY-FILE DETAILS

---

### 1. `src/app/(control-panel)/apps/dataops/types.ts` (266 lines, NEW)

Central type definitions for the entire DataOps Suite.

**Industry Tags (13 total):**
- `INDUSTRY_TAGS` const array: `LUXURY_RESALE`, `FINTECH`, `ECOMMERCE`, `HR`, `EDTECH`, `HEALTHCARE`, `SUPPLY_CHAIN`, `MARKETING`, `IOT`, `PROPTECH`, `MEDIA`, `WEB3`, `OTHER`
- `IndustryTag` — union type derived from the const array
- `INDUSTRY_LABELS` — Record mapping each tag to human-readable label (e.g. `LUXURY_RESALE` → `"Luxury Resale"`)
- `INDUSTRY_COLORS` — Record mapping each tag to a hex color (e.g. `LUXURY_RESALE` → `#9C27B0`)

**Dataset Schema & Catalog Interfaces:**
- `DatasetColumn` — `{ name, inferredType: 'STRING'|'INTEGER'|'FLOAT'|'BOOLEAN'|'DATE'|'ENUM'|'ID'|'URL'|'IMAGE_URL', nullable, sampleValues }`
- `DataRow` — `Record<string, unknown>`
- `DatasetFile` — `{ metadata: { name, industryTag, description, rowCount, createdAt }, rows: DataRow[] }`
- `DataClassification` — `'PII' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC'`
- `PiiType` — `'DIRECT_IDENTIFIER' | 'QUASI_IDENTIFIER' | 'SENSITIVE_ATTRIBUTE'`
- `PiiColumnInfo` — `{ column, piiType, confidence }`
- `DatasetLineage` — `{ upstreamDatasets: string[], transformationQuery: string|null, description }`
- `DatasetCatalogEntry` — full catalog record: `{ datasetId, name, industryTag, description, filePath, schema, rowCount, classification, piiColumns, owner, team, domain, lastUpdated, tags, lineage, statistics: { completeness, qualityScore }, publishedToCatalog }`

**Quality Report Interfaces:**
- `IssueSeverity` — `'CRITICAL' | 'WARNING' | 'INFO'`
- `IssueType` — union of 12 types: `NULL_RATE`, `DUPLICATE`, `DUPLICATE_KEY`, `TEMPORAL`, `COMPUTED_DRIFT`, `REFERENTIAL`, `FORMAT`, `OUTLIER`, `SCHEMA_COMPLETENESS`, `NEGATIVE_VALUE`, `SEMANTIC`, `BUSINESS_LOGIC`
- `QualityIssue` — `{ column, issueType, severity, description, affectedRowCount, recommendation }`
- `ColumnHealth` — `{ column, nullRate, uniqueRate, healthScore }`
- `QualityReport` — `{ qualityScore, totalIssues, criticalCount, warningCount, infoCount, issues[], columnHealth[], checkedAt }`

**Metadata Generation Interfaces:**
- `ObfuscationRule` — `'KEEP' | 'FORMAT_PRESERVE' | 'HASH' | 'NULLIFY' | 'GENERALIZE'`
- `RegulatoryFlag` — `'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'FERPA' | 'NONE'`
- `ColumnMetadata` — per-column metadata: `{ columnName, description, businessMeaning, dataType, isPii, piiType, piiConfidence, exampleValues, nullabilityBehavior, suggestedObfuscationRule, dataQualityNote, approved: boolean|null }`
- `GeneratedMetadata` — full dataset metadata: `{ datasetDescription, businessContext, dataClassification, classificationReasoning, piiColumns, columnMetadata[], lineage, suggestedTags, retentionPolicy, regulatoryFlags }`

**Wizard State:**
- `WizardStep` — `0 | 1 | 2 | 3`
- `WIZARD_STEP_LABELS` — `['Upload', 'Quality', 'Metadata', 'Publish']`
- `WizardContext` — full wizard state: `{ step, datasetName, industryTag, sqlQuery, schema, rows, qualityReport, generatedMetadata, owner, tags, classificationOverride }`
- `INITIAL_WIZARD_CONTEXT` — default initial state with all fields empty/null

**Sample Dataset Registry:**
- `SampleDataset` interface — `{ name, industryTag, fileName, label }`
- `SAMPLE_DATASETS` const array — 12 entries mapping each industry to its JSON file in `data/dataops/datasets/`

---

### 2. `data/dataops/datasets/` (12 JSON files, ~134,620 lines total, ALL NEW)

12 synthetic datasets, each with 500 rows and ~15% intentional quality issues. Each file structure: `{ metadata: { name, industryTag, description, rowCount, createdAt }, rows: [...] }`.

| File | Industry Tag | Key Columns | Quality Issues Seeded |
|------|-------------|-------------|----------------------|
| `trx_product_listings.json` | LUXURY_RESALE | listingId, brand, category, condition, originalRetailPrice, listingPrice, discount_pct, imageUrl, sellerId, authenticationStatus, listedAt, soldAt, daysToSell | Temporal inversions (soldAt < listedAt), null conditionNotes, outlier prices |
| `fin_transactions.json` | FINTECH | transactionId, accountId, type (DEPOSIT/WITHDRAWAL/TRANSFER/PAYMENT), amount, currency, merchantName, merchantCategory, isFraudulent, customerEmail, customerPhone, ipAddress | Negative amounts, format violations on email/phone, duplicate transactions |
| `ecom_orders.json` | ECOMMERCE | orderId, customerId, customerEmail, shippingAddress, items, totalAmount, quantity, unitPrice, orderDate, deliveredDate, returnStatus | Computed drift (totalAmount ≠ quantity × unitPrice), temporal inversions |
| `hr_employees.json` | HR | employeeId, firstName, lastName, email, ssn, phone, department, title, salary, bonus, equityGrant, hireDate, terminationDate, performanceRating, managerId | SSN format violations, referential integrity (managerId → employeeId), salary outliers |
| `edu_students.json` | EDTECH | studentId, firstName, lastName, email, enrollmentDate, graduationDate, gpa, major, financialAidAmount, advisorId | Temporal inversions (graduation < enrollment), GPA outliers |
| `health_appointments.json` | HEALTHCARE | appointmentId, patientId, patientName, dateOfBirth, diagnosisCode, billingAmount, insuranceCovered, patientResponsibility, provider | Computed drift (patientResponsibility ≠ billingAmount - insuranceCovered), ICD-10 format violations, billingAmount < insuranceCovered |
| `inv_inventory.json` | SUPPLY_CHAIN | itemId, sku, warehouseId, quantityOnHand, quantityReserved, quantityAvailable, unitCost, sellingPrice, reorderPoint, expiryDate, isHazardous | Computed drift (quantityAvailable ≠ onHand - reserved), sellingPrice < unitCost, negative quantities |
| `mktg_campaigns.json` | MARKETING | campaignId, campaignName, channel, impressions, clicks, conversions, spend, budget, revenue, ctr, cvr, roas, startDate, endDate | Computed drift (ctr ≠ clicks/impressions), conversions > clicks (impossible), spend > budget |
| `iot_sensor_readings.json` | IOT | readingId, deviceId, sensorType, value, unit, timestamp, anomalyScore, location, firmware | Outlier sensor values, anomalyScore outliers |
| `real_estate_listings.json` | PROPTECH | listingId, address, city, state, zipCode, listingPrice, squareFeet, pricePerSqFt, bedrooms, bathrooms, yearBuilt, schoolDistrict, listingDate, soldDate | Computed drift (pricePerSqFt ≠ listingPrice/squareFeet), zip code format violations, temporal inversions |
| `streaming_events.json` | MEDIA | eventId, userId, contentId, contentTitle, contentType, durationMinutes, watchedMinutes, completionRate, timestamp, device, region | watchedMinutes > durationMinutes (impossible), computed drift (completionRate ≠ watched/duration) |
| `crypto_trades.json` | WEB3 | tradeId, walletAddress, pair, side, quantity, priceAtTrade, totalValue, gasFee, txHash, exchange, timestamp | Computed drift (totalValue ≠ quantity × priceAtTrade), negative gas fees |

---

### 3. `data/dataops/catalog.json` (525 lines, NEW)

Master catalog index with full metadata for all 12 datasets. Array of `DatasetCatalogEntry` objects. Each entry includes:
- `datasetId` (ds-001 through ds-012)
- Full `schema` array matching the dataset columns
- `classification` (PII for datasets with SSN/email/phone, CONFIDENTIAL for financial, INTERNAL for operational, PUBLIC for IoT)
- `piiColumns` array with `piiType` and `confidence` per PII column
- `lineage` with upstream datasets and descriptions
- `statistics` with `completeness` and `qualityScore`
- `owner`, `team`, `domain`, `tags`, `lastUpdated`
- `publishedToCatalog: true`

---

### 4. `src/data/dataops` (symlink, NEW)

Symlink: `src/data/dataops` → `data/dataops` — enables Next.js dynamic imports via `@/data/dataops/datasets/[fileName]` from the wizard's sample dataset loader.

---

### 5. `src/app/(control-panel)/apps/dataops/DataOpsPage.tsx` (197 lines, REWRITTEN)

Landing page for the DataOps Suite. Previously a basic placeholder.

**Layout:** `FusePageSimple` with styled `Root` component. Header uses `PageBreadcrumb` + title + subtitle.

**Impact Metrics (4 cards):** Grid of `Paper` cards with `FuseSvgIcon` icons:
- Datasets Cataloged: 12 (`heroicons-outline:circle-stack`)
- Industries Covered: 12 (`heroicons-outline:globe-alt`)
- Metadata Accuracy: 99% (`heroicons-outline:sparkles`)
- Annual Savings: $1.2M (`heroicons-outline:currency-dollar`)

**Service Cards (3):** MUI `Card` with `CardContent` + `CardActions`, colored left accent border (`sx: borderLeft: 3px solid ${accent}`):
- Ingest Wizard → `/apps/dataops/ingest` (accent: `#3b82f6` blue)
- Data Catalog → `/apps/dataops/catalog` (accent: `#8b5cf6` purple)
- Obfuscation Service → `/apps/dataops/obfuscation` (accent: `#10b981` green)
Each card: icon in colored background box, title, description, stats badge, "Open →" button.

**Animations:** `motion.div` with `containerVariants` (staggerChildren: 0.06) and `itemVariants` (opacity 0→1, y 12→0, duration 0.3) on both metrics and service card grids.

---

### 6. `src/app/(control-panel)/apps/dataops/ingest/IngestWizardPage.tsx` (144 lines, NEW)

Wizard shell — manages state and renders the 4 steps.

**State:** `useState<WizardContext>` initialized from `INITIAL_WIZARD_CONTEXT`. `updateCtx` callback merges partial updates. `goToStep` navigates between steps.

**Layout:** `FusePageSimple` with `PageBreadcrumb` header. Step indicators are inline `Chip` components (not MUI Stepper — too tall):
- Each step: `Chip` with `FuseSvgIcon` icon (14px)
- Icons: `cloud-arrow-up` (Upload), `shield-check` (Quality), `document-text` (Metadata), `rocket-launch` (Publish)
- Completed steps: `heroicons-solid:check-circle` icon, `color="success"`
- Active step: `variant="filled"`, `color="secondary"`, `fontWeight: 600`
- Pending steps: `variant="outlined"`, `color="default"`

**Step Transitions:** `AnimatePresence mode="wait"` wrapping `motion.div` with `key={ctx.step}`, opacity/y fade (0→1, 8→0 on enter; 0, -8 on exit), duration 0.2s.

**Step Rendering:** Conditional render based on `ctx.step` (0=UploadStep, 1=QualityStep, 2=MetadataStep, 3=PublishStep). Each step receives `ctx`, `updateCtx`, `onNext`/`onBack` callbacks.

---

### 7. `src/app/(control-panel)/apps/dataops/ingest/UploadStep.tsx` (451 lines, NEW)

Wizard Step 1 — Upload dataset via file upload or sample dataset selection.

**Dataset Name + Industry Selector:** 2-column grid with:
- `TextField` for dataset name with `InputAdornment` → `FuseSvgIcon` `heroicons-outline:document-text`
- `FormControl`+`Select` for industry vertical with `InputAdornment` → `FuseSvgIcon` `heroicons-outline:building-office`
- Options populated from `INDUSTRY_TAGS` array with `INDUSTRY_LABELS` display

**File Drop Zone:** `Paper` with dashed border (`borderStyle: 'dashed', borderWidth: 2`):
- Drag states: `borderColor` changes to `secondary.main`, `backgroundColor` to `action.hover`
- Hover effect: `borderColor: secondary.light`, `transform: scale(1.005)`
- Center icon: `FuseSvgIcon` `heroicons-outline:cloud-arrow-up` size 48
- Loading state: `Skeleton` circular (48x48) + text (200px)
- File input: hidden `<input type="file" accept=".json,.csv">`
- `handleDrop` + `handleFileInput` → `handleFileRead` → `FileReader.readAsText`
- JSON parsing: `JSON.parse`, supports `Array` or `{ rows: [...] }` format
- CSV parsing: calls `parseCsv()` from `schemaUtils.ts`

**File Info Card:** Shows after upload — `Paper` with green check-circle icon, filename, row/column counts. `motion.div` fade-in.

**SQL Lineage Textarea:** Optional multiline `TextField` for SQL query. `InputAdornment` → `FuseSvgIcon` `heroicons-outline:code-bracket`. Stored in `ctx.sqlQuery`.

**Sample Dataset Quick-Load:** `Chip` buttons per industry from `SAMPLE_DATASETS` array. Each `Chip` has `FuseSvgIcon` `heroicons-outline:beaker` icon. `handleSampleLoad` uses dynamic import: `await import('@/data/dataops/datasets/${sample.fileName}')` → extracts `mod.default.rows`.

**Data Preview Table:** `DataTable<DataRow>` component (Fuse Material React Table wrapper):
- Columns generated from `ctx.schema` — each shows column name + `inferredType` in caption
- Data: first 10 rows (`ctx.rows.slice(0, 10)`)
- All interactive features disabled: `enableRowSelection=false`, `enablePagination=false`, `enableTopToolbar=false`, `enableBottomToolbar=false`, etc.
- `enableStickyHeader`, `density: 'compact'`, `maxHeight: 300`
- Null values show "—" in gray

**Next Button:** `Button` with `heroicons-outline:arrow-right` endIcon. Disabled until `canProceed` = rows.length > 0 AND datasetName not empty AND industryTag not empty. Label: "Run Quality Check".

**Schema Inference:** Calls `inferSchema(rows)` from `schemaUtils.ts` on data load. Updates `ctx.schema`.

---

### 8. `src/app/(control-panel)/apps/dataops/ingest/schemaUtils.ts` (128 lines, NEW)

Utility functions for schema inference and CSV parsing.

**`inferSchema(rows, sampleSize=10)`:** Examines first N rows to infer column types:
- Checks each column name and sample values
- ID detection: column name ends with `id` or `_id` → `'ID'`
- Boolean: `typeof first === 'boolean'` → `'BOOLEAN'`
- Number: all integers → `'INTEGER'`, mixed → `'FLOAT'`
- URL: matches `^https?://` → `'URL'`; also matches image extensions → `'IMAGE_URL'`
- Date: matches ISO date regex → `'DATE'`
- Enum: ≤6 unique values in ≥5 samples → `'ENUM'`
- Default: `'STRING'`
- Returns `DatasetColumn[]` with `{ name, inferredType, nullable, sampleValues }`

**`parseCsv(text)`:** Parses CSV text into `DataRow[]`:
- Splits by newline, first line = headers
- `parseCsvLine()` handles quoted fields (escaped double-quotes, commas inside quotes)
- Auto-type-coerces values: empty→null, "true"/"false"→boolean, numeric strings→number, else string
- Returns array of `Record<string, unknown>` keyed by header names

---

### 9. `src/app/(control-panel)/apps/dataops/ingest/QualityStep.tsx` (527 lines, NEW)

Wizard Step 2 — Quality Check: runs deterministic + LLM checks, displays report.

**Data Preview:** `DataTable<DataRow>` showing first 5 rows of dataset. Compact density, maxHeight 180px, all toolbars disabled.

**Quality Check Trigger:** `runQualityCheck()` — POST to `/api/dataops/quality-check` with `{ schema, rows (first 50), datasetName, industryTag }`. Auto-runs on mount via `useEffect` if no report exists. Tracks `responseTime` in ms.

**Loading State:** `motion.div` with:
- 5 `Paper` skeleton cards (2x5 grid) — circular skeleton (24px) + text skeletons mimicking score values
- `Paper` skeleton for column health section — 8 rounded skeleton blocks
- `Paper` skeleton for issues table — 5 text skeletons (height 36)

**Error State:** `Alert` severity="error" with "Retry" button calling `runQualityCheck()`.

**Score Summary Cards (5):** Grid of `Paper` cards, each with `FuseSvgIcon` + value + label:
- Quality Score (`heroicons-outline:star`) — color-coded: ≥80 green (#4caf50), ≥60 orange (#ff9800), <60 red (#f44336)
- Total Issues (`heroicons-outline:exclamation-triangle`)
- Critical (`heroicons-outline:x-circle`) — color="error"
- Warning (`heroicons-outline:exclamation-circle`) — hex=#ff9800
- Info (`heroicons-outline:information-circle`) — color="info"
- Values in `text-2xl font-bold`, labels in `variant="caption"` text.secondary

**AI-Enhanced Chip + Response Time:** `Chip` label="AI-Enhanced" with `AutoAwesomeIcon` (from `@mui/icons-material`), `color="secondary"`, `variant="outlined"`. Caption showing "Completed in X.Xs".

**Column Health Heatmap:** `Paper` with `FuseSvgIcon` `heroicons-outline:heart`. Flex-wrap grid of column name badges:
- Each: `div` with Tailwind color classes based on `healthScore`:
  - ≥90: green-100/green-900 background
  - ≥70: yellow-100/yellow-900
  - ≥50: orange-100/orange-900
  - <50: red-100/red-900
- `Tooltip` showing "Null rate: X% | Unique: X% | Score: X"

**Issues Table:** `DataTable<QualityIssue>` with 6 columns:
- Column (font-mono font-semibold)
- Issue Type (Chip outlined)
- Severity (Chip with color: CRITICAL=error, WARNING=warning, INFO=info)
- Description (plain text)
- Rows (affected count)
- Recommendation (plain text)
- Features: pagination (pageSize 10), sticky header, maxHeight 400, critical-only toggle via `Switch`, download CSV button with `FuseSvgIcon` `heroicons-outline:arrow-down-tray`

**Download CSV:** `downloadReport()` generates CSV from issues array, creates blob URL, triggers download as `{datasetName}_quality_report.csv`.

**Navigation:** Back button (arrow-left), Re-run Checks button (arrow-path, shown when report exists), Accept & Continue button (arrow-right, disabled until report loaded).

---

### 10. `src/app/(control-panel)/apps/dataops/ingest/MetadataStep.tsx` (746 lines, NEW)

Wizard Step 3 — LLM-powered metadata generation with approve/reject/edit per field.

**Metadata Generation:** `generateMetadata()` — POST to `/api/dataops/generate-metadata` with `{ schema, sampleRows (first 5), datasetName, sqlQuery, industryTag, qualityReport }`. Auto-runs on mount if no metadata exists.

**Loading State:** Two-panel skeleton layout (1/3 + 2/3 grid). Left: 6 text skeleton blocks. Right: 8 text skeletons (height 40).

**Two-Panel Layout:** `grid grid-cols-1 lg:grid-cols-3 gap-3`

**Left Panel (1 col) — Dataset-Level Metadata:** `Paper` with sections separated by `Divider`:

Each section has `FuseSvgIcon` (16px) + caption label + content:
1. **Description** (`heroicons-outline:document-text`) — editable text. Click pencil → multiline TextField + Save button. `updateDatasetField('datasetDescription', ...)`.
2. **Business Context** (`heroicons-outline:briefcase`) — same edit pattern.
3. **Classification** (`heroicons-outline:shield-check`) — `Chip` colored by classification (PII=error, CONFIDENTIAL=warning, else default) + reasoning caption.
4. **PII Columns** (`heroicons-outline:finger-print`) — count in header, flex-wrap `Chip` badges (color="warning" variant="outlined") with `Tooltip` showing piiType + confidence.
5. **Lineage** (`heroicons-outline:arrow-path`) — description text + upstream dataset chips.
6. **Suggested Tags** (`heroicons-outline:tag`) — flex-wrap `Chip` badges (variant="outlined").
7. **Retention Policy** (`heroicons-outline:clock`) — text.
8. **Regulatory Flags** (`heroicons-outline:flag`) — `Chip` badges (NONE=default, others=error variant="outlined").

Header shows `Chip` label="AI-Enhanced" with `AutoAwesomeIcon` + response time caption.

**Right Panel (2 cols) — Column Metadata Table:** `DataTable<ColumnMetadata>` with 7 columns:
- Column (font-mono font-semibold, size 130)
- Type (Chip outlined, size 100)
- Description (size 220) — inline edit: click pencil → TextField + check button. Tooltip shows businessMeaning.
- PII? (size 110) — PII columns show `Chip` with `heroicons-outline:finger-print` icon, piiType label, color="warning". Non-PII show "—".
- Confidence (size 90) — percentage for PII columns, "—" for others.
- Obfuscation (size 120) — `Chip` with suggestedObfuscationRule.
- Status (size 100) — approve/reject `IconButton` pair:
  - Approve: `heroicons-solid:check-circle` (green when approved) / `heroicons-outline:check-circle` (gray)
  - Reject: `heroicons-solid:x-circle` (red when rejected) / `heroicons-outline:x-circle` (gray)

Table header: "Column Metadata (N columns)" + "Regenerate" button (`heroicons-outline:arrow-path`) + "Approve All" button (`heroicons-solid:check-circle`).

PII rows highlighted: `muiTableBodyRowProps` applies `rgba(245, 158, 11, 0.05)` background when `isPii=true`.

Density: compact, pagination: 15 per page, maxHeight: 600px, sticky header.

**Navigation:** Back (arrow-left). Continue button disabled until `allReviewed` (every column has `approved !== null`). Shows progress: "Review all columns to continue (X/Y)".

---

### 11. `src/app/(control-panel)/apps/dataops/ingest/PublishStep.tsx` (516 lines, NEW)

Wizard Step 4 — Review and publish dataset to catalog.

**Published State (success):** `motion.div` with scale animation (0.9→1, duration 0.5):
- `FuseSvgIcon` `heroicons-solid:check-circle` size 64, color="success" with spring scale-up animation (delay 0.2, stiffness 200, damping 15)
- "Dataset Published Successfully" title
- Confirmation text with dataset name, classification, quality score
- Two buttons: "View in Catalog" (outlined, href=/apps/dataops/catalog) and "Ingest Another Dataset" (contained, resets full wizard context)
- `notistack` `enqueueSnackbar('Dataset published successfully!', { variant: 'success' })` on publish

**Pre-Publish State:** `motion.div` with containerVariants (staggered children):

**Publication Summary:** `Paper` with:
- Dataset Name card (full-width, `FuseSvgIcon` `heroicons-outline:document-text`)
- 2x3 stat card grid:
  - Industry (`heroicons-outline:building-office`) — from `INDUSTRY_LABELS`
  - Rows (`heroicons-outline:table-cells`) — `ctx.rows.length.toLocaleString()`
  - Columns (`heroicons-outline:view-columns`) — `ctx.schema.length`
  - Quality Score (`heroicons-outline:star`) — color-coded via `scoreColor()`
  - Classification (`heroicons-outline:shield-check`) — `Chip` colored by classification
  - PII Columns (`heroicons-outline:finger-print`) — count, warning color if >0
- Description section (`heroicons-outline:chat-bubble-left-right`)
- Regulatory Flags section (`heroicons-outline:flag`) — `Chip` per flag

**Publication Settings:** `Paper` with `heroicons-outline:cog-6-tooth`:
- Classification Override: `Select` with 4 options (PII/CONFIDENTIAL/INTERNAL/PUBLIC), `InputAdornment` shield-check icon. Updates `ctx.classificationOverride`.
- Owner: `TextField` with `InputAdornment` `heroicons-outline:user`. Placeholder: "e.g. data-platform-team".
- Tags: `TextField` for comma-separated tags, `InputAdornment` `heroicons-outline:tag`. Splits on comma, trims, filters empty.

**Navigation:** Back (arrow-left) + Publish to Catalog (contained, color="success", `heroicons-outline:rocket-launch` startIcon, size="large").

---

### 12. `src/app/(control-panel)/apps/dataops/catalog/CatalogPage.tsx` (62 lines, NEW)

Placeholder page for the Data Catalog.

`FusePageSimple` with `FuseSvgIcon` `heroicons-outline:book-open` (size 28, color="secondary") in header. Title: "Data Catalog". Subtitle: "Browse and explore published datasets...". Content: placeholder text with `motion.div` fade-in animation.

---

### 13. `src/app/(control-panel)/apps/dataops/obfuscation/ObfuscationPage.tsx` (47 lines, NEW)

Placeholder page for the Obfuscation Service.

`FusePageSimple` with title "Data Obfuscation", subtitle about HMAC-SHA256. Content: placeholder text.

---

### 14. Page Route Files (3 files, 3 lines each, ALL NEW)

- `src/app/(control-panel)/apps/dataops/ingest/page.tsx` — `export default IngestWizardPage`
- `src/app/(control-panel)/apps/dataops/catalog/page.tsx` — `export default CatalogPage`
- `src/app/(control-panel)/apps/dataops/obfuscation/page.tsx` — `export default ObfuscationPage`

---

### 15. `src/app/api/dataops/quality-check/route.ts` (525 lines, NEW)

POST `/api/dataops/quality-check` — Deterministic + LLM quality checks.

**Input:** `{ schema: Column[], rows: DataRow[], datasetName: string, industryTag: string }`

**10 Deterministic Checks (`runDeterministicChecks`):**

1. **NULL_RATE** — Per column. >20% null = CRITICAL, >5% = WARNING. Reports exact count/percentage.
2. **DUPLICATE** — Exact row duplicates via `JSON.stringify` comparison. WARNING severity.
3. **DUPLICATE_KEY** — ID columns (`*id`, `*_id`) must be unique. CRITICAL severity.
4. **TEMPORAL** — Date pair inversions. Scans for pattern pairs: start/end, placed/delivered, hire/termination, listed/sold, created/updated, enrollment/graduation, scheduled/actual, appointment/followUp. CRITICAL when end < start.
5. **COMPUTED_DRIFT** — Checks computed fields match source calculations:
   - Multiplication: totalAmount = quantity × unitPrice, totalValue = quantity × priceAtTrade
   - Subtraction: quantityAvailable = onHand - reserved, patientResponsibility = billing - insurance
   - Ratios: ctr = clicks/impressions, cvr = conversions/clicks, roas = revenue/spend, completionRate = watched/duration, pricePerSqFt = price/sqft
   - Tolerance: ±0.01. WARNING severity.
6. **REFERENTIAL** — Foreign key integrity for manager/advisor/seller ID patterns. Checks if FK values exist in parent PK column. WARNING severity.
7. **FORMAT** — Regex validation for: email (`^[^@]+@[^@]+\.[^@]+$`), phone (`(XXX) XXX-XXXX` or `XXX-XXX-XXXX`), SSN (`XXX-XX-XXXX`), zip code (`XXXXX` or `XXXXX-XXXX`), ICD-10 diagnosis code (`^[A-Z]\d{2}(\.\d{1,2})?$`). >5% violations = CRITICAL, else WARNING.
8. **OUTLIER** — Numeric columns, Z-score method: values beyond mean ± 3σ. Requires ≥10 values. INFO severity.
9. **SCHEMA_COMPLETENESS** — Columns with >50% null values. WARNING severity.
10. **NEGATIVE_VALUE** — Non-negative columns (amount, price, quantity, score, cost, fee, salary, etc.) with negative values. WARNING severity.

**Business Logic Checks (6 additional):**
- conversions > clicks (impossible) — CRITICAL
- watchedMinutes > durationMinutes — CRITICAL
- spend > budget — WARNING
- billingAmount < insuranceCovered — CRITICAL
- sellingPrice < unitCost (negative margin) — WARNING

**Column Health (`computeColumnHealth`):**
- Per column: `nullRate`, `uniqueRate`, `healthScore = max(0, 100 - nullRate×60 - (1-uniqueRate)×20)`

**Quality Score (`computeQualityScore`):**
- Starts at 100, deducts: CRITICAL=8, WARNING=3, INFO=1 per issue. Clamped to [0,100].

**LLM Semantic Checks:**
- Sends schema + first 20 rows + deterministic results to Claude Sonnet (`claude-sonnet-4-20250514`, max_tokens 1000)
- Prompt asks for 3-5 additional semantic issues: business logic violations, suspicious distributions, semantic mismatches, freshness concerns, industry-specific anomalies
- Parses JSON array from response
- Fails gracefully — returns deterministic results only if LLM fails

**Response:** Full `QualityReport` object.

---

### 16. `src/app/api/dataops/generate-metadata/route.ts` (111 lines, NEW)

POST `/api/dataops/generate-metadata` — LLM-powered metadata generation.

**Input:** `{ schema, sampleRows, datasetName, sqlQuery, industryTag, qualityReport }`

**LLM Call:** Claude Sonnet (`claude-sonnet-4-20250514`, max_tokens 8000). Prompt includes:
- Schema as compact string: `colName(TYPE,null)` format
- First 3 sample rows (truncated to 1500 chars)
- SQL query if provided
- Top 5 quality issues summary
- Requests full `GeneratedMetadata` JSON response

**Post-Processing:** Ensures all schema columns have metadata entries. If LLM missed any columns, fills gaps with auto-generated stubs (`approved: null`, `isPii: false`, `suggestedObfuscationRule: 'KEEP'`).

**Response:** Full `GeneratedMetadata` object.

---

### 17. `src/configs/navigationConfig.ts` (MODIFIED)

Changed DataOps from single `type: 'item'` to `type: 'collapse'` with 4 children:
- Ingest → `/apps/dataops/ingest`
- Catalog → `/apps/dataops/catalog`
- Obfuscation → `/apps/dataops/obfuscation`
- Quality Dashboard → `/apps/dataops`

---

### 18. `CLAUDE.md` (MODIFIED, +86 lines)

Updated APP 4: DATAOPS SUITE section with complete specification:
- Expanded from ~15 lines to ~100 lines
- Added 12 dataset descriptions with column details
- Added Ingest Wizard 4-step specification
- Added Catalog specification (6 tabs, search, chat)
- Added Obfuscation specification (HMAC-SHA256, format preservation rules, UI tabs)
- Added LLM API route specifications

---

## UI DESIGN PATTERNS USED

1. **Zero emoji** — all icons are `FuseSvgIcon` with `heroicons-outline:*` or `heroicons-solid:*`
2. **Zero raw HTML tables** — all use Fuse `DataTable` component (Material React Table wrapper)
3. **Compact spacing** — `p-3`/`gap-2`/`mb-2` throughout, never `mb-8`+, single-viewport content
4. **Loading states** — `Skeleton` components matching exact layout shape (not generic spinners)
5. **Animations** — `motion.div` from `motion/react` for staggered fade-in reveals
6. **AI labels** — `<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />`
7. **InputAdornment** — `FuseSvgIcon` icons on all form fields (search, name, owner, tags, etc.)
8. **Step indicators** — inline `Chip` components instead of MUI Stepper (too tall)
9. **Step transitions** — `AnimatePresence` + `motion.div` slide with opacity
10. **Page headers** — `PageBreadcrumb` + `FusePageSimple` (not FusePageCarded — creates gap)
11. **Color-coding** — quality scores, severity badges, health heatmap, classification chips all color-coded
12. **Toast notifications** — `notistack` `useSnackbar` for publish confirmation
