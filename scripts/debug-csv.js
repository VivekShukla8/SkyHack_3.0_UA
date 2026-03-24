const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');

/**
 * Debug script to check CSV file format and identify issues
 */

function debugCSV(filePath, maxRows = 10) {
  console.log(`Debugging CSV file: ${filePath}`);
  console.log('='.repeat(50));
  
  let rowCount = 0;
  let errorCount = 0;
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        if (rowCount <= maxRows) {
          console.log(`\nRow ${rowCount}:`);
          console.log('Headers:', Object.keys(row));
          console.log('Sample data:', {
            company_id: row.company_id,
            flight_number: row.flight_number,
            scheduled_departure_date_local: row.scheduled_departure_date_local,
            scheduled_departure_datetime_local: row.scheduled_departure_datetime_local,
            total_seats: row.total_seats,
            fleet_type: row.fleet_type,
            carrier: row.carrier
          });
        }

        // Test date parsing
        try {
          if (row.scheduled_departure_date_local) {
            const date = moment(row.scheduled_departure_date_local);
            if (!date.isValid()) {
              errors.push(`Row ${rowCount}: Invalid date - ${row.scheduled_departure_date_local}`);
              errorCount++;
            }
          }
        } catch (error) {
          errors.push(`Row ${rowCount}: Date parsing error - ${error.message}`);
          errorCount++;
        }

        // Test number parsing
        try {
          if (row.total_seats) {
            const seats = parseInt(row.total_seats);
            if (isNaN(seats)) {
              errors.push(`Row ${rowCount}: Invalid total_seats - ${row.total_seats}`);
              errorCount++;
            }
          }
        } catch (error) {
          errors.push(`Row ${rowCount}: Number parsing error - ${error.message}`);
          errorCount++;
        }
      })
      .on('end', () => {
        console.log('\n' + '='.repeat(50));
        console.log(`Total rows processed: ${rowCount}`);
        console.log(`Errors found: ${errorCount}`);
        
        if (errors.length > 0) {
          console.log('\nFirst 10 errors:');
          errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
        }
        
        resolve({ rowCount, errorCount, errors });
      })
      .on('error', reject);
  });
}

// Run debug if this file is executed directly
if (require.main === module) {
  const filePath = process.argv[2] || 'Flight Level Data.csv';
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  debugCSV(filePath)
    .then(result => {
      console.log('\nDebug completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Debug failed:', error);
      process.exit(1);
    });
}

module.exports = debugCSV;

