/**
 * Generate large, realistic sample CSVs for the United Airlines Flight Difficulty Score project.
 * Run:  node scripts/generate-large-sample-data.js
 * Output goes to sample-data/ folder.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'sample-data');

// ── Helpers ─────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 1) => +(Math.random() * (max - min) + min).toFixed(dec);
const pad = (n) => String(n).padStart(2, '0');

function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function dtStr(d) { return `${dateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`; }
function addMin(d, m) { return new Date(d.getTime() + m * 60000); }

// ── Reference data ──────────────────────────────────────────────────────────
const AIRPORTS_US = [
    'ORD', 'LAX', 'SFO', 'JFK', 'EWR', 'IAH', 'DEN', 'SEA', 'DFW', 'ATL', 'MIA', 'BOS',
    'PHL', 'DCA', 'IAD', 'SLC', 'PDX', 'MSP', 'DTW', 'CLT', 'MCO', 'LAS', 'PHX', 'FLL',
    'BWI', 'SAN', 'AUS', 'BNA', 'RDU', 'STL', 'MCI', 'CLE', 'PIT', 'CVG', 'IND', 'CMH',
    'MKE', 'SJC', 'OAK', 'SNA', 'ONT', 'BUR', 'LGB', 'PSP', 'SMF', 'FAT', 'MRY',
];
const AIRPORTS_INTL = [
    { code: 'LHR', cc: 'GB' }, { code: 'CDG', cc: 'FR' }, { code: 'FRA', cc: 'DE' },
    { code: 'AMS', cc: 'NL' }, { code: 'MAD', cc: 'ES' }, { code: 'FCO', cc: 'IT' },
    { code: 'BCN', cc: 'ES' }, { code: 'ZUR', cc: 'CH' }, { code: 'VIE', cc: 'AT' },
    { code: 'BRU', cc: 'BE' }, { code: 'DUB', cc: 'IE' }, { code: 'CPH', cc: 'DK' },
    { code: 'ARN', cc: 'SE' }, { code: 'OSL', cc: 'NO' }, { code: 'HEL', cc: 'FI' },
    { code: 'NRT', cc: 'JP' }, { code: 'HND', cc: 'JP' }, { code: 'ICN', cc: 'KR' },
    { code: 'PVG', cc: 'CN' }, { code: 'HKG', cc: 'HK' }, { code: 'SIN', cc: 'SG' },
    { code: 'BKK', cc: 'TH' }, { code: 'SYD', cc: 'AU' }, { code: 'MEL', cc: 'AU' },
    { code: 'AKL', cc: 'NZ' }, { code: 'YYZ', cc: 'CA' }, { code: 'YVR', cc: 'CA' },
    { code: 'MEX', cc: 'MX' }, { code: 'GRU', cc: 'BR' }, { code: 'SCL', cc: 'CL' },
    { code: 'BOG', cc: 'CO' }, { code: 'EZE', cc: 'AR' }, { code: 'LIM', cc: 'PE' },
    { code: 'DXB', cc: 'AE' }, { code: 'DOH', cc: 'QA' }, { code: 'IST', cc: 'TR' },
    { code: 'DEL', cc: 'IN' }, { code: 'BOM', cc: 'IN' }, { code: 'JNB', cc: 'ZA' },
    { code: 'NBO', cc: 'KE' }, { code: 'CAI', cc: 'EG' },
];

const ALL_STATIONS = [...AIRPORTS_US, ...AIRPORTS_INTL.map((a) => a.code)];
const DEST_STATIONS = ALL_STATIONS.filter((c) => c !== 'ORD'); // ORD = hub

const FLEET = [
    { type: '737-800', seats: 166, carrier: 'Mainline' },
    { type: '737-900ER', seats: 179, carrier: 'Mainline' },
    { type: '737-MAX9', seats: 179, carrier: 'Mainline' },
    { type: '757-200', seats: 176, carrier: 'Mainline' },
    { type: '757-300', seats: 234, carrier: 'Mainline' },
    { type: '767-300ER', seats: 214, carrier: 'Mainline' },
    { type: '777-200ER', seats: 276, carrier: 'Mainline' },
    { type: '777-300ER', seats: 366, carrier: 'Mainline' },
    { type: '787-8', seats: 234, carrier: 'Mainline' },
    { type: '787-9', seats: 252, carrier: 'Mainline' },
    { type: '787-10', seats: 318, carrier: 'Mainline' },
    { type: 'A319', seats: 128, carrier: 'Mainline' },
    { type: 'A320', seats: 150, carrier: 'Mainline' },
    { type: 'ERJ-145', seats: 50, carrier: 'Express' },
    { type: 'ERJ-170', seats: 70, carrier: 'Express' },
    { type: 'ERJ-175', seats: 76, carrier: 'Express' },
    { type: 'CRJ-200', seats: 50, carrier: 'Express' },
    { type: 'CRJ-550', seats: 50, carrier: 'Express' },
    { type: 'CRJ-700', seats: 65, carrier: 'Express' },
];

const MEALS = ['Standard', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'Diabetic', 'Low-Sodium'];
const REMARK_TEXTS = [
    'Wheelchair assistance needed', 'Wheelchair assistance confirmed',
    'Unaccompanied minor', 'Unaccompanied minor confirmed',
    'Vegetarian meal requested', 'Vegetarian meal confirmed',
    'Gluten-free meal requested', 'Gluten-free meal confirmed',
    'Pet travel approved', 'Pet travel confirmed',
    'Group booking special handling', 'Group booking confirmed',
    'Standard meal preference', 'Standard meal confirmed',
    'Bassinet seat requested', 'Medical assistance required',
    'Stretcher case', 'Extra legroom requested',
    'Special baggage: musical instrument', 'Deaf/hard of hearing passenger',
    'Service animal onboard', 'Oxygen equipment required',
];
const PRIORITIES = ['Low', 'Medium', 'High'];
const BAG_TYPES = ['Checked', 'Carry-On', 'Gate-Check', 'Transfer', 'Priority', 'Oversized', 'Fragile'];
const BAG_DIMS = ['45x30x15', '50x35x18', '55x40x20', '60x45x25', '65x50x30', '70x55x35'];
const BAG_STATUSES = ['Checked In', 'Loaded', 'In Transit', 'Offloaded', 'Delivered'];

// ── 1) Airports ─────────────────────────────────────────────────────────────
function genAirports() {
    const rows = ['airport_iata_code,iso_country_code'];
    AIRPORTS_US.forEach((c) => rows.push(`${c},US`));
    AIRPORTS_INTL.forEach((a) => rows.push(`${a.code},${a.cc}`));
    fs.writeFileSync(path.join(OUT, 'Airports_Large.csv'), rows.join('\n'));
    console.log(`✅ Airports: ${rows.length - 1} rows`);
}

// ── 2) Flights ──────────────────────────────────────────────────────────────
function genFlights() {
    const header = 'company_id,flight_number,scheduled_departure_date_local,scheduled_departure_station_code,scheduled_arrival_station_code,scheduled_departure_datetime_local,scheduled_arrival_datetime_local,actual_departure_datetime_local,actual_arrival_datetime_local,total_seats,fleet_type,carrier,scheduled_ground_time_minutes,actual_ground_time_minutes,minimum_turn_minutes';
    const rows = [header];
    const flights = []; // store for PNR/bag generation

    // 30 days of data, ~20 flights/day = ~600 flights
    const startDate = new Date(2024, 0, 15); // 2024-01-15
    for (let day = 0; day < 30; day++) {
        const base = new Date(startDate);
        base.setDate(base.getDate() + day);

        const numFlights = randInt(16, 24);
        for (let f = 0; f < numFlights; f++) {
            const flNum = 1000 + day * 30 + f;
            const depHour = randInt(5, 22);
            const depMin = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
            const depDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), depHour, depMin);
            const flightDuration = randInt(90, 360); // 1.5h to 6h
            const arrDate = addMin(depDate, flightDuration);

            const delayMin = Math.random() < 0.35 ? randInt(1, 120) : 0; // 35% delayed
            const actualDep = addMin(depDate, delayMin);
            const actualArr = addMin(arrDate, delayMin + randInt(-5, 10));

            const fleet = pick(FLEET);
            const dest = pick(DEST_STATIONS);
            const schedGround = randInt(25, 90);
            const minTurn = randInt(20, 45);
            const actualGround = schedGround + randInt(-10, 15);

            const row = [
                'UA', flNum, dateStr(depDate), 'ORD', dest,
                dtStr(depDate), dtStr(arrDate), dtStr(actualDep), dtStr(actualArr),
                fleet.seats, fleet.type, fleet.carrier,
                schedGround, Math.max(actualGround, 15), minTurn,
            ].join(',');

            rows.push(row);
            flights.push({
                flNum, depDate: dateStr(depDate), dest, seats: fleet.seats,
                depDateObj: depDate,
            });
        }
    }

    fs.writeFileSync(path.join(OUT, 'Flight_Level_Data_Large.csv'), rows.join('\n'));
    console.log(`✅ Flights: ${rows.length - 1} rows`);
    return flights;
}

// ── 3) PNR ──────────────────────────────────────────────────────────────────
function genPNR(flights) {
    const header = 'pnr_id,company_id,flight_number,scheduled_departure_date_local,passenger_count,special_service_requests,meal_preference,wheelchair_assistance,unaccompanied_minor,pet_travel,group_booking';
    const rows = [header];
    const pnrs = []; // store for remarks/bags
    let pnrIdx = 1;

    for (const fl of flights) {
        // 3-8 PNRs per flight
        const numPnr = randInt(3, 8);
        for (let p = 0; p < numPnr; p++) {
            const pnrId = `PNR${String(pnrIdx++).padStart(5, '0')}`;
            const paxCount = randInt(1, 6);
            const ssr = randInt(0, 4);
            const meal = pick(MEALS);
            const wc = Math.random() < 0.12 ? 1 : 0;
            const umnr = Math.random() < 0.05 ? 1 : 0;
            const pet = Math.random() < 0.04 ? 1 : 0;
            const grp = paxCount >= 4 && Math.random() < 0.3 ? 1 : 0;

            rows.push([pnrId, 'UA', fl.flNum, fl.depDate, paxCount, ssr, meal, wc, umnr, pet, grp].join(','));
            pnrs.push({ pnrId, flNum: fl.flNum, depDate: fl.depDate, depDateObj: fl.depDateObj, paxCount });
        }
    }

    fs.writeFileSync(path.join(OUT, 'PNR_Flight_Level_Data_Large.csv'), rows.join('\n'));
    console.log(`✅ PNRs: ${rows.length - 1} rows`);
    return pnrs;
}

// ── 4) PNR Remarks ──────────────────────────────────────────────────────────
function genRemarks(pnrs) {
    const header = 'pnr_id,remark_code,remark_text,remark_category,priority_level,created_date,resolved_date,status';
    const rows = [header];

    for (const pnr of pnrs) {
        const numRemarks = randInt(0, 3); // 0-3 remarks per PNR
        for (let r = 0; r < numRemarks; r++) {
            const text = pick(REMARK_TEXTS);
            const priority = pick(PRIORITIES);
            const created = addMin(pnr.depDateObj, -randInt(30, 300));
            const resolved = addMin(created, randInt(10, 120));
            const status = Math.random() < 0.9 ? 'Resolved' : 'Pending';

            rows.push([
                pnr.pnrId, 'SSR', text, 'Special Service', priority,
                dtStr(created), dtStr(resolved), status,
            ].join(','));
        }
    }

    fs.writeFileSync(path.join(OUT, 'PNR_Remark_Level_Data_Large.csv'), rows.join('\n'));
    console.log(`✅ PNR Remarks: ${rows.length - 1} rows`);
}

// ── 5) Bags ─────────────────────────────────────────────────────────────────
function genBags(pnrs) {
    const header = 'bag_id,pnr_id,flight_number,bag_weight_kg,bag_dimensions_cm,bag_type,special_handling,priority_tag,security_flag,bag_status,check_in_time,boarding_time';
    const rows = [header];
    let bagIdx = 1;

    for (const pnr of pnrs) {
        const numBags = randInt(0, Math.min(pnr.paxCount * 2, 5)); // up to 2 bags per pax
        for (let b = 0; b < numBags; b++) {
            const bagId = `BAG${String(bagIdx++).padStart(5, '0')}`;
            const weight = randFloat(5, 32);
            const dims = pick(BAG_DIMS);
            const bType = pick(BAG_TYPES);
            const special = Math.random() < 0.15 ? 1 : 0;
            const priorityTag = Math.random() < 0.1 ? 1 : 0;
            const security = Math.random() < 0.02 ? 1 : 0;
            const bagStatus = pick(BAG_STATUSES);
            const checkin = addMin(pnr.depDateObj, -randInt(60, 240));
            const boarding = addMin(pnr.depDateObj, -randInt(10, 45));

            rows.push([
                bagId, pnr.pnrId, pnr.flNum, weight, dims, bType,
                special, priorityTag, security, bagStatus, dtStr(checkin), dtStr(boarding),
            ].join(','));
        }
    }

    fs.writeFileSync(path.join(OUT, 'Bag_Level_Data_Large.csv'), rows.join('\n'));
    console.log(`✅ Bags: ${rows.length - 1} rows`);
}

// ── Run ─────────────────────────────────────────────────────────────────────
console.log('\n🚀 Generating large sample data...\n');
genAirports();
const flights = genFlights();
const pnrs = genPNR(flights);
genRemarks(pnrs);
genBags(pnrs);
console.log(`\n✅ All files written to ${OUT}\n`);
