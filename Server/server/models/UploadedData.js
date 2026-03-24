const mongoose = require('mongoose');

const uploadedDataSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  dataType: {
    type: String,
    required: true,
    enum: ['flights', 'pnr', 'pnr-remarks', 'bags', 'airports']
  },
  userId: {
    type: String,
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  recordCount: {
    type: Number,
    required: true
  },
  rawData: {
    type: [mongoose.Schema.Types.Mixed], // Array of JSON objects
    required: true
  },
  metadata: {
    fileSize: Number,
    uploadDuration: Number,
    errors: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
uploadedDataSchema.index({ dataType: 1, uploadDate: -1 });
uploadedDataSchema.index({ fileName: 1 });
uploadedDataSchema.index({ userId: 1, dataType: 1, uploadDate: -1 });

module.exports = mongoose.model('UploadedData', uploadedDataSchema);
