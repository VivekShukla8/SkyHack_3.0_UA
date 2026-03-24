const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');
const aliases = require('../config/headerAliases');

function normalizeRowKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    const key = String(k)
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    out[key] = v;
  }
  return out;
}

function pick(row, names) {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && row[n] !== '') return row[n];
  }
  return undefined;
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const m = moment(val);
  if (m.isValid()) return m.toDate();
  const fallback = new Date(val);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function toInt(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseInt(v);
  return isNaN(n) ? 0 : n;
}

function mapRecord(dataType, norm) {
  switch (dataType) {
    case 'airports': {
      const a = aliases.airports;
      const airport_iata_code = pick(norm, a.airport_iata_code);
      const iso_country_code = pick(norm, a.iso_country_code);
      if (!airport_iata_code || !iso_country_code) {
        throw new Error(`Missing required fields: airport_iata_code=${airport_iata_code}, iso_country_code=${iso_country_code}`);
      }
      return {
        airport_iata_code: String(airport_iata_code),
        iso_country_code: String(iso_country_code)
      };
    }
    case 'flights': {
      const a = aliases.flights;
      const rec = {
        company_id: String(pick(norm, a.company_id) || ''),
        flight_number: String(pick(norm, a.flight_number) || ''),
        scheduled_departure_date_local: parseDate(pick(norm, a.scheduled_departure_date_local)),
        scheduled_departure_station_code: String(pick(norm, a.scheduled_departure_station_code) || ''),
        scheduled_arrival_station_code: String(pick(norm, a.scheduled_arrival_station_code) || ''),
        scheduled_departure_datetime_local: parseDate(pick(norm, a.scheduled_departure_datetime_local)),
        scheduled_arrival_datetime_local: parseDate(pick(norm, a.scheduled_arrival_datetime_local)),
        actual_departure_datetime_local: parseDate(pick(norm, a.actual_departure_datetime_local)),
        actual_arrival_datetime_local: parseDate(pick(norm, a.actual_arrival_datetime_local)),
        total_seats: toInt(pick(norm, a.total_seats)),
        fleet_type: String(pick(norm, a.fleet_type) || ''),
        carrier: String(pick(norm, a.carrier) || ''),
        scheduled_ground_time_minutes: toInt(pick(norm, a.scheduled_ground_time_minutes)),
        actual_ground_time_minutes: toInt(pick(norm, a.actual_ground_time_minutes)) || null,
        minimum_turn_minutes: toInt(pick(norm, a.minimum_turn_minutes))
      };
      if (!rec.company_id || !rec.flight_number || !rec.scheduled_departure_date_local) {
        throw new Error('Missing required flight fields');
      }
      return rec;
    }
    case 'pnr': {
      const a = aliases.pnr;
      const rec = {
        company_id: String(pick(norm, a.company_id) || ''),
        flight_number: String(pick(norm, a.flight_number) || ''),
        scheduled_departure_date_local: parseDate(pick(norm, a.scheduled_departure_date_local)),
        scheduled_departure_station_code: String(pick(norm, a.scheduled_departure_station_code) || ''),
        scheduled_arrival_station_code: String(pick(norm, a.scheduled_arrival_station_code) || ''),
        record_locator: String(pick(norm, a.record_locator) || ''),
        pnr_creation_date: parseDate(pick(norm, a.pnr_creation_date)),
        total_pax: toInt(pick(norm, a.total_pax)),
        lap_child_count: toInt(pick(norm, a.lap_child_count)),
        is_child: String(pick(norm, a.is_child) || 'N'),
        basic_economy_pax: toInt(pick(norm, a.basic_economy_pax)),
        is_stroller_user: String(pick(norm, a.is_stroller_user) || 'N')
      };
      if (!rec.record_locator || !rec.flight_number) {
        throw new Error('Missing required PNR fields');
      }
      return rec;
    }
    case 'pnr-remarks': {
      const a = aliases.pnrRemarks;
      const rec = {
        record_locator: String(pick(norm, a.record_locator) || ''),
        pnr_creation_date: parseDate(pick(norm, a.pnr_creation_date)),
        flight_number: String(pick(norm, a.flight_number) || ''),
        special_service_request: String(pick(norm, a.special_service_request) || ''),
        request_type: (String(pick(norm, a.special_service_request) || '')).toLowerCase().includes('wheelchair') ? 'Wheelchair' : 'Other'
      };
      if (!rec.record_locator || !rec.special_service_request) {
        throw new Error('Missing required PNR Remark fields');
      }
      return rec;
    }
    case 'bags': {
      const a = aliases.bags;
      const bag_type_raw = String(pick(norm, a.bag_type) || 'Checked');
      const issue = parseDate(pick(norm, a.bag_tag_issue_date));
      const depDate = parseDate(pick(norm, a.scheduled_departure_date_local));
      return {
        company_id: String(pick(norm, a.company_id) || ''),
        flight_number: String(pick(norm, a.flight_number) || ''),
        scheduled_departure_date_local: depDate,
        scheduled_departure_station_code: String(pick(norm, a.scheduled_departure_station_code) || ''),
        scheduled_arrival_station_code: String(pick(norm, a.scheduled_arrival_station_code) || ''),
        bag_tag_unique_number: String(pick(norm, a.bag_tag_unique_number) || ''),
        bag_tag_issue_date: issue,
        bag_type: bag_type_raw,
        is_hot_transfer: bag_type_raw.toLowerCase() === 'transfer' && issue && depDate
          ? (moment(issue).diff(moment(depDate), 'minutes') < 30)
          : false
      };
    }
    default:
      throw new Error(`Unsupported dataType: ${dataType}`);
  }
}

async function parseCSV(filePath, dataType) {
  const rawAll = [];
  const mappedRecords = [];
  const errors = [];

  const aliasSet = aliases[dataType] || {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const norm = normalizeRowKeys(row);
        rawAll.push(norm);
        try {
          const mapped = mapRecord(dataType, norm);
          mappedRecords.push(mapped);
        } catch (err) {
          errors.push({ row: norm, error: err.message });
        }
      })
      .on('end', () => {
        resolve({ rawAll, mappedRecords, errors });
      })
      .on('error', (err) => reject(err));
  });
}

module.exports = {
  parseCSV,
  normalizeRowKeys,
  pick,
  parseDate,
};
