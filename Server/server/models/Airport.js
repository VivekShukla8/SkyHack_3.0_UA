const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  airport_iata_code: {
    type: String,
    required: true,
    unique: true
  },
  iso_country_code: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// No need for additional index since unique: true already creates one

module.exports = mongoose.model('Airport', airportSchema);
