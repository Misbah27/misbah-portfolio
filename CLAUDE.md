# Misbahuddin Mohammed — Engineering Portfolio
# Claude Code Master Instructions
# Place this file at: /misbah-portfolio/CLAUDE.md
# Claude Code reads this at the start of every session automatically.

---

## WHO THIS IS FOR
Professional engineering portfolio for Misbahuddin Mohammed,
Senior Software Development Manager, 11+ years at Amazon. Audience is
Hiring Managers and Technical Recruiters at senior tech companies (L7+).
Goal: demonstrate real-world system design, ML/AI at scale, AWS expertise,
and the ability to enhance existing systems with modern LLM capabilities.

---

## PROJECT STRUCTURE
```
misbah-portfolio/
├── CLAUDE.md                          ← YOU ARE HERE
├── apps/
│   ├── inboundiq/                     ← App 1: Truck Prioritization
│   ├── freightlens/                   ← App 2: Freight Scheduling
│   ├── nova/                          ← App 3: Delay Alerts + Rescue
│   ├── dataops/                       ← App 4: LLM Data Tools
│   └── lofat/                         ← App 5: Delivery Fraud Detection
├── packages/
│   └── fuse-react-nextjs/             ← Envato UI template (READ THIS FIRST)
├── data/
│   ├── inboundiq/
│   ├── freightlens/
│   ├── nova/
│   ├── dataops/
│   └── lofat/
├── infrastructure/
│   └── aws/
├── docs/
│   ├── inboundiq/
│   ├── freightlens/
│   ├── nova/
│   ├── dataops/
│   ├── lofat/
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
└── .github/workflows/ci.yml
```

---

## UI TEMPLATE — READ BEFORE WRITING ANY COMPONENT

Template location: /packages/fuse-react-nextjs/

BEFORE writing any component in any session, you MUST:
1. Read /packages/fuse-react-nextjs/ directory structure
2. Read the theme config (tailwind.config.js or theme/ folder)
3. Read the layout components (FuseLayout or similar)
4. Read the navigation config (navigationConfig or FuseNavigation)
5. Read 2 example page components to understand patterns

HARD RULES — DISCOVERED THROUGH SESSION 11 ITERATION:
- ZERO emoji anywhere in the UI — all icons must be FuseSvgIcon with
  heroicons-outline:* or heroicons-solid:* icon names
- ZERO raw HTML tables — all tabular data uses Fuse DataTable component
  (Material React Table wrapper)
- ZERO MUI Stepper for wizard steps — use inline Chip components instead
  (Stepper is too tall and breaks single-viewport layout)
- Use FusePageSimple NOT FusePageCarded — Carded creates an unwanted gap
- Layout mode: fullwidth (not container) on all app pages
- No auth guard on any page — public portfolio
- Remove ALL Fuse boilerplate from toolbar: Configurator panel,
  theme switcher, language switcher, fullscreen toggle
- Compact spacing throughout: p-3/gap-2/mb-2, NEVER mb-8 or larger
- Loading states use Skeleton components matching exact layout shape —
  never generic spinners
- Animations: motion.div from motion/react with staggerChildren:0.06,
  itemVariants opacity 0→1, y 12→0, duration 0.3
- AI labels: <Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced"
  size="small" color="secondary" variant="outlined" />
  NOT "AI-Enhanced ✦" text — use the Chip component
- All form fields use InputAdornment with FuseSvgIcon icons
- Step transitions: AnimatePresence + motion.div slide with opacity
- Toast notifications: notistack useSnackbar (not custom toast)
- Page headers: PageBreadcrumb + FusePageSimple (consistent pattern)
- Color-coded quality/severity: CRITICAL=red, WARNING=amber, INFO=blue
- Navigation: collapse-type entries with children for multi-page apps
  (see DataOps navigationConfig: type:'collapse' with 4 children)

DATA FILE LOCATION PATTERN (discovered in Session 11):
- Synthetic data files live in /data/dataops/datasets/[fileName].json
- A symlink src/data/dataops → data/dataops enables Next.js imports
  via @/data/dataops/datasets/[fileName] from wizard sample loader
- Create the same symlink pattern for each app's data directory

Routes:
- Portfolio landing:  /
- InboundIQ:          /apps/inboundiq
- FreightLens:        /apps/freightlens
- Nova:               /apps/nova
- DataOps Suite:      /apps/dataops (collapse nav)
  ├── Ingest:         /apps/dataops/ingest
  ├── Catalog:        /apps/dataops/catalog
  ├── Obfuscation:    /apps/dataops/obfuscation
  └── Quality:        /apps/dataops (landing = quality dashboard)
- LoFAT:              /apps/lofat

---

## TECH STACK

- Framework:   Next.js 14+ App Router (from Fuse template)
- Language:    TypeScript STRICT MODE — zero `any` types
- Styling:     Tailwind CSS via Fuse template config only
- LLM:         Anthropic API (claude-sonnet-4-20250514)
- Charts:      Recharts
- Maps:        React Leaflet (critical for LoFAT and InboundIQ)
- Icons:       Lucide React (check if Fuse includes it first)
- Hosting:     AWS Amplify
- Domain:      Route53 custom domain
- CI/CD:       GitHub Actions → Amplify auto-deploy
- Data:        Synthetic JSON files in /data/ — NO database

---

## SYNTHETIC DATA RULES

ALL data must be US-based and fictional but realistic.

US Fulfillment Centers:
  SEA1=Seattle WA | PDX2=Portland OR | LAX3=Los Angeles CA
  SFO1=San Francisco CA | ORD2=Chicago IL | JFK4=New York NY
  DFW3=Dallas TX | ATL1=Atlanta GA | BOS2=Boston MA | MIA1=Miami FL

US Truck plates: WA-ABC1234, OR-XYZ5678, CA-DEF9012
Carrier SCAC: UPSN, FXFE, ODFL, SAIA, RDWY, ABFS, CNWY
VRID formats: 1141XPHH, 115X5X7LL, 1132QJQS6
Lane formats: SEA1→PDX2, ORD2→JFK4, LAX3→DFW3

LoFAT delivery zones (US cities only):
  Seattle metro: zips 98101-98125
  Chicago metro: zips 60601-60640
  Los Angeles metro: zips 90001-90045

NEVER use real Amazon data. NEVER use India region data.

---

## LLM INTEGRATION RULES

API key: ANTHROPIC_API_KEY from environment — NEVER hardcode
Model: claude-sonnet-4-20250514
Max tokens: 1000 for most routes — EXCEPTION: generate-metadata uses 8000
  (metadata generation requires large JSON output covering all columns)
API routes: /apps/[appname]/app/api/

Every LLM feature MUST have:
1. Skeleton loading state matching exact layout shape (not generic spinner)
2. Error boundary with friendly fallback message
3. Retry button on failure
4. AI label as MUI Chip: <Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced"
   size="small" color="secondary" variant="outlined" />
5. Response time displayed after generation

LLM fails gracefully — always return deterministic results if LLM call fails.
Never block the UI on LLM failure.

Standard API route pattern:
```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000, // use 8000 for generate-metadata
      messages: [{ role: 'user', content: buildPrompt(body) }]
    });
    return Response.json({
      result: response.content[0].type === 'text' ? response.content[0].text : ''
    });
  } catch (error) {
    return Response.json({ error: 'LLM request failed' }, { status: 500 });
  }
}
```

---

## APP 1: INBOUNDIQ (Heimdall)
Route: /apps/inboundiq
Achievement: Reduced truck TAT from 6.7 → 2.2 hours

Domain: Dock door allocation engine. Each FC has 10-15 dock doors (scarce
resource). System ranks trucks in the yard so ops knows which truck gets
the next available door — replacing all manual decision-making.

Pages: Dashboard | Analytics | Map | About

Truck data model — 3 categories in trucks.json:

CheckedIn (at dock, actively unloading):
  rank=null, dockDoor=assigned(1-15 unique per FC), unloadingEta=valid ISO,
  dwellHours=null, checkinTime=valid ISO, precheckinTime=valid ISO

Arrived/PreCheckin (in yard, waiting — THE RANKED ONES):
  rank=1-N per FC, dockDoor=null, unloadingEta=null,
  dwellHours=valid float, checkinTime=null, precheckinTime=valid ISO

Scheduled (en route, not yet at FC):
  rank=null, dockDoor=null, all times=null,
  arrivalStatus=ON_TIME|EARLY|EXPECTED only (not DELAYED/LATE)

Common fields: vehicleNo, isaVrid, apptType(CARP|AMZL|SPD|HOT),
slotHours, dmStatus, scheduleTime, arrivalStatus, sidelineRemarks,
units, cartons, stowDate, stowTimeRemaining, lowInstockPct(0-80), fcId

lowInstockPct = how critically FC shelves need this cargo (0-80%).
Higher = more urgent. Heaviest weight in ranking model.

Ranking model (yard trucks only):
Priority = lowInstockPct(0.35) + apptType(0.25, HOT=100/SPD=75/CARP=50/AMZL=40)
         + dwellHours(0.20) + stowUrgency(0.12) + arrivalStatus(0.08)

FC door counts: SEA1=14, PDX2=12, LAX3=13, ORD2=11, JFK4=10
FC truck counts: SEA1=40, PDX2=30, LAX3=30, ORD2=25, JFK4=25

Dashboard layout:
- FusePageSimple fullwidth with rightSidebarContent (~420px permanent)
- No Fuse boilerplate (no Configurator, theme switcher, language switcher)
- No auth guard — public portfolio

Main area — Yard Queue table (Arrived/PreCheckin only):
Rank(gold/silver/bronze #1-3) | Vehicle No | ISA/VRID | Appt Type(chip,
HOT=red) | Low Instock %(color-coded) | Arrival Status | Dwell Hours
(Xh Ym, amber>12h, red>24h) | Units | Cartons | Slot hrs |
Stow Time Left | Schedule Time | Pre-Checkin | Sideline Remarks | AI Insight
Subtitle: "Yard Queue (X of Y trucks waiting for dock)"
Scheduled trucks NOT shown on this page.

Right sidebar — Dock Status Panel:
Header: "Dock Status — X/Y doors occupied"
Occupied doors: Door#, Vehicle No, Appt Type chip, Unloading ETA, countdown
Available doors: green tint, "Available" label
Sorted by ETA ascending (soonest to free up at top)
AI Dock Intelligence panel at bottom (LLM feature 3)

LLM features:
1. "Why Ranked #N? ✦" icon button per row → /api/inboundiq/explain-rank
   Popover anchored to row. References actual ranking weights.
2. NL Yard Filter toolbar → /api/inboundiq/nl-filter
   Returns JSON array of matching isaVrid strings only.
3. Dock Intelligence toggle in sidebar → /api/inboundiq/dock-intelligence
   Contextual recommendations referencing specific doors + truck IDs.
4. Ask the Yard chat drawer (380px, slides over content) → /api/inboundiq/chat
   Context: yardTrucks + dockedTrucks + FC state. 3 seed question chips.

---

## APP 2: FREIGHTLENS (Daily Freight Tracker)
Route: /apps/freightlens
Achievement: Visibility across 100+ FCs, eliminated manual sheets, 500hrs/month saved

Pages: Rolling 21 Days | Standing Appointments | FC Metric | Admin Portal

Rolling 21 Days: FC rows × date columns, color-coded cells (red=over capacity,
green=available), metrics (BM Portal/Vendor Scheduled/SA Blocked/SA Scheduled/
SA Units Left/Total Units Left/%), multi-FC select, CSV export.

Standing Appointments: FC | Vendor (PCP/PSP) | Breakdown (Blocked/Scheduled) | dates

FC Metric: Planned Capacity, Total Scheduled Qty, NCNS%, Vendor Receipts,
End Backlog, Max NYR, Backlog/safety backlog, Pallet Count, Hot POs,
DS Allocation%, NS Allocation%

Admin Portal: FC dropdown, Metrics dropdown, units input, date picker, submit

Data: rolling21.json | standing.json | metrics.json | appointments.json

LLM features:
1. Scheduling Risk Analyzer → /api/freightlens/risk-analysis
2. NL metric query → /api/freightlens/nl-query
3. Capacity Forecast Summary → /api/freightlens/forecast-summary

---

## APP 3: NOVA (Delay Alert + Rescue Planner)
Route: /apps/nova
Achievement: Real-time linehaul delay visibility, automated rescue planning

Sidebar: Delay Alert | Celestia | Rescue Planner | Nova Metrics

Delay Alert: LH/MR tabs, 4 summary cards, table (VRID|Lane|Destination|Zone|
SCAC|Reason Coded By|Delay Hours pill|Planned Yard Time|ETA), VRID search.
Delay Hours: green pill=0hrs, red pill=>0hrs with value shown.

Rescue Planner 5 tabs: Home/Dashboard | Edit | Plan | Check | Follow Up
Role selector: Internal NOC | Line-haul Associate | ATS Surface

Data: delay-alerts.json (150 vehicles) | rescues.json (50 records)
Lane formats: SEA1→PDX2, ORD2→JFK4, LAX3→DFW3, BOS2→ATL1

LLM features:
1. Delay Intelligence Brief (auto-loads) → /api/nova/delay-brief
2. Rescue Recommendation Engine → /api/nova/rescue-recommend
3. NL delay query → /api/nova/nl-filter
4. Executive Summary generator → /api/nova/exec-summary

---

## APP 4: DATAOPS SUITE
Route: /apps/dataops (collapse nav with 4 children)
Original tools: Conversational Data Catalog + Automated Metadata Generation
+ Data Obfuscation Service (Amazon PX Central Science team)
Key achievements: 60% team efficiency increase, 99% metadata accuracy,
$1.2M annual savings, 99.9% availability

WHAT SESSION 11 BUILT — DO NOT REBUILD IN SESSION 12:
- types.ts: all TypeScript interfaces (DatasetColumn, DataRow, DatasetFile,
  DatasetCatalogEntry, QualityReport, QualityIssue, ColumnHealth,
  GeneratedMetadata, ColumnMetadata, WizardContext, INITIAL_WIZARD_CONTEXT,
  SAMPLE_DATASETS, INDUSTRY_TAGS, INDUSTRY_LABELS, INDUSTRY_COLORS)
- 12 synthetic datasets in /data/dataops/datasets/ (500 rows each,
  ~15% intentional quality issues per dataset)
- /data/dataops/catalog.json (12 entries, publishedToCatalog:true,
  datasetId ds-001 through ds-012)
- Symlink: src/data/dataops → data/dataops
- DataOpsPage.tsx: landing with 4 metric Paper cards + 3 service Cards
  with colored left-border accents (blue/purple/green)
- IngestWizardPage.tsx: 4-step wizard using inline Chip step indicators
  (NOT MUI Stepper), AnimatePresence slide transitions
  Step 1: drag-drop, industry selector, SQL textarea, 12 sample buttons
  Step 2: QualityReport display — score card, issues DataTable, heatmap
  Step 3: GeneratedMetadata display — approve/reject/edit per column
  Step 4: classification override, owner, tags, publish button
- CatalogPage.tsx: PLACEHOLDER — build in Session 12
- ObfuscationPage.tsx: PLACEHOLDER — build in Session 12
- POST /api/dataops/quality-check: BUILT. 10 deterministic + 5 business
  logic + LLM semantic. Graceful fallback if LLM fails.
- POST /api/dataops/generate-metadata: BUILT. max_tokens 8000.
  Post-processes to fill any columns LLM missed.
- navigationConfig: DataOps as type:'collapse' 4 children

SESSION 11 ACTUAL COLUMN NAMES (use exactly, do not invent new ones):
trx_product_listings  LUXURY_RESALE  listingId,brand,category,condition,
  originalRetailPrice,listingPrice,discount_pct,imageUrl,sellerId,
  authenticationStatus,listedAt,soldAt,daysToSell
fin_transactions      FINTECH        transactionId,accountId,type,amount,
  currency,merchantName,merchantCategory,isFraudulent,customerEmail,
  customerPhone,ipAddress
ecom_orders           ECOMMERCE      orderId,customerId,customerEmail,
  shippingAddress,items,totalAmount,quantity,unitPrice,orderDate,
  deliveredDate,returnStatus
hr_employees          HR             employeeId,firstName,lastName,email,
  ssn,phone,department,title,salary,bonus,equityGrant,hireDate,
  terminationDate,performanceRating,managerId
edu_students          EDTECH         studentId,firstName,lastName,email,
  enrollmentDate,graduationDate,gpa,major,financialAidAmount,advisorId
health_appointments   HEALTHCARE     appointmentId,patientId,patientName,
  dateOfBirth,diagnosisCode,billingAmount,insuranceCovered,
  patientResponsibility,provider
inv_inventory         SUPPLY_CHAIN   itemId,sku,warehouseId,quantityOnHand,
  quantityReserved,quantityAvailable,unitCost,sellingPrice,reorderPoint,
  expiryDate,isHazardous
mktg_campaigns        MARKETING      campaignId,campaignName,channel,
  impressions,clicks,conversions,spend,budget,revenue,ctr,cvr,roas,
  startDate,endDate
iot_sensor_readings   IOT            readingId,deviceId,sensorType,value,
  unit,timestamp,anomalyScore,location,firmware
real_estate_listings  PROPTECH       listingId,address,city,state,zipCode,
  listingPrice,squareFeet,pricePerSqFt,bedrooms,bathrooms,yearBuilt,
  schoolDistrict,listingDate,soldDate
streaming_events      MEDIA          eventId,userId,contentId,contentTitle,
  contentType,durationMinutes,watchedMinutes,completionRate,timestamp,
  device,region
crypto_trades         WEB3           tradeId,walletAddress,pair,side,
  quantity,priceAtTrade,totalValue,gasFee,txHash,exchange,timestamp

QUALITY CHECK SCORING (built — reference for catalog Quality tab):
Deductions: CRITICAL=8 | WARNING=3 | INFO=1. Score clamped [0,100].
Column healthScore = max(0, 100 - nullRate×60 - (1-uniqueRate)×20)
Issue types: NULL_RATE|DUPLICATE|DUPLICATE_KEY|TEMPORAL|COMPUTED_DRIFT|
  REFERENTIAL|FORMAT|OUTLIER|SCHEMA_COMPLETENESS|NEGATIVE_VALUE|
  SEMANTIC|BUSINESS_LOGIC

SESSION 12 MUST BUILD (replace placeholders, do not touch wizard/API):
- Full Catalog at /apps/dataops/catalog — 6-tab dataset detail
- Full Obfuscation at /apps/dataops/obfuscation — 4-tab service
- POST /api/dataops/catalog-chat (max_tokens 1000)
- POST /api/dataops/suggest-obfuscation (max_tokens 1000, JSON only)

CATALOG (/apps/dataops/catalog):
FusePageSimple fullwidth. Left 280px panel. All DataTable, all FuseSvgIcon.
Fuse.js fuzzy search (name/description/tags/columns/owner).
Filters: industry chips (INDUSTRY_COLORS), classification, regulatory,
  has-images toggle, PII-only toggle, sort options.
Cards: INDUSTRY_COLORS border, quality score colored Badge, PII FuseSvgIcon,
  regulatory Chips, camera FuseSvgIcon for IMAGE_URL datasets.
Dataset Detail 6 MUI Tabs:
  Overview: Paper stat cards, regulatory Chips, "Request Re-id" Button
  Schema: DataTable (column|type|PII type|obfuscation rule|null rate|examples)
    PII rows amber sx background. IMAGE_URL rows camera FuseSvgIcon.
  Preview & Stats: first 20 rows DataTable, <img> thumbnails inline for
    imageUrl columns (picsum.photos URLs in trx_product_listings),
    raw/obfuscated Chip toggle, Recharts per column type,
    INDUSTRY-SPECIFIC stat cards keyed on catalogEntry.industryTag
  Lineage: plain SVG DAG (no D3) upstream→current
  Quality: read-only from catalog.json, score gauge circular, heatmap grid
  Observability: synthetic 30-day Recharts trends, schema changelog DataTable
"Ask DataVault" Fab (AutoAwesomeIcon, secondary color) → Drawer 420px.
POST /api/dataops/catalog-chat → { text, datasetCards: string[] }
Inline Paper cards for referenced datasetIds from catalog.json.

OBFUSCATION (/apps/dataops/obfuscation):
HMAC-SHA256 via crypto.subtle.sign. Seed "DEMO_SEED_2024".
Document KMS CMK for production in About page system design.
Format preservation per PII type (full spec in PORTFOLIO_SETUP_GUIDE.md).
Re-id: seed IS key. Approved → download from /data/dataops/datasets/[id].json
4 MUI Tabs: Job Config | Approval Queue | Audit Log | Job History
Job Config: dataset selector → PII from catalog.json → LLM rules →
  Preview (5 rows side-by-side, run twice proves determinism) →
  submit → Pending→Running→Complete animation → download button
Approval Queue: DataTable, admin Chip toggle, approve/reject
Audit Log: DataTable event stream
Job History: DataTable from /data/dataops/obfuscation-jobs.json
Create /data/dataops/obfuscation-jobs.json — 200 jobs:
  jobId, datasetId, datasetName, submittedAt, completedAt,
  status(COMPLETED|FAILED|RUNNING), piiColumnsObfuscated, rowsProcessed(500),
  processingTimeMs(800-3000), requestedBy, seedVersion, reidentificationRequests

LLM API routes built in Session 11 — do not rebuild:
POST /api/dataops/quality-check
POST /api/dataops/generate-metadata
To build in Session 12:
POST /api/dataops/suggest-obfuscation  JSON-only response, no prose
POST /api/dataops/catalog-chat         { text, datasetCards: string[] }

---

## APP 5: LOFAT — LAST-MILE FRAUD DETECTION PLATFORM
Route: /apps/lofat
Original name: Location Fraud Automation Tool (LoFAT)
Built for: Amazon Foods / Last-Mile Delivery
Achievement: $0.6M saved, 37 headcount avoided, <90s detection latency,
100% fleet monitoring coverage

Context: LoFAT detects delivery drivers fraudulently collecting hourly
pay without performing deliveries, using GPS spoofing and behavioral
avoidance. It combines real-time GPS telemetry, ML anomaly detection,
and behavioral pattern recognition to auto-flag fraud and route cases
to investigation teams.

### FRAUD PATTERNS (5 types — all present in synthetic data):

PATTERN 1 — ROSTER AVOIDANCE (Order Dodging):
Driver is clocked in with valid GPS movement, but systematically
positions themselves outside pickup zones to avoid order assignment.
Paid hourly, completes near-zero deliveries per shift.
Signals: active_hours>6 AND orders_completed<=1, repeated movement
AWAY from restaurant clusters, 8+ assignment attempts by system,
pickup_zone_proximity always >2km, repeats across consecutive shifts.
Severity: HIGH

PATTERN 2 — GPS SPOOFING:
Device transmits a fixed fake coordinate with micro-jitter while driver
is physically stationary. Appears to be "near a pickup point" all day.
Signals: GPS variance <50m over 4hrs, speed = 0 or random noise spikes
(0→45→0 mph in 30s), deliveries "attempted" but customer sees no visit,
IP geolocation mismatches GPS.
Severity: CRITICAL

PATTERN 3 — GHOST DELIVERY (Fake Completion):
Driver marks delivery "completed" without traveling to customer address.
GPS shows driver never came within 500m of delivery address.
Signals: completion event fired BUT nearest GPS point to address >500m,
time_at_delivery_address = 0s (should be 30s+), no door photo or photo
metadata location mismatch, customer complaint rate >40%.
Severity: CRITICAL

PATTERN 4 — PHANTOM ROUTE (Teleportation):
GPS telemetry shows driver "teleporting" — instant appearance at a
location 15+ miles away with no route trace between points. Indicates
GPS manipulation tool in use.
Signals: distance between consecutive pings impossible given time delta,
implied speed >150mph in urban area, route reconstruction fails, occurs
during active delivery window (not a dropout — signal present throughout).
Severity: HIGH

PATTERN 5 — CLUSTER FRAUD (Coordinated Spoofing):
3+ drivers show identical or near-identical GPS coordinates simultaneously
at a non-hub location (empty lot, residential street). Suggests shared
spoofing script or organized fraud ring.
Signals: 3+ drivers within 50m for 30+ mins (statistically impossible),
all show zero deliveries during overlap, same shift window, similar device
fingerprints (OS version, app version, sometimes same IP subnet).
Severity: CRITICAL — legal escalation required

### LOFAT SYNTHETIC DATA FILES:

/data/lofat/drivers.json — 200 driver records:
driverId (DRV-10001 to DRV-10200), name (fictional US names),
zone (Seattle-North|Seattle-South|Chicago-Loop|Chicago-North|
LA-Westside|LA-Valley), vehicleType (BIKE|CAR|VAN|SCOOTER),
shiftStart/shiftEnd (ISO), hourlyRate (18-25 USD),
status (ACTIVE|FLAGGED|SUSPENDED|UNDER_INVESTIGATION|CLEARED),
fraudScore (0-100), primaryFraudPattern (pattern name or null),
totalShifts (20-200), flaggedShifts (0-50),
totalEarnings (USD), deliveriesCompleted, deliveriesAttempted,
customerComplaintRate (0.0-0.6), onTimeRate (0.0-1.0),
lastFlaggedDate (ISO or null).
Distribution: 140 clean drivers (fraudScore 0-25), 60 fraudulent
(fraudScore 60-100), 12 per pattern type.

/data/lofat/deliveries.json — 1000 delivery records:
deliveryId, driverId, orderId, zone, pickupAddress (fictional US street),
deliveryAddress (fictional US street), scheduledPickup (ISO),
actualPickup (ISO or null), deliveryStatus
(COMPLETED|ATTEMPTED|FAILED|GHOST_FLAGGED|SPOOFED_FLAGGED),
timeAtDeliveryAddress (seconds, 0 for ghost deliveries),
distanceFromAddressAtCompletion (meters),
customerRating (1-5 or null), customerComplaint (boolean),
fraudFlagType (null or pattern name), fraudConfidence (0-100).

/data/lofat/gpsTraces.json — GPS traces for 20 flagged drivers:
Each: { driverId, date, fraudPattern, pings: [{timestamp,lat,lng,speed,accuracy}] }
Include realistic anomalies per pattern:
- Spoofed: lat/lng change <0.0005 degrees over 3 hours
- Phantom: coordinate jumps 15+ miles between consecutive pings
- Cluster: 4 drivers sharing lat/lng within 0.0003 degrees
- Order Dodging: trace shows movement AWAY from 98101/60601/90001 zip centers
Use real Seattle lat (47.6±0.1), Chicago lat (41.85±0.1), LA lat (34.05±0.1)

/data/lofat/cases.json — 30 investigation cases:
caseId (CASE-2024-001 etc), driverId, driverName, openedDate,
status (OPEN|IN_REVIEW|ESCALATED|CLOSED_FRAUD|CLOSED_FALSE_POSITIVE),
fraudPattern, evidenceSummary (2-3 sentences), assignedInvestigator,
estimatedFraudAmount (USD, 200-8000), resolution (string or null).

/data/lofat/shiftMetrics.json — 90-day rolling aggregate:
date, dailyActiveDrivers, dailyFlaggedDrivers, totalDeliveries,
totalFraudAlerts, patternBreakdown {rosterAvoidance, gpsSpoofing,
ghostDelivery, phantomRoute, clusterFraud},
estimatedDailyLoss (USD), preventedAmount (USD).

### LOFAT PAGES:

PAGE 1 — Live Monitoring Dashboard (default):
Summary cards (4): Active Drivers | Flagged This Shift (red) |
Fraud Alerts Today | Loss Prevented Today ($)

Zone tabs: All | Seattle | Chicago | Los Angeles
Pattern filter chips: All | Order Dodging | GPS Spoofing |
Ghost Delivery | Phantom Route | Cluster Fraud

Driver table:
Driver ID | Name | Zone | Vehicle | Shift Hours | Orders Assigned |
Orders Completed | Fraud Score (colored progress bar 0-100) |
Primary Flag | Status badge | Investigate / Clear / Escalate buttons

Fraud Score colors: 0-30=green, 31-60=yellow, 61-80=orange, 81-100=red
Status badges: ACTIVE(blue) | FLAGGED(orange) | SUSPENDED(red) |
UNDER_INVESTIGATION(purple) | CLEARED(green)

"Last updated [time]" + auto-refresh toggle (simulated, 5s)
Click row → Driver Investigation Detail

PAGE 2 — Driver Investigation Detail (/apps/lofat/driver/[driverId]):
Left panel: driver profile card (name, ID, zone, vehicle, fraud score
as large circular gauge, status badge, career stats).

Center panel: GPS Trace Map (React Leaflet — CRITICAL FEATURE):
- Polyline showing driver's GPS trace for selected date
- Visual anomalies per fraud pattern:
  SPOOFED: dense dot cluster that barely moves, red zone marker
  PHANTOM ROUTE: broken polyline with red lightning bolt markers at jumps
  ORDER DODGING: route trace with green circles showing avoided pickup
    zones, red arrows showing direction away from zones
  CLUSTER FRAUD: 4 separate colored traces converging on same point
- Date picker to select shift date
- "Play Route" button — animates driver icon along trace (CSS animation)
- Toggle: show delivery address pins on map

Right panel: Evidence Timeline (chronological fraud signals):
Format: [HH:MM] [SIGNAL_TYPE badge] [plain English description]
Examples:
"14:23 GPS_ANOMALY Speed jumped 0→67mph in 2 seconds"
"14:45 ZONE_AVOIDANCE Moved 3.2km away from Seattle pickup cluster"
"15:12 GHOST_DELIVERY Marked delivered — GPS shows 847m from address"

Bottom: delivery record table for this driver/shift, fraud rows in red.

PAGE 3 — Fraud Pattern Analytics:
Charts:
1. Pattern Distribution PieChart — % breakdown of 5 fraud types
2. Fraud Score Histogram BarChart — drivers bucketed by score range
3. Daily Alerts Trend LineChart — 90 days rolling
4. Loss Prevention AreaChart — cumulative $ prevented over 90 days
5. Zone Fraud Density Map (React Leaflet) — CircleMarker per zone,
   radius = fraud count, color = severity. Hover shows zone stats.
6. Pattern × Zone grouped BarChart — which patterns dominate which city

PAGE 4 — Case Management:
Case table: Case ID | Driver | Pattern | Opened | Status |
Est. Fraud $ | Investigator | Actions (View/Escalate/Close)
Filters: status, pattern, zone, date range
"Create Case" button → modal (select driver, pattern, initial notes)
Case detail view: evidence summary, timeline, resolution textarea,
Approve/Reject/Escalate to Legal buttons
Summary bar: Open Cases | Avg Resolution Days | Total Recovered $

### LOFAT LLM FEATURES:

1. Fraud Investigation Summary → /api/lofat/investigate
"Analyze This Driver ✦" on Investigation Detail page.
Request: { driver, deliveries, gpsTrace, evidenceTimeline }
Returns: formal investigation report — fraud pattern, top 3 evidence
points, confidence %, recommended action, estimated financial impact.
Rendered as a structured report card with sections.

2. Signal Explanation → /api/lofat/explain-signal
"What does this mean? ✦" next to each evidence timeline item.
Returns plain English explanation for non-technical ops managers.
Example output: "This means the driver's phone GPS barely moved for
3 hours despite being clocked in. Legitimate drivers show 50-500x
more movement during an active shift. This is consistent with GPS
spoofing software being used to fake an active location."

3. Natural Language Driver Search → /api/lofat/nl-search
Search bar on Live Monitoring.
"show all order dodgers in Seattle with fraud score above 70"
"find ghost delivery cases opened this month still unresolved"
"which cluster fraud drivers are currently active on shift?"
Returns filtered driverIds + explanation of what was found.

4. Daily Intelligence Brief (auto-loads) → /api/lofat/daily-brief
Returns: total fraud exposure today, dominant pattern, highest-risk
driver to prioritize, one operational recommendation for the shift.
Displayed as "Intelligence Brief ✦" panel at dashboard top.

5. Case Narrative Generator → /api/lofat/case-narrative
"Draft Case Report ✦" in Case Management detail view.
Request: { case, driver, evidence, deliveries }
Returns: formal narrative for HR/legal review covering incident
timeline, evidence, policy violations, recommended action.
Editable before saving to case record.

---

## PORTFOLIO LANDING PAGE
Route: /
Layout: custom full-page (NO Fuse sidebar on this route — separate layout.tsx)

All copy is locked — do not paraphrase, shorten, or rewrite any text below.
Tenure is 11+ years (Sep 2014 → present). Total impact is $45M+.

SECTION 1 — HERO (full-viewport-height, dark background grey[900]):
Name: "Misbahuddin Mohammed"
Title: "Senior Engineering Leader"
Summary: "11 years at Amazon building and scaling engineering organizations
across AI/ML, data platforms, and logistics operations. From real-time ML
pipelines to LLM-powered data infrastructure — leading teams, shipping
products, and driving $45M+ in combined business impact."
CTAs: "View Projects" (contained, primary) | "Read Resume" (outlined, white)

SECTION 2 — IMPACT NUMBERS (6 stats, dark grey[800]):
"$45M+"    "Total portfolio impact"       "Cost savings and revenue uplift across all products"
"3 → 22"   "Engineers grown"              "Across India, Dubai, and Mexico"
"7"         "Engineers promoted"           "With 12-month evidence-based promo cases"
"6 regions" "Product deployments"          "IN · AU · SG · DXB · KSA · LATAM"
"203K+"     "Amazon tables served"         "By AMG metadata platform"
"150+"      "Interviews conducted"         "Across Amazon hiring initiatives"
Animated count-up on scroll (IntersectionObserver).

SECTION 3 — PRODUCTS (6 cards, light background):
Subtitle: "10 years. 6 products. 3 continents."
Left border accent colors per product:
  DataOps Suite:#8b5cf6 | Delay Alert:#f59e0b | Heimdall:#0ea5e9
  DFT:#10b981 | LoFAT:#ef4444 | Reactive Scheduling:#6366f1
Per card: era Chip + badge Chip + name + tagline + impact stat + 3 tech Chips
Key impact stats:
  DataOps: "$1.2M annual savings · 203K+ tables served"
  Delay Alert: "6 regions · 10-min refresh · replaced manual spreadsheets"
  Heimdall: "TAT 6.7 → 2.2 hours · P95 SLA met consistently"
  DFT: "100+ FCs · 6 countries · real-time vs 30-min lag"
  LoFAT: "$0.6M saved · 37 headcount hires eliminated"
  Reactive Scheduling: "$800K annual savings · 70% latency reduction"
Reactive Scheduling "Explore →" scrolls to #career (no /apps/ route).

SECTION 4 — CAREER TIMELINE (dark, 4 milestones):
  Sep 2014–Mar 2016 | Support Engineer | Corporate Logistics · Hyderabad
  Apr 2016–Mar 2018 | Manager, Web Dev & Automation | Corporate Logistics · Hyderabad
  Apr 2018–Apr 2022 | Senior SDM | Corporate Logistics · Hyderabad
  Apr 2022–Present  | Senior SDM | People Experience & Central Science · Seattle
See Session 16 prompt for exact highlight copy per milestone.

SECTION 5 — PEOPLE LEADERSHIP (two-column: stats + principles):
6 leadership stats + 4 leadership principles.
Principle copy is locked — see Session 16 prompt for exact text.

SECTION 6 — TECH STACK (6 categories, Chip groups):
Cloud & Infrastructure | AI/ML | Data Engineering |
Frontend & Web | Languages | Compliance & Security
See Session 16 prompt for full skill lists per category.

SECTION 7 — FOOTER (dark):
LinkedIn | GitHub | misbah_2703@yahoo.com
"© 2025 Misbahuddin Mohammed · Senior Engineering Leader"

---

## CODE QUALITY RULES

- TypeScript strict — ZERO `any` — use proper interfaces everywhere
- JSDoc comment on every component
- All data in /data/ — never inline in components
- Every API route: try/catch + proper error Response
- Every LLM call: loading state + error boundary + retry
- Components <200 lines — split if larger
- Named exports for components, default export for pages

---

## SESSION MANAGEMENT

- /clear between sessions — prevents context pollution
- Commit after each working session
- npm run build before declaring session complete
- /compact if Claude seems confused mid-session
- Start every session: "Read CLAUDE.md and confirm understanding"

---

## AWS DEPLOYMENT

Target: AWS Amplify (supports Next.js API routes — S3/CloudFront does not)
ANTHROPIC_API_KEY: set in Amplify console env vars (never in code)
Domain: purchase on Route53 (misbah.engineer recommended)
GitHub: public repo

---

## BUILD COMMANDS
npm install          # install all deps
npm run dev          # dev server
npm run build        # production build
npm run lint         # eslint check