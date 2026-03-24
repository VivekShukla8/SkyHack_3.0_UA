const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const moment = require('moment');

/**
 * Data Processing Script for United Airlines Flight Difficulty Score System
 * 
 * This script processes the provided CSV files and prepares them for import
 * into the MongoDB database. It handles data cleaning, validation, and
 * aggregation of related data.
 */

class DataProcessor {
  constructor() {
    this.processedData = {
      flights: [],
      pnrs: [],
      pnrRemarks: [],
      bags: [],
      airports: []
    };
    this.errors = [];
  }

  async processAllFiles() {
    console.log('Starting data processing...');
    
    try {
      // Process files in order
      await this.processAirports();
      await this.processFlights();
      await this.processPNRs();
      await this.processPNRRemarks();
      await this.processBags();
      
      // Aggregate data
      await this.aggregateFlightData();
      
      console.log('Data processing completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  }

  async processAirports() {
    console.log('Processing airports data...');
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('Airports Data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const airport = {
              airport_iata_code: row.airport_iata_code,
              iso_country_code: row.iso_country_code
            };
            results.push(airport);
          } catch (error) {
            this.errors.push({ file: 'Airports Data.csv', row, error: error.message });
          }
        })
        .on('end', () => {
          this.processedData.airports = results;
          console.log(`Processed ${results.length} airports`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processFlights() {
    console.log('Processing flight data...');
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('Flight Level Data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const flight = {
              company_id: row.company_id,
              flight_number: row.flight_number,
              scheduled_departure_date_local: moment(row.scheduled_departure_date_local).toDate(),
              scheduled_departure_station_code: row.scheduled_departure_station_code,
              scheduled_arrival_station_code: row.scheduled_arrival_station_code,
              scheduled_departure_datetime_local: moment(row.scheduled_departure_datetime_local).toDate(),
              scheduled_arrival_datetime_local: moment(row.scheduled_arrival_datetime_local).toDate(),
              actual_departure_datetime_local: row.actual_departure_datetime_local ? 
                moment(row.actual_departure_datetime_local).toDate() : null,
              actual_arrival_datetime_local: row.actual_arrival_datetime_local ? 
                moment(row.actual_arrival_datetime_local).toDate() : null,
              total_seats: parseInt(row.total_seats),
              fleet_type: row.fleet_type,
              carrier: row.carrier,
              scheduled_ground_time_minutes: parseInt(row.scheduled_ground_time_minutes),
              actual_ground_time_minutes: row.actual_ground_time_minutes ? 
                parseInt(row.actual_ground_time_minutes) : null,
              minimum_turn_minutes: parseInt(row.minimum_turn_minutes)
            };

            // Calculate derived fields
            if (flight.actual_departure_datetime_local && flight.scheduled_departure_datetime_local) {
              flight.departure_delay_minutes = moment(flight.actual_departure_datetime_local)
                .diff(moment(flight.scheduled_departure_datetime_local), 'minutes');
            }

            if (flight.scheduled_ground_time_minutes && flight.minimum_turn_minutes) {
              flight.ground_time_ratio = flight.scheduled_ground_time_minutes / flight.minimum_turn_minutes;
            }

            results.push(flight);
          } catch (error) {
            this.errors.push({ file: 'Flight Level Data.csv', row, error: error.message });
          }
        })
        .on('end', () => {
          this.processedData.flights = results;
          console.log(`Processed ${results.length} flights`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processPNRs() {
    console.log('Processing PNR data...');
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('PNR+Flight+Level+Data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const pnr = {
              company_id: row.company_id,
              flight_number: row.flight_number,
              scheduled_departure_date_local: moment(row.scheduled_departure_date_local).toDate(),
              scheduled_departure_station_code: row.scheduled_departure_station_code,
              scheduled_arrival_station_code: row.scheduled_arrival_station_code,
              record_locator: row.record_locator,
              pnr_creation_date: moment(row.pnr_creation_date).toDate(),
              total_pax: parseInt(row.total_pax),
              lap_child_count: parseInt(row.lap_child_count) || 0,
              is_child: row.is_child,
              basic_economy_pax: parseInt(row.basic_economy_pax) || 0,
              is_stroller_user: row.is_stroller_user
            };
            results.push(pnr);
          } catch (error) {
            this.errors.push({ file: 'PNR+Flight+Level+Data.csv', row, error: error.message });
          }
        })
        .on('end', () => {
          this.processedData.pnrs = results;
          console.log(`Processed ${results.length} PNRs`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processPNRRemarks() {
    console.log('Processing PNR remarks data...');
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('PNR Remark Level Data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const remark = {
              record_locator: row.record_locator,
              pnr_creation_date: moment(row.pnr_creation_date).toDate(),
              flight_number: row.flight_number,
              special_service_request: row.special_service_request,
              request_type: this.categorizeSpecialRequest(row.special_service_request)
            };
            results.push(remark);
          } catch (error) {
            this.errors.push({ file: 'PNR Remark Level Data.csv', row, error: error.message });
          }
        })
        .on('end', () => {
          this.processedData.pnrRemarks = results;
          console.log(`Processed ${results.length} PNR remarks`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processBags() {
    console.log('Processing bag data...');
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream('Bag+Level+Data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const bag = {
              company_id: row.company_id,
              flight_number: row.flight_number,
              scheduled_departure_date_local: moment(row.scheduled_departure_date_local).toDate(),
              scheduled_departure_station_code: row.scheduled_departure_station_code,
              scheduled_arrival_station_code: row.scheduled_arrival_station_code,
              bag_tag_unique_number: row.bag_tag_unique_number,
              bag_tag_issue_date: moment(row.bag_tag_issue_date).toDate(),
              bag_type: row.bag_type,
              is_hot_transfer: row.bag_type === 'Transfer' && 
                moment(row.bag_tag_issue_date).diff(moment(row.scheduled_departure_date_local), 'minutes') < 30
            };
            results.push(bag);
          } catch (error) {
            this.errors.push({ file: 'Bag+Level+Data.csv', row, error: error.message });
          }
        })
        .on('end', () => {
          this.processedData.bags = results;
          console.log(`Processed ${results.length} bags`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async aggregateFlightData() {
    console.log('Aggregating flight data...');
    
    // Create maps for efficient lookups
    const pnrMap = new Map();
    const remarkMap = new Map();
    const bagMap = new Map();

    // Group PNRs by flight
    this.processedData.pnrs.forEach(pnr => {
      const key = `${pnr.flight_number}_${moment(pnr.scheduled_departure_date_local).format('YYYY-MM-DD')}`;
      if (!pnrMap.has(key)) pnrMap.set(key, []);
      pnrMap.get(key).push(pnr);
    });

    // Group remarks by flight
    this.processedData.pnrRemarks.forEach(remark => {
      const key = `${remark.flight_number}_${moment(remark.pnr_creation_date).format('YYYY-MM-DD')}`;
      if (!remarkMap.has(key)) remarkMap.set(key, []);
      remarkMap.get(key).push(remark);
    });

    // Group bags by flight
    this.processedData.bags.forEach(bag => {
      const key = `${bag.flight_number}_${moment(bag.scheduled_departure_date_local).format('YYYY-MM-DD')}`;
      if (!bagMap.has(key)) bagMap.set(key, []);
      bagMap.get(key).push(bag);
    });

    // Aggregate data for each flight
    this.processedData.flights.forEach(flight => {
      const key = `${flight.flight_number}_${moment(flight.scheduled_departure_date_local).format('YYYY-MM-DD')}`;
      
      // Aggregate PNR data
      const flightPnrs = pnrMap.get(key) || [];
      const pnrAggregate = flightPnrs.reduce((acc, pnr) => {
        acc.totalPassengers += pnr.total_pax;
        acc.childrenCount += pnr.is_child === 'Y' ? pnr.total_pax : 0;
        acc.basicEconomyCount += pnr.basic_economy_pax;
        acc.strollerUsers += pnr.is_stroller_user === 'Y' ? pnr.total_pax : 0;
        acc.lapChildren += pnr.lap_child_count;
        return acc;
      }, {
        totalPassengers: 0,
        childrenCount: 0,
        basicEconomyCount: 0,
        strollerUsers: 0,
        lapChildren: 0
      });

      // Aggregate special service requests
      const flightRemarks = remarkMap.get(key) || [];
      const remarkAggregate = flightRemarks.reduce((acc, remark) => {
        acc.totalRequests++;
        if (remark.special_service_request === 'Airport Wheelchair') acc.wheelchairRequests++;
        if (remark.special_service_request === 'Unaccompanied Minor') acc.unaccompaniedMinors++;
        return acc;
      }, {
        totalRequests: 0,
        wheelchairRequests: 0,
        unaccompaniedMinors: 0
      });

      // Aggregate bag data
      const flightBags = bagMap.get(key) || [];
      const bagAggregate = flightBags.reduce((acc, bag) => {
        acc.totalBags++;
        if (bag.bag_type === 'Checked') acc.checkedBags++;
        if (bag.bag_type === 'Transfer') acc.transferBags++;
        if (bag.is_hot_transfer) acc.hotTransferBags++;
        return acc;
      }, {
        totalBags: 0,
        checkedBags: 0,
        transferBags: 0,
        hotTransferBags: 0
      });

      // Update flight with aggregated data
      flight.total_passengers = pnrAggregate.totalPassengers;
      flight.children_count = pnrAggregate.childrenCount;
      flight.basic_economy_count = pnrAggregate.basicEconomyCount;
      flight.stroller_users = pnrAggregate.strollerUsers;
      flight.lap_children = pnrAggregate.lapChildren;
      flight.special_service_requests = remarkAggregate.totalRequests;
      flight.wheelchair_requests = remarkAggregate.wheelchairRequests;
      flight.unaccompanied_minors = remarkAggregate.unaccompaniedMinors;
      flight.total_bags = bagAggregate.totalBags;
      flight.checked_bags = bagAggregate.checkedBags;
      flight.transfer_bags = bagAggregate.transferBags;
      flight.hot_transfer_bags = bagAggregate.hotTransferBags;
      flight.load_factor = pnrAggregate.totalPassengers ? 
        (pnrAggregate.totalPassengers / flight.total_seats) : 0;
    });

    console.log('Flight data aggregation completed');
  }

  categorizeSpecialRequest(request) {
    if (request.toLowerCase().includes('wheelchair')) return 'Wheelchair';
    if (request.toLowerCase().includes('minor')) return 'Unaccompanied Minor';
    return 'Other';
  }

  printSummary() {
    console.log('\n=== Data Processing Summary ===');
    console.log(`Airports: ${this.processedData.airports.length}`);
    console.log(`Flights: ${this.processedData.flights.length}`);
    console.log(`PNRs: ${this.processedData.pnrs.length}`);
    console.log(`PNR Remarks: ${this.processedData.pnrRemarks.length}`);
    console.log(`Bags: ${this.processedData.bags.length}`);
    console.log(`Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n=== Errors ===');
      this.errors.slice(0, 10).forEach(error => {
        console.log(`${error.file}: ${error.error}`);
      });
      if (this.errors.length > 10) {
        console.log(`... and ${this.errors.length - 10} more errors`);
      }
    }
  }

  saveProcessedData() {
    const outputDir = 'processed-data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    Object.keys(this.processedData).forEach(key => {
      const filename = path.join(outputDir, `${key}.json`);
      fs.writeFileSync(filename, JSON.stringify(this.processedData[key], null, 2));
      console.log(`Saved ${key} data to ${filename}`);
    });

    if (this.errors.length > 0) {
      const errorFilename = path.join(outputDir, 'errors.json');
      fs.writeFileSync(errorFilename, JSON.stringify(this.errors, null, 2));
      console.log(`Saved errors to ${errorFilename}`);
    }
  }
}

// Run the processor if this file is executed directly
if (require.main === module) {
  const processor = new DataProcessor();
  processor.processAllFiles()
    .then(() => {
      processor.saveProcessedData();
      console.log('\nData processing completed successfully!');
    })
    .catch(error => {
      console.error('Data processing failed:', error);
      process.exit(1);
    });
}

module.exports = DataProcessor;
