const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true
  },
  company_id: {
    type: String,
    required: true
  },
  flight_number: {
    type: String,
    required: true
  },
  scheduled_departure_date_local: {
    type: Date,
    required: true
  },
  scheduled_departure_station_code: {
    type: String,
    default: 'UNKNOWN'
  },
  scheduled_arrival_station_code: {
    type: String,
    default: 'UNKNOWN'
  },
  scheduled_departure_datetime_local: {
    type: Date,
    required: true
  },
  scheduled_arrival_datetime_local: {
    type: Date,
    required: true
  },
  actual_departure_datetime_local: {
    type: Date
  },
  actual_arrival_datetime_local: {
    type: Date
  },
  total_seats: {
    type: Number,
    required: true
  },
  fleet_type: {
    type: String,
    required: true
  },
  carrier: {
    type: String,
    default: 'Mainline'
  },
  scheduled_ground_time_minutes: {
    type: Number,
    required: true
  },
  actual_ground_time_minutes: {
    type: Number
  },
  minimum_turn_minutes: {
    type: Number,
    required: true
  },
  // Calculated fields
  departure_delay_minutes: {
    type: Number,
    default: 0
  },
  ground_time_ratio: {
    type: Number,
    default: 0
  },
  difficulty_score: {
    type: Number,
    default: 0
  },
  difficulty_rank: {
    type: Number,
    default: 0
  },
  difficulty_category: {
    type: String,
    enum: ['Easy', 'Medium', 'Difficult'],
    default: 'Easy'
  },
  // Aggregated passenger data
  total_passengers: {
    type: Number,
    default: 0
  },
  children_count: {
    type: Number,
    default: 0
  },
  basic_economy_count: {
    type: Number,
    default: 0
  },
  stroller_users: {
    type: Number,
    default: 0
  },
  lap_children: {
    type: Number,
    default: 0
  },
  // Bag data
  total_bags: {
    type: Number,
    default: 0
  },
  checked_bags: {
    type: Number,
    default: 0
  },
  transfer_bags: {
    type: Number,
    default: 0
  },
  hot_transfer_bags: {
    type: Number,
    default: 0
  },
  // Special service requests
  special_service_requests: {
    type: Number,
    default: 0
  },
  wheelchair_requests: {
    type: Number,
    default: 0
  },
  unaccompanied_minors: {
    type: Number,
    default: 0
  },
  // Load factor
  load_factor: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
flightSchema.index({ scheduled_departure_date_local: 1, difficulty_score: -1 });
flightSchema.index({ company_id: 1, flight_number: 1, scheduled_departure_date_local: 1 });
flightSchema.index({ scheduled_departure_station_code: 1, scheduled_arrival_station_code: 1 });
flightSchema.index({ difficulty_category: 1, scheduled_departure_date_local: 1 });
flightSchema.index({ scheduled_arrival_station_code: 1, difficulty_score: -1 });
flightSchema.index({ scheduled_departure_datetime_local: 1 });
flightSchema.index({ flight_number: 1, scheduled_departure_date_local: 1 });

module.exports = mongoose.model('Flight', flightSchema);
