const mongoose = require('mongoose');

const bagSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  company_id: { type: String, default: '' },
  flight_number: { type: String, required: true },
  scheduled_departure_date_local: { type: Date, required: true },
  scheduled_departure_station_code: { type: String, default: '' },
  scheduled_arrival_station_code: { type: String, default: '' },
  bag_tag_unique_number: { type: String, required: true },
  bag_tag_issue_date: { type: Date, required: false },
  bag_type: { type: String, default: 'Checked' },
  is_hot_transfer: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
bagSchema.index({ flight_number: 1, scheduled_departure_date_local: 1 });
bagSchema.index({ bag_type: 1 });

module.exports = mongoose.model('Bag', bagSchema);
