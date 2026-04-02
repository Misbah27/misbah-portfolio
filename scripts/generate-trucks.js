/**
 * Generate synthetic truck data for InboundIQ (Heimdall)
 *
 * Domain model:
 * - Each FC has 10-15 dock doors (scarce resource — this is why InboundIQ exists)
 * - CheckedIn = actively unloading at a dock door (has door, no rank needed)
 * - Arrived / PreCheckin = in the yard waiting for a door (NO door, RANKED by model)
 * - Scheduled = not yet at FC (NO door, NO rank)
 *
 * The ranking model replaces manual ops decisions by weighing:
 * - Low in-stock items carried (critical replenishment)
 * - Appointment type (HOT > SPD > CARP/AMZL)
 * - Dwell time in yard (longer wait = higher urgency)
 * - Arrival timing vs schedule (early arrivals rewarded, late penalized differently)
 * - Stow time remaining (tighter deadline = higher priority)
 * - Units/cartons volume
 *
 * Outputs 150 truck records to /data/inboundiq/trucks.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---

const REFERENCE_DATE = new Date('2024-11-15T12:00:00Z');
const DOORS_PER_FC = { SEA1: 14, PDX2: 12, LAX3: 13, ORD2: 11, JFK4: 10 };

const STATE_PREFIXES = ['WA', 'OR', 'CA', 'IL', 'NY', 'TX', 'GA', 'MA', 'FL'];

const FC_DISTRIBUTION = [
  ...Array(40).fill('SEA1'),
  ...Array(30).fill('PDX2'),
  ...Array(30).fill('LAX3'),
  ...Array(25).fill('ORD2'),
  ...Array(25).fill('JFK4'),
];

const APPT_TYPE_WEIGHTED = [
  ...Array(40).fill('CARP'),
  ...Array(30).fill('AMZL'),
  ...Array(20).fill('SPD'),
  ...Array(10).fill('HOT'),
];

const ARRIVAL_STATUS_WEIGHTED = [
  ...Array(40).fill('ON_TIME'),
  ...Array(20).fill('LATE'),
  ...Array(15).fill('DELAYED'),
  ...Array(25).fill('EARLY'),
];

const SIDELINE_REMARKS = [
  'Missing BOL',
  'Damaged pallet reported',
  'Waiting for yard jockey',
  'Seal mismatch - verification needed',
  'Priority load - expedite',
  'Carrier requested delay',
  'Equipment inspection required',
  'Awaiting lumper service',
  'Trailer temperature check needed',
  'Oversized load - special dock required',
  'Driver on mandatory break',
  'Low in-stock SKUs — urgent replenishment',
  'Contains hazmat — restricted dock only',
  'Partial load — consolidation pending',
];

// Low in-stock percentage: how much of this truck's cargo is critically needed
// Higher % = FC shelves are empty for these items = higher priority
const LOW_INSTOCK_CATEGORIES = [
  { label: 'Critical', pct: 80, weight: -50 },
  { label: 'High', pct: 55, weight: -30 },
  { label: 'Medium', pct: 30, weight: -10 },
  { label: 'Low', pct: 10, weight: 0 },
  { label: 'None', pct: 0, weight: 5 },
];

// --- Helpers ---

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePlate() {
  const state = pick(STATE_PREFIXES);
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const l = () => letters[Math.floor(Math.random() * letters.length)];
  const d = () => randomInt(0, 9);
  return `${state}-${l()}${l()}${l()}${d()}${d()}${d()}${d()}`;
}

function generateVrid() {
  const digits = Array.from({ length: 4 }, () => randomInt(0, 9)).join('');
  const alphanumLen = randomInt(4, 5);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const alphan = Array.from({ length: alphanumLen }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${digits}${alphan}`;
}

function hoursOffset(base, minHrs, maxHrs) {
  const offset = randomFloat(minHrs, maxHrs, 2) * 3600 * 1000;
  return new Date(base.getTime() + offset);
}

function formatHHMM(totalHours) {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- Generate ---

function generateTrucks() {
  const trucks = [];

  // Pre-assign FC IDs to get exact distribution, then shuffle
  const fcAssignments = shuffle(FC_DISTRIBUTION);

  // Decide how many trucks per status category per FC
  // We need enough CheckedIn to fill dock doors, rest are yard/scheduled
  const fcTruckIndices = {};
  for (let i = 0; i < 150; i++) {
    const fc = fcAssignments[i];
    (fcTruckIndices[fc] = fcTruckIndices[fc] || []).push(i);
  }

  // For each FC, assign statuses: fill doors with CheckedIn, rest split between Arrived/PreCheckin/Scheduled
  const statusAssignments = new Array(150);
  for (const [fc, indices] of Object.entries(fcTruckIndices)) {
    const doorCount = DOORS_PER_FC[fc];
    const shuffledIndices = shuffle(indices);

    // Fill most doors (80-100%) with CheckedIn trucks
    const checkedInCount = Math.min(shuffledIndices.length, randomInt(Math.floor(doorCount * 0.8), doorCount));

    // Remaining trucks split: ~40% Arrived, ~30% PreCheckin, ~30% Scheduled
    const remaining = shuffledIndices.length - checkedInCount;
    const arrivedCount = Math.round(remaining * 0.4);
    const precheckinCount = Math.round(remaining * 0.3);
    // scheduledCount = rest

    let idx = 0;
    for (let j = 0; j < checkedInCount; j++) statusAssignments[shuffledIndices[idx++]] = 'CheckedIn';
    for (let j = 0; j < arrivedCount; j++) statusAssignments[shuffledIndices[idx++]] = 'Arrived';
    for (let j = 0; j < precheckinCount; j++) statusAssignments[shuffledIndices[idx++]] = 'PreCheckin';
    while (idx < shuffledIndices.length) statusAssignments[shuffledIndices[idx++]] = 'Scheduled';
  }

  const rawRecords = [];

  for (let i = 0; i < 150; i++) {
    const apptType = pick(APPT_TYPE_WEIGHTED);
    const dmStatus = statusAssignments[i];
    // Scheduled trucks haven't arrived — can't be DELAYED/LATE
    const arrivalStatus = dmStatus === 'Scheduled'
      ? pick(['ON_TIME', 'EARLY', 'EXPECTED'])
      : pick(ARRIVAL_STATUS_WEIGHTED);
    const fcId = fcAssignments[i];

    // Low in-stock level for this load
    const lowInstock = pick(LOW_INSTOCK_CATEGORIES);

    // Schedule time: within last 48 hours of reference date
    const scheduleTime = hoursOffset(REFERENCE_DATE, -48, 0);

    // Timestamps based on DM status
    let precheckinTime = null;
    let checkinTime = null;

    if (dmStatus === 'CheckedIn') {
      precheckinTime = hoursOffset(scheduleTime, 0.1, 2);
      checkinTime = hoursOffset(precheckinTime, 0.1, 1);
    } else if (dmStatus === 'Arrived' || dmStatus === 'PreCheckin') {
      precheckinTime = hoursOffset(scheduleTime, 0.1, 2);
    }
    // Scheduled: no precheckin, no checkin

    // Unloading ETA: only meaningful for CheckedIn (actively unloading)
    const unloadingEta = dmStatus === 'CheckedIn'
      ? hoursOffset(REFERENCE_DATE, 0.5, 6)
      : null;

    // Dwell hours: only for yard trucks (Arrived/PreCheckin) — time waiting in yard
    // CheckedIn trucks are unloading (not dwelling). Scheduled trucks aren't here.
    let dwellHours = null;
    if (dmStatus === 'Arrived' || dmStatus === 'PreCheckin') {
      if (arrivalStatus === 'DELAYED' || arrivalStatus === 'LATE') {
        dwellHours = randomFloat(6, 48, 1);
      } else if (Math.random() < 0.05) {
        dwellHours = randomFloat(24, 72, 1);
      } else {
        dwellHours = randomFloat(0.5, 12.0, 1);
      }
    }

    // Units and cartons
    const units = randomInt(50, 5000);
    const cartons = randomInt(20, Math.min(2000, Math.floor(units * 0.6)));

    // Slot hours: 0.5-4.0 in 0.5 increments
    const slotOptions = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const slotHours = pick(slotOptions);

    // Stow date and time remaining
    const stowDate = new Date(REFERENCE_DATE);
    stowDate.setDate(stowDate.getDate() + randomInt(0, 2));
    const stowDateStr = stowDate.toISOString().split('T')[0];
    const stowTimeRemaining = formatHHMM(randomFloat(0.5, 8, 2));

    // Sideline remarks: 25% chance for yard trucks, 10% for others
    const remarkChance = (dmStatus === 'Arrived' || dmStatus === 'PreCheckin') ? 0.25 : 0.1;
    const sidelineRemarks = Math.random() < remarkChance ? pick(SIDELINE_REMARKS) : null;

    // --- Priority scoring (ONLY used for Arrived/PreCheckin ranking) ---
    // Lower score = higher priority (rank 1)
    let priorityScore = Math.random() * 30; // base noise

    // Low in-stock is the strongest signal — FC needs these items on shelves
    priorityScore += lowInstock.weight;

    // Appointment type urgency
    if (apptType === 'HOT') priorityScore -= 35;
    else if (apptType === 'SPD') priorityScore -= 15;

    // Dwell time pressure — truck sitting in yard costs money
    if (dwellHours !== null) {
      if (dwellHours > 24) priorityScore -= 25;
      else if (dwellHours > 12) priorityScore -= 15;
      else if (dwellHours > 6) priorityScore -= 8;
    }

    // Arrival timing
    if (arrivalStatus === 'EARLY') priorityScore -= 5; // reward — they're ready
    if (arrivalStatus === 'DELAYED') priorityScore += 10; // deprioritize — unknown ETA
    if (arrivalStatus === 'LATE') priorityScore -= 8; // already behind, need to catch up

    // Stow deadline pressure
    const stowHrs = parseFloat(stowTimeRemaining.split(':')[0]) + parseFloat(stowTimeRemaining.split(':')[1]) / 60;
    if (stowHrs < 2) priorityScore -= 20;
    else if (stowHrs < 4) priorityScore -= 10;

    // Volume — larger loads tie up doors longer, but also carry more inventory
    if (units > 3000) priorityScore -= 5;

    rawRecords.push({
      _priorityScore: priorityScore,
      _dmStatus: dmStatus,
      _fcId: fcId,
      vehicleNo: generatePlate(),
      isaVrid: generateVrid(),
      dockDoor: null,
      apptType,
      slotHours,
      dmStatus,
      scheduleTime: scheduleTime.toISOString(),
      precheckinTime: precheckinTime ? precheckinTime.toISOString() : null,
      checkinTime: checkinTime ? checkinTime.toISOString() : null,
      unloadingEta: unloadingEta ? unloadingEta.toISOString() : null,
      arrivalStatus,
      sidelineRemarks,
      units,
      cartons,
      dwellHours,
      stowDate: stowDateStr,
      stowTimeRemaining,
      lowInstockPct: lowInstock.pct,
      fcId,
    });
  }

  // --- Assign dock doors to CheckedIn trucks (they're at a door) ---
  const fcDoorPools = {};
  for (const fc of Object.keys(DOORS_PER_FC)) {
    const count = DOORS_PER_FC[fc];
    fcDoorPools[fc] = shuffle(Array.from({ length: count }, (_, i) => i + 1));
  }

  for (const rec of rawRecords) {
    if (rec.dmStatus === 'CheckedIn') {
      rec.dockDoor = fcDoorPools[rec.fcId].pop() ?? null;
    }
  }

  // --- Rank only Arrived/PreCheckin trucks per FC ---
  // CheckedIn: already docked, rank = null
  // Scheduled: not here yet, rank = null
  // Arrived/PreCheckin: ranked by priority model within their FC
  const fcYardTrucks = {};
  for (const rec of rawRecords) {
    if (rec.dmStatus === 'Arrived' || rec.dmStatus === 'PreCheckin') {
      (fcYardTrucks[rec.fcId] = fcYardTrucks[rec.fcId] || []).push(rec);
    }
  }

  for (const yardTrucks of Object.values(fcYardTrucks)) {
    yardTrucks.sort((a, b) => a._priorityScore - b._priorityScore);
    yardTrucks.forEach((rec, idx) => { rec._rank = idx + 1; });
  }

  // Build final output
  for (const rec of rawRecords) {
    const { _priorityScore, _dmStatus, _fcId, _rank, ...record } = rec;
    trucks.push({
      rank: _rank ?? null,
      ...record,
    });
  }

  return trucks;
}

// --- Write output ---

const trucks = generateTrucks();
const outputPath = path.join(__dirname, '..', 'data', 'inboundiq', 'trucks.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(trucks, null, 2));
console.log(`Generated ${trucks.length} truck records → ${outputPath}`);

// --- Validation ---
const byStatus = {};
trucks.forEach(t => { byStatus[t.dmStatus] = (byStatus[t.dmStatus] || 0) + 1; });

const ranked = trucks.filter(t => t.rank !== null);
const docked = trucks.filter(t => t.dockDoor !== null);
const scheduled = trucks.filter(t => t.dmStatus === 'Scheduled');
const scheduledWithRank = scheduled.filter(t => t.rank !== null);
const dockedNotCheckedIn = docked.filter(t => t.dmStatus !== 'CheckedIn');

const fcCounts = {};
trucks.forEach(t => { fcCounts[t.fcId] = (fcCounts[t.fcId] || 0) + 1; });

console.log(`\nValidation:`);
console.log(`  Status distribution: ${JSON.stringify(byStatus)}`);
console.log(`  FC distribution: ${JSON.stringify(fcCounts)}`);
console.log(`  Ranked (yard trucks): ${ranked.length}`);
console.log(`  Docked (CheckedIn): ${docked.length}`);
console.log(`  Scheduled (no rank, no door): ${scheduled.length}`);
console.log(`  ERRORS — Scheduled with rank: ${scheduledWithRank.length}`);
console.log(`  ERRORS — Docked but not CheckedIn: ${dockedNotCheckedIn.length}`);
const checkedInWithDwell = trucks.filter(t => t.dmStatus === 'CheckedIn' && t.dwellHours !== null);
console.log(`  ERRORS — CheckedIn with dwellHours: ${checkedInWithDwell.length}`);
const scheduledBadArrival = scheduled.filter(t => t.arrivalStatus === 'DELAYED' || t.arrivalStatus === 'LATE');
console.log(`  ERRORS — Scheduled with DELAYED/LATE: ${scheduledBadArrival.length}`);

// Per-FC breakdown
for (const fc of Object.keys(DOORS_PER_FC)) {
  const fcTrucks = trucks.filter(t => t.fcId === fc);
  const fcDocked = fcTrucks.filter(t => t.dockDoor !== null);
  const fcRanked = fcTrucks.filter(t => t.rank !== null);
  const fcScheduled = fcTrucks.filter(t => t.dmStatus === 'Scheduled');
  console.log(`  ${fc}: ${fcTrucks.length} total, ${fcDocked.length}/${DOORS_PER_FC[fc]} doors filled, ${fcRanked.length} ranked in yard, ${fcScheduled.length} scheduled`);
}
