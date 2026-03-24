const mongoose = require('mongoose');

const pnrRemarkSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  pnr_id: {
    type: String,
    required: true
  },
  remark_code: {
    type: String,
    required: true
  },
  remark_text: {
    type: String,
    default: ''
  },
  remark_category: {
    type: String,
    default: 'General'
  },
  priority_level: {
    type: String,
    default: 'Medium'
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  resolved_date: {
    type: Date
  },
  status: {
    type: String,
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Indexes
pnrRemarkSchema.index({ pnr_id: 1 });
pnrRemarkSchema.index({ remark_code: 1 });
pnrRemarkSchema.index({ status: 1 });

module.exports = mongoose.model('PNRRemark', pnrRemarkSchema);
