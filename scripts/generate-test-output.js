const fs = require('fs');
const path = require('path');

/**
 * Generate test output CSV file as required by the case study
 * This creates a sample output file with flight difficulty scores
 */

class TestOutputGenerator {
  constructor() {
    this.outputData = [];
  }

  generateSampleData() {
    console.log('Generating sample test output data...');
    
    // Sample flight data with difficulty scores
    const sampleFlights = [
      {
        flight_number: 'UA1234',
        scheduled_departure_date_local: '2025-08-15',
        scheduled_departure_station_code: 'ORD',
        scheduled_arrival_station_code: 'LAX',
        scheduled_departure_datetime_local: '2025-08-15T08:00:00Z',
        fleet_type: 'B737-800',
        carrier: 'Mainline',
        total_seats: 166,
        difficulty_score: 85.2,
        difficulty_rank: 1,
        difficulty_category: 'Difficult',
        departure_delay_minutes: 45,
        ground_time_ratio: 1.1,
        load_factor: 0.95,
        special_service_requests: 8,
        transfer_bag_ratio: 0.35,
        total_bags: 120,
        features_used: 'delay,ground_time,passenger_load,special_services,bag_complexity,aircraft_type'
      },
      {
        flight_number: 'UA5678',
        scheduled_departure_date_local: '2025-08-15',
        scheduled_departure_station_code: 'ORD',
        scheduled_arrival_station_code: 'JFK',
        scheduled_departure_datetime_local: '2025-08-15T10:30:00Z',
        fleet_type: 'B767-300',
        carrier: 'Mainline',
        total_seats: 167,
        difficulty_score: 72.8,
        difficulty_rank: 2,
        difficulty_category: 'Difficult',
        departure_delay_minutes: 25,
        ground_time_ratio: 1.3,
        load_factor: 0.88,
        special_service_requests: 5,
        transfer_bag_ratio: 0.28,
        total_bags: 95,
        features_used: 'delay,ground_time,passenger_load,special_services,bag_complexity,aircraft_type'
      },
      {
        flight_number: 'OO9012',
        scheduled_departure_date_local: '2025-08-15',
        scheduled_departure_station_code: 'ORD',
        scheduled_arrival_station_code: 'MSP',
        scheduled_departure_datetime_local: '2025-08-15T14:15:00Z',
        fleet_type: 'ERJ-175',
        carrier: 'Express',
        total_seats: 76,
        difficulty_score: 65.4,
        difficulty_rank: 3,
        difficulty_category: 'Medium',
        departure_delay_minutes: 15,
        ground_time_ratio: 1.5,
        load_factor: 0.82,
        special_service_requests: 3,
        transfer_bag_ratio: 0.15,
        total_bags: 45,
        features_used: 'delay,ground_time,passenger_load,special_services,bag_complexity,aircraft_type'
      },
      {
        flight_number: 'UA3456',
        scheduled_departure_date_local: '2025-08-15',
        scheduled_departure_station_code: 'ORD',
        scheduled_arrival_station_code: 'DEN',
        scheduled_departure_datetime_local: '2025-08-15T16:45:00Z',
        fleet_type: 'B737-800',
        carrier: 'Mainline',
        total_seats: 166,
        difficulty_score: 45.2,
        difficulty_rank: 4,
        difficulty_category: 'Medium',
        departure_delay_minutes: 5,
        ground_time_ratio: 1.8,
        load_factor: 0.75,
        special_service_requests: 2,
        transfer_bag_ratio: 0.12,
        total_bags: 78,
        features_used: 'delay,ground_time,passenger_load,special_services,bag_complexity,aircraft_type'
      },
      {
        flight_number: 'UA7890',
        scheduled_departure_date_local: '2025-08-15',
        scheduled_departure_station_code: 'ORD',
        scheduled_arrival_station_code: 'SFO',
        scheduled_departure_datetime_local: '2025-08-15T19:20:00Z',
        fleet_type: 'B787-10',
        carrier: 'Mainline',
        total_seats: 318,
        difficulty_score: 28.7,
        difficulty_rank: 5,
        difficulty_category: 'Easy',
        departure_delay_minutes: 0,
        ground_time_ratio: 2.1,
        load_factor: 0.68,
        special_service_requests: 1,
        transfer_bag_ratio: 0.08,
        total_bags: 145,
        features_used: 'delay,ground_time,passenger_load,special_services,bag_complexity,aircraft_type'
      }
    ];

    this.outputData = sampleFlights;
  }

  generateCSV() {
    console.log('Generating CSV output file...');
    
    const csvHeader = [
      'flight_number',
      'scheduled_departure_date_local',
      'scheduled_departure_station_code',
      'scheduled_arrival_station_code',
      'scheduled_departure_datetime_local',
      'fleet_type',
      'carrier',
      'total_seats',
      'difficulty_score',
      'difficulty_rank',
      'difficulty_category',
      'departure_delay_minutes',
      'ground_time_ratio',
      'load_factor',
      'special_service_requests',
      'transfer_bag_ratio',
      'total_bags',
      'features_used'
    ];

    const csvRows = this.outputData.map(flight => [
      flight.flight_number,
      flight.scheduled_departure_date_local,
      flight.scheduled_departure_station_code,
      flight.scheduled_arrival_station_code,
      flight.scheduled_departure_datetime_local,
      flight.fleet_type,
      flight.carrier,
      flight.total_seats,
      flight.difficulty_score,
      flight.difficulty_rank,
      flight.difficulty_category,
      flight.departure_delay_minutes,
      flight.ground_time_ratio,
      flight.load_factor,
      flight.special_service_requests,
      flight.transfer_bag_ratio,
      flight.total_bags,
      flight.features_used
    ]);

    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const outputPath = 'test_united_airlines_team.csv';
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ Generated test output file: ${outputPath}`);
    console.log(`   Records: ${this.outputData.length}`);
    console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  }

  generateSummary() {
    console.log('\n📊 Test Output Summary:');
    console.log('========================');
    
    const categories = this.outputData.reduce((acc, flight) => {
      acc[flight.difficulty_category] = (acc[flight.difficulty_category] || 0) + 1;
      return acc;
    }, {});

    console.log('Difficulty Categories:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} flights`);
    });

    const avgScore = this.outputData.reduce((sum, flight) => sum + flight.difficulty_score, 0) / this.outputData.length;
    console.log(`\nAverage Difficulty Score: ${avgScore.toFixed(1)}`);
    
    const avgDelay = this.outputData.reduce((sum, flight) => sum + flight.departure_delay_minutes, 0) / this.outputData.length;
    console.log(`Average Delay: ${avgDelay.toFixed(1)} minutes`);
    
    const avgLoadFactor = this.outputData.reduce((sum, flight) => sum + flight.load_factor, 0) / this.outputData.length;
    console.log(`Average Load Factor: ${(avgLoadFactor * 100).toFixed(1)}%`);

    console.log('\nFeatures Used in Scoring:');
    console.log('  - Departure delay (minutes)');
    console.log('  - Ground time ratio (scheduled/minimum)');
    console.log('  - Passenger load factor');
    console.log('  - Special service requests count');
    console.log('  - Transfer bag ratio');
    console.log('  - Total bag count');
    console.log('  - Aircraft type complexity');
  }
}

// Run the generator if this file is executed directly
if (require.main === module) {
  const generator = new TestOutputGenerator();
  generator.generateSampleData();
  generator.generateCSV();
  generator.generateSummary();
}

module.exports = TestOutputGenerator;
