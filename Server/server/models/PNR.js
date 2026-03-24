const mongoose = require('mongoose');

const pnrSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  pnr_id: {
    type: String,
    required: true
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
  passenger_count: {
    type: Number,
    required: true
  },
  special_service_requests: {
    type: Number,
    default: 0
  },
  meal_preference: {
    type: String,
    default: 'Standard'
  },
  wheelchair_assistance: {
    type: Number,
    default: 0
  },
  unaccompanied_minor: {
    type: Number,
    default: 0
  },
  pet_travel: {
    type: Number,
    default: 0
  },
  group_booking: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
pnrSchema.index({ flight_number: 1, scheduled_departure_date_local: 1 });
pnrSchema.index({ pnr_id: 1 });

module.exports = mongoose.model('PNR', pnrSchema);
