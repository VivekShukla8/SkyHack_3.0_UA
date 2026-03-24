const Flight = require('../models/Flight');
const PNR = require('../models/PNR');
const PNRRemark = require('../models/PNRRemark');
const Bag = require('../models/Bag');
const Airport = require('../models/Airport');
const UploadedData = require('../models/UploadedData');
const moment = require('moment');
const _ = require('lodash');

class DataProcessor {
  // Normalize row keys: trim, lower-case, replace spaces/hyphens with underscores, remove BOM
  static normalizeRowKeys(row) {
    const out = {};
    for (const [k, v] of Object.entries(row || {})) {
      const key = String(k)
        .replace(/^\uFEFF/, '') // strip BOM
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      out[key] = v;
    }
    return out;
  }

  // Resolve a value by trying multiple possible header names
  static pick(row, names) {
    for (const n of names) {
      if (row[n] !== undefined && row[n] !== null && row[n] !== '') return row[n];
    }
    return undefined;
  }
  // Process all stored JSON data into individual collections
  static async processAllStoredData(userId) {
    try {
      console.log('Starting data processing from UploadedData collection...');
      const query = userId ? { userId } : {};
      const uploadedData = await UploadedData.find(query).sort({ uploadDate: 1 });
      let totalProcessed = 0;
      let totalErrors = 0;

      for (const data of uploadedData) {
        console.log(`Processing ${data.dataType} data: ${data.fileName}`);

        try {
          const result = await this.processDataByType(data, userId);
          totalProcessed += result.processed;
          totalErrors += result.errors;
          console.log(`✓ Processed ${result.processed} records, ${result.errors} errors`);
        } catch (error) {
          console.error(`✗ Error processing ${data.fileName}:`, error.message);
          totalErrors++;
        }
      }

      // After all data is processed, calculate difficulty scores
      console.log('Calculating difficulty scores for all flights...');
      await this.calculateDifficultyScores(userId);

      console.log(`Data processing complete: ${totalProcessed} records processed, ${totalErrors} errors`);
      return { totalProcessed, totalErrors };
    } catch (error) {
      console.error('Error in processAllStoredData:', error);
      throw error;
    }
  }

  // Process specific data type
  static async processDataByType(uploadedData, userId) {
    const { dataType, rawData } = uploadedData;
    const uid = userId || uploadedData.userId;
    let processed = 0;
    let errors = 0;
    let errorDetails = [];

    console.log(`Processing ${dataType} data with ${rawData.length} records...`);

    switch (dataType) {
      case 'flights':
        const flightResult = await this.processFlightData(rawData, uid);
        processed += flightResult.processed;
        errors += flightResult.errors;
        if (flightResult.errorDetails) {
          errorDetails = errorDetails.concat(flightResult.errorDetails);
        }
        break;

      case 'pnr':
        const pnrResult = await this.processPNRData(rawData, uid);
        processed += pnrResult.processed;
        errors += pnrResult.errors;
        if (pnrResult.errorDetails) {
          errorDetails = errorDetails.concat(pnrResult.errorDetails);
        }
        break;

      case 'pnr-remarks':
        const remarkResult = await this.processPNRRemarkData(rawData, uid);
        processed += remarkResult.processed;
        errors += remarkResult.errors;
        if (remarkResult.errorDetails) {
          errorDetails = errorDetails.concat(remarkResult.errorDetails);
        }
        break;

      case 'bags':
        const bagResult = await this.processBagData(rawData, uid);
        processed += bagResult.processed;
        errors += bagResult.errors;
        if (bagResult.errorDetails) {
          errorDetails = errorDetails.concat(bagResult.errorDetails);
        }
        break;

      case 'airports':
        const airportResult = await this.processAirportData(rawData, uid);
        processed += airportResult.processed;
        errors += airportResult.errors;
        if (airportResult.errorDetails) {
          errorDetails = errorDetails.concat(airportResult.errorDetails);
        }
        break;

      default:
        console.warn(`Unknown data type: ${dataType}`);
    }

    // Log first few errors for debugging
    if (errorDetails.length > 0) {
      console.log(`First few errors for ${dataType}:`, errorDetails.slice(0, 3));
    }

    return { processed, errors, errorDetails };
  }

  // Process flight data
  static async processFlightData(rawData, userId) {
    let processed = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`Processing ${rawData.length} flight records...`);
    console.log('Sample record keys:', Object.keys(rawData[0] || {}));

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        // Check for required fields
        if (!row.company_id || !row.flight_number) {
          throw new Error(`Missing required fields: company_id=${row.company_id}, flight_number=${row.flight_number}`);
        }

        const flightData = {
          userId: userId || undefined,
          company_id: String(row.company_id || ''),
          flight_number: String(row.flight_number || ''),
          scheduled_departure_date_local: this.parseDate(row.scheduled_departure_date_local),
          scheduled_departure_station_code: String(row.scheduled_departure_station_code || 'UNKNOWN'),
          scheduled_arrival_station_code: String(row.scheduled_arrival_station_code || 'UNKNOWN'),
          scheduled_departure_datetime_local: this.parseDate(row.scheduled_departure_datetime_local),
          scheduled_arrival_datetime_local: this.parseDate(row.scheduled_arrival_datetime_local),
          actual_departure_datetime_local: row.actual_departure_datetime_local ? this.parseDate(row.actual_departure_datetime_local) : null,
          actual_arrival_datetime_local: row.actual_arrival_datetime_local ? this.parseDate(row.actual_arrival_datetime_local) : null,
          total_seats: this.parseInt(row.total_seats) || 0,
          fleet_type: String(row.fleet_type || ''),
          carrier: String(row.carrier || 'Mainline'),
          scheduled_ground_time_minutes: this.parseInt(row.scheduled_ground_time_minutes) || 0,
          actual_ground_time_minutes: row.actual_ground_time_minutes ? this.parseInt(row.actual_ground_time_minutes) : null,
          minimum_turn_minutes: this.parseInt(row.minimum_turn_minutes) || 0
        };

        // Calculate derived fields
        if (flightData.actual_departure_datetime_local && flightData.scheduled_departure_datetime_local) {
          flightData.departure_delay_minutes = moment(flightData.actual_departure_datetime_local)
            .diff(moment(flightData.scheduled_departure_datetime_local), 'minutes');
        }

        if (flightData.scheduled_ground_time_minutes && flightData.minimum_turn_minutes) {
          flightData.ground_time_ratio = flightData.scheduled_ground_time_minutes / flightData.minimum_turn_minutes;
        }

        await Flight.create(flightData);
        processed++;
      } catch (error) {
        console.error(`Error processing flight row ${i}:`, error.message);
        console.error('Row data:', row);
        errorDetails.push({ row: i, error: error.message, data: row });
        errors++;
      }
    }

    console.log(`Flight processing complete: ${processed} processed, ${errors} errors`);
    if (errorDetails.length > 0) {
      console.log('First few errors:', errorDetails.slice(0, 3));
    }

    return { processed, errors, errorDetails };
  }

  // Process PNR data
  static async processPNRData(rawData, userId) {
    let processed = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`Processing ${rawData.length} PNR records...`);
    if (rawData.length > 0) {
      console.log('PNR CSV keys:', Object.keys(rawData[0]));
    }

    for (let i = 0; i < rawData.length; i++) {
      try {
        // Normalize keys to handle header variations
        const norm = this.normalizeRowKeys(rawData[i]);

        const pnr_id = this.pick(norm, ['pnr_id', 'pnr', 'pnr_number', 'record_locator']);
        const company_id = this.pick(norm, ['company_id', 'company', 'airline', 'carrier']) || 'UA';
        const flight_number = this.pick(norm, ['flight_number', 'flight_num', 'flight']);

        // Check for required fields
        if (!pnr_id || !flight_number) {
          throw new Error(`Missing required fields: pnr_id=${pnr_id}, flight_number=${flight_number}`);
        }

        const pnrData = {
          userId: userId || undefined,
          pnr_id: String(pnr_id),
          company_id: String(company_id),
          flight_number: String(flight_number),
          scheduled_departure_date_local: this.parseDate(this.pick(norm, ['scheduled_departure_date_local', 'departure_date', 'date', 'pnr_creation_date'])),
          passenger_count: this.parseInt(this.pick(norm, ['passenger_count', 'pax_count', 'passengers'])) || 1,
          special_service_requests: this.parseInt(this.pick(norm, ['special_service_requests', 'ssr', 'ssr_count'])) || 0,
          meal_preference: String(this.pick(norm, ['meal_preference', 'meal', 'meal_type']) || 'Standard'),
          wheelchair_assistance: this.parseInt(this.pick(norm, ['wheelchair_assistance', 'wheelchair'])) || 0,
          unaccompanied_minor: this.parseInt(this.pick(norm, ['unaccompanied_minor', 'umnr'])) || 0,
          pet_travel: this.parseInt(this.pick(norm, ['pet_travel', 'pet', 'pets'])) || 0,
          group_booking: this.parseInt(this.pick(norm, ['group_booking', 'group'])) || 0
        };

        await PNR.create(pnrData);
        processed++;
      } catch (error) {
        if (i < 3) console.error(`Error processing PNR row ${i}:`, error.message);
        errorDetails.push({ row: i, error: error.message, data: rawData[i] });
        errors++;
      }
    }

    console.log(`PNR processing complete: ${processed} processed, ${errors} errors`);
    return { processed, errors, errorDetails };
  }

  // Process PNR remark data
  static async processPNRRemarkData(rawData, userId) {
    let processed = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`Processing ${rawData.length} PNR remark records...`);
    if (rawData.length > 0) {
      console.log('PNR Remark CSV keys:', Object.keys(rawData[0]));
    }

    for (let i = 0; i < rawData.length; i++) {
      try {
        const norm = this.normalizeRowKeys(rawData[i]);

        const pnr_id = this.pick(norm, ['pnr_id', 'pnr', 'record_locator', 'pnr_number']);
        const remark_code = this.pick(norm, ['remark_code', 'special_service_request', 'ssr', 'ssr_code', 'service_request']);

        if (!pnr_id || !remark_code) {
          throw new Error(`Missing required fields: pnr_id=${pnr_id}, remark_code=${remark_code}`);
        }

        const remark_text = this.pick(norm, ['remark_text', 'special_service_request', 'ssr', 'description', 'remark']) || remark_code;
        const flight_number = this.pick(norm, ['flight_number', 'flight_num', 'flight']) || '';
        const created_date_raw = this.pick(norm, ['created_date', 'pnr_creation_date', 'creation_date', 'date']);

        // Determine category from remark text
        let remark_category = this.pick(norm, ['remark_category', 'category']) || 'General';
        const remarkLower = remark_text.toLowerCase();
        if (remarkLower.includes('wheelchair')) remark_category = 'Wheelchair';
        else if (remarkLower.includes('meal') || remarkLower.includes('food')) remark_category = 'Meal';
        else if (remarkLower.includes('pet') || remarkLower.includes('animal')) remark_category = 'Pet';
        else if (remarkLower.includes('minor') || remarkLower.includes('child')) remark_category = 'Minor';
        else if (remarkLower.includes('medical')) remark_category = 'Medical';
        else if (remarkLower.includes('bassinet')) remark_category = 'Bassinet';
        else if (remarkLower.includes('blind') || remarkLower.includes('deaf')) remark_category = 'Disability';
        else if (remarkLower.includes('oxygen')) remark_category = 'Medical';
        else if (remarkLower !== 'general') remark_category = 'Special Service';

        const remarkData = {
          userId: userId || undefined,
          pnr_id: String(pnr_id),
          remark_code: String(remark_code),
          remark_text: String(remark_text),
          remark_category: remark_category,
          priority_level: this.pick(norm, ['priority_level', 'priority']) || 'Medium',
          created_date: this.parseDate(created_date_raw) || new Date(),
          resolved_date: this.pick(norm, ['resolved_date']) ? this.parseDate(this.pick(norm, ['resolved_date'])) : null,
          status: this.pick(norm, ['status']) || 'Active'
        };

        await PNRRemark.create(remarkData);
        processed++;
      } catch (error) {
        if (i < 3) console.error(`Error processing PNR remark row ${i}:`, error.message);
        errorDetails.push({ row: i, error: error.message, data: rawData[i] });
        errors++;
      }
    }

    console.log(`PNR remark processing complete: ${processed} processed, ${errors} errors`);
    return { processed, errors, errorDetails };
  }

  // Process bag data
  static async processBagData(rawData, userId) {
    let processed = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`Processing ${rawData.length} bag records...`);
    if (rawData.length > 0) {
      console.log('Bag CSV keys:', Object.keys(rawData[0]));
    }

    for (let i = 0; i < rawData.length; i++) {
      try {
        // Normalize keys to handle header variations
        const norm = this.normalizeRowKeys(rawData[i]);

        // Map CSV headers to expected field names using aliases
        const bag_tag_unique_number = this.pick(norm, ['bag_tag_unique_number', 'bag_id', 'bag_tag', 'bag_number']);
        const flight_number = this.pick(norm, ['flight_number', 'flight_num', 'flight']);
        const bag_type = this.pick(norm, ['bag_type', 'type']) || 'Checked';
        const company_id = this.pick(norm, ['company_id', 'company', 'airline']) || '';
        const scheduled_departure_date_local = this.pick(norm, ['scheduled_departure_date_local', 'departure_date', 'check_in_time', 'checkin_time']);
        const bag_tag_issue_date = this.pick(norm, ['bag_tag_issue_date', 'issue_date', 'check_in_time', 'checkin_time']);

        // Required: bag ID and flight number
        if (!bag_tag_unique_number || !flight_number) {
          throw new Error(
            `Missing required fields: bag_tag_unique_number=${bag_tag_unique_number}, flight_number=${flight_number}`
          );
        }

        const parsedDepartureDate = scheduled_departure_date_local ? this.parseDate(scheduled_departure_date_local) : null;
        const parsedIssueDate = bag_tag_issue_date ? this.parseDate(bag_tag_issue_date) : null;

        const bagData = {
          userId: userId || undefined,
          company_id: String(company_id),
          flight_number: String(flight_number),
          scheduled_departure_date_local: parsedDepartureDate || parsedIssueDate || new Date(),
          scheduled_departure_station_code: String(this.pick(norm, ['scheduled_departure_station_code', 'departure_station']) || ''),
          scheduled_arrival_station_code: String(this.pick(norm, ['scheduled_arrival_station_code', 'arrival_station']) || ''),
          bag_tag_unique_number: String(bag_tag_unique_number),
          bag_tag_issue_date: parsedIssueDate,
          bag_type: String(bag_type),
          is_hot_transfer:
            String(bag_type).toLowerCase() === 'transfer' &&
              parsedIssueDate && parsedDepartureDate
              ? (moment(parsedIssueDate).diff(moment(parsedDepartureDate), 'minutes') < 30)
              : false,
        };

        await Bag.create(bagData);
        processed++;
      } catch (error) {
        if (i < 3) console.error(`Error processing bag row ${i}:`, error.message);
        errorDetails.push({ row: i, error: error.message, data: rawData[i] });
        errors++;
      }
    }

    console.log(`Bag processing complete: ${processed} processed, ${errors} errors`);
    return { processed, errors, errorDetails };
  }

  // Process airport data
  static async processAirportData(rawData, userId) {
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`Processing ${rawData.length} airport records...`);

    for (let i = 0; i < rawData.length; i++) {
      // Normalize keys to handle header variations (spaces, case, BOM)
      const norm = this.normalizeRowKeys(rawData[i]);
      const airport_iata_code = this.pick(norm, ['airport_iata_code', 'iata_code', 'airport_code', 'airport_iata']);
      const iso_country_code = this.pick(norm, ['iso_country_code', 'country_code', 'iso_country', 'country']);
      try {
        // Check for required fields
        if (!airport_iata_code || !iso_country_code) {
          throw new Error(`Missing required fields: airport_iata_code=${airport_iata_code}, iso_country_code=${iso_country_code}`);
        }

        // Use upsert to handle duplicate IATA codes gracefully
        const result = await Airport.findOneAndUpdate(
          { airport_iata_code: String(airport_iata_code) },
          {
            $set: {
              userId: userId || undefined,
              airport_iata_code: String(airport_iata_code),
              iso_country_code: String(iso_country_code)
            }
          },
          { upsert: true, new: true }
        );
        processed++;
      } catch (error) {
        if (i < 3) console.error(`Error processing airport row ${i}:`, error.message);
        errorDetails.push({ row: i, error: error.message, data: norm });
        errors++;
      }
    }

    console.log(`Airport processing complete: ${processed} processed, ${skipped} duplicates skipped, ${errors} errors`);
    return { processed, errors, errorDetails };
  }

  // Parse integer with fallback
  static parseInt(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Parse float with fallback
  static parseFloat(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Parse date with fallback
  static parseDate(dateString) {
    if (!dateString) return null;

    // If it's already a Date object, return it
    if (dateString instanceof Date) {
      return dateString;
    }

    // Try explicit date formats first to avoid deprecation warnings
    const formats = [
      'YYYY-MM-DD',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD HH:mm:ss'
    ];

    for (const format of formats) {
      const parsedFormat = moment(dateString, format, true);
      if (parsedFormat.isValid()) {
        return parsedFormat.toDate();
      }
    }

    // Fallback: try moment generic parsing
    const parsed = moment(dateString);
    if (parsed.isValid()) {
      return parsed.toDate();
    }

    // Fallback to native Date
    const fallback = new Date(dateString);
    if (!isNaN(fallback.getTime())) {
      return fallback;
    }

    console.warn(`Could not parse date: ${dateString}`);
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DIFFICULTY SCORE CALCULATION
  // Formula from README: 6 weighted factors, each scored 0-100
  //   Delay Factor          (25%)  — departure delay minutes
  //   Ground Time Constraint(20%)  — scheduled vs minimum turn time ratio
  //   Passenger Load Factor (15%)  — aircraft capacity utilization
  //   Special Service Reqs  (15%)  — wheelchair, unaccompanied minors, etc.
  //   Bag Complexity        (15%)  — transfer bags, hot transfers, volume
  //   Aircraft Type Factor  (10%)  — fleet type and carrier complexity
  // ═══════════════════════════════════════════════════════════════════════
  static async calculateDifficultyScores(userId) {
    try {
      const filter = userId ? { userId } : {};
      const flights = await Flight.find(filter).lean();

      if (flights.length === 0) {
        console.log('No flights to score.');
        return;
      }

      console.log(`Scoring ${flights.length} flights...`);

      // --- Step 1: Aggregate PNR passenger data per flight ---
      const pnrAgg = await PNR.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { flight_number: '$flight_number', date: '$scheduled_departure_date_local' },
            total_passengers: { $sum: '$passenger_count' },
            wheelchair_requests: { $sum: '$wheelchair_assistance' },
            unaccompanied_minors: { $sum: '$unaccompanied_minor' },
            special_service_requests: { $sum: '$special_service_requests' }
          }
        }
      ]);
      const pnrMap = {};
      for (const p of pnrAgg) {
        const key = `${p._id.flight_number}`;
        pnrMap[key] = p;
      }

      // --- Step 2: Aggregate bag data per flight ---
      const bagAgg = await Bag.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$flight_number',
            total_bags: { $sum: 1 },
            checked_bags: { $sum: { $cond: [{ $eq: ['$bag_type', 'Checked'] }, 1, 0] } },
            transfer_bags: { $sum: { $cond: [{ $eq: ['$bag_type', 'Transfer'] }, 1, 0] } },
            hot_transfer_bags: { $sum: { $cond: ['$is_hot_transfer', 1, 0] } }
          }
        }
      ]);
      const bagMap = {};
      for (const b of bagAgg) {
        bagMap[b._id] = b;
      }

      // --- Step 3: Aggregate special service remarks per flight ---
      const remarkAgg = await PNRRemark.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$flight_number',
            remark_count: { $sum: 1 },
            wheelchair_remarks: {
              $sum: { $cond: [{ $eq: ['$special_service_request', 'Airport Wheelchair'] }, 1, 0] }
            },
            umnr_remarks: {
              $sum: { $cond: [{ $eq: ['$special_service_request', 'Unaccompanied Minor'] }, 1, 0] }
            }
          }
        }
      ]);
      const remarkMap = {};
      for (const r of remarkAgg) {
        remarkMap[r._id] = r;
      }

      // --- Step 4: Score each flight ---
      const bulkOps = [];
      const scores = [];

      for (const flight of flights) {
        const fn = flight.flight_number;
        const pnr = pnrMap[fn] || {};
        const bags = bagMap[fn] || {};
        const remarks = remarkMap[fn] || {};

        // Enrich flight data
        const totalPassengers = pnr.total_passengers || flight.total_passengers || 0;
        const totalSeats = flight.total_seats || 1;
        const loadFactor = totalSeats > 0 ? totalPassengers / totalSeats : 0;
        const totalBags = bags.total_bags || flight.total_bags || 0;
        const transferBags = bags.transfer_bags || flight.transfer_bags || 0;
        const hotTransferBags = bags.hot_transfer_bags || flight.hot_transfer_bags || 0;
        const checkedBags = bags.checked_bags || flight.checked_bags || 0;
        const ssrCount = (pnr.special_service_requests || 0) + (remarks.remark_count || 0);
        const wheelchairReqs = (pnr.wheelchair_requests || 0) + (remarks.wheelchair_remarks || 0);
        const umnrCount = (pnr.unaccompanied_minors || 0) + (remarks.umnr_remarks || 0);

        // ---- Factor 1: Delay (25%) — scored 0-100 ----
        const delayMin = flight.departure_delay_minutes || 0;
        let delayScore = 0;
        if (delayMin <= 0) delayScore = 0;
        else if (delayMin <= 15) delayScore = 20;
        else if (delayMin <= 30) delayScore = 40;
        else if (delayMin <= 60) delayScore = 60;
        else if (delayMin <= 120) delayScore = 80;
        else delayScore = 100;

        // ---- Factor 2: Ground Time Constraint (20%) — scored 0-100 ----
        const groundTimeRatio = flight.ground_time_ratio || 
          (flight.minimum_turn_minutes > 0 ? flight.scheduled_ground_time_minutes / flight.minimum_turn_minutes : 2);
        let groundTimeScore = 0;
        if (groundTimeRatio >= 2.0) groundTimeScore = 0;
        else if (groundTimeRatio >= 1.5) groundTimeScore = 20;
        else if (groundTimeRatio >= 1.2) groundTimeScore = 40;
        else if (groundTimeRatio >= 1.0) groundTimeScore = 60;
        else if (groundTimeRatio >= 0.8) groundTimeScore = 80;
        else groundTimeScore = 100;

        // ---- Factor 3: Passenger Load (15%) — scored 0-100 ----
        let loadScore = 0;
        if (loadFactor < 0.7) loadScore = 0;
        else if (loadFactor < 0.8) loadScore = 20;
        else if (loadFactor < 0.9) loadScore = 40;
        else if (loadFactor < 0.95) loadScore = 60;
        else if (loadFactor < 1.0) loadScore = 80;
        else loadScore = 100;

        // ---- Factor 4: Special Service Requests (15%) — scored 0-100 ----
        const ssrRatio = totalPassengers > 0 ? ssrCount / totalPassengers : 0;
        let ssrScore = 0;
        if (ssrRatio === 0) ssrScore = 0;
        else if (ssrRatio < 0.05) ssrScore = 20;
        else if (ssrRatio < 0.10) ssrScore = 40;
        else if (ssrRatio < 0.15) ssrScore = 60;
        else if (ssrRatio < 0.20) ssrScore = 80;
        else ssrScore = 100;

        // ---- Factor 5: Bag Complexity (15%) — scored 0-100 ----
        let bagScore = 0;
        if (totalBags > 0) {
          const transferRatio = transferBags / totalBags;
          const bagsPerPax = totalPassengers > 0 ? totalBags / totalPassengers : 0;

          if (transferRatio > 0.3) bagScore += 30;
          else if (transferRatio > 0.2) bagScore += 15;

          if (bagsPerPax > 1.5) bagScore += 40;
          else if (bagsPerPax > 1.2) bagScore += 20;
          else if (bagsPerPax > 1.0) bagScore += 10;

          if (hotTransferBags > 5) bagScore += 30;
          else if (hotTransferBags > 0) bagScore += 15;
        }
        bagScore = Math.min(bagScore, 100);

        // ---- Factor 6: Aircraft Type (10%) — scored 0-100 ----
        const fleetType = flight.fleet_type || '';
        const carrier = flight.carrier || '';
        let aircraftScore = 10; // base
        if (carrier === 'Express') aircraftScore = 60;
        else if (fleetType.includes('787') || fleetType.includes('777')) aircraftScore = 40;
        else if (fleetType.includes('767') || fleetType.includes('757')) aircraftScore = 30;
        else if (fleetType.includes('737') || fleetType.includes('A320')) aircraftScore = 20;

        // ---- Weighted total ----
        const difficultyScore = (
          delayScore * 0.25 +
          groundTimeScore * 0.20 +
          loadScore * 0.15 +
          ssrScore * 0.15 +
          bagScore * 0.15 +
          aircraftScore * 0.10
        );

        scores.push({ id: flight._id, score: difficultyScore });

        bulkOps.push({
          updateOne: {
            filter: { _id: flight._id },
            update: {
              $set: {
                difficulty_score: Math.round(difficultyScore * 10) / 10,
                total_passengers: totalPassengers,
                load_factor: Math.round(loadFactor * 1000) / 1000,
                total_bags: totalBags,
                checked_bags: checkedBags,
                transfer_bags: transferBags,
                hot_transfer_bags: hotTransferBags,
                special_service_requests: ssrCount,
                wheelchair_requests: wheelchairReqs,
                unaccompanied_minors: umnrCount
              }
            }
          }
        });
      }

      // --- Step 5: Assign ranks and categories (percentile-based) ---
      scores.sort((a, b) => b.score - a.score);
      const total = scores.length;

      for (let i = 0; i < scores.length; i++) {
        const percentile = i / total;
        let category;
        if (percentile < 0.33) category = 'Difficult';
        else if (percentile < 0.67) category = 'Medium';
        else category = 'Easy';

        bulkOps.push({
          updateOne: {
            filter: { _id: scores[i].id },
            update: {
              $set: {
                difficulty_rank: i + 1,
                difficulty_category: category
              }
            }
          }
        });
      }

      // Execute all updates in bulk
      if (bulkOps.length > 0) {
        await Flight.bulkWrite(bulkOps);
      }

      const avgScore = scores.reduce((s, x) => s + x.score, 0) / total;
      console.log(`✓ Scored ${total} flights. Avg difficulty: ${avgScore.toFixed(1)}`);
      console.log(`  Top score: ${scores[0]?.score.toFixed(1)}, Bottom: ${scores[scores.length - 1]?.score.toFixed(1)}`);

    } catch (error) {
      console.error('Error calculating difficulty scores:', error);
    }
  }

  // Clear all processed data (for testing)
  static async clearAllProcessedData(userId) {
    try {
      const filter = userId ? { userId } : {};
      await Promise.all([
        Flight.deleteMany(filter),
        PNR.deleteMany(filter),
        PNRRemark.deleteMany(filter),
        Bag.deleteMany(filter),
        Airport.deleteMany(filter),
        UploadedData.deleteMany(filter)
      ]);
      console.log(`All data cleared for user ${userId || 'ALL'}`);
    } catch (error) {
      console.error('Error clearing processed data:', error);
      throw error;
    }
  }

  // Get processing status
  static async getProcessingStatus(userId) {
    try {
      const filter = userId ? { userId } : {};
      const counts = await Promise.all([
        Flight.countDocuments(filter),
        PNR.countDocuments(filter),
        PNRRemark.countDocuments(filter),
        Bag.countDocuments(filter),
        Airport.countDocuments(filter),
        UploadedData.countDocuments(filter)
      ]);

      return {
        flights: counts[0],
        pnr: counts[1],
        pnrRemarks: counts[2],
        bags: counts[3],
        airports: counts[4],
        uploadedData: counts[5]
      };
    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  }
}

module.exports = DataProcessor;
