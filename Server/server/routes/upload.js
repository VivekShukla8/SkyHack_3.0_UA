const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

// Import models
const Flight = require('../models/Flight');
const PNR = require('../models/PNR');
const PNRRemark = require('../models/PNRRemark');
const Bag = require('../models/Bag');
const Airport = require('../models/Airport');
const UploadedData = require('../models/UploadedData');
// Toggle inserting rows directly into domain collections during CSV upload.
// When false, upload only stores raw JSON in UploadedData and defers inserts to the DataProcessor.
const INSERT_IN_DB = false;
const { parseCSV } = require('../services/uploadService');

const MODEL_BY_TYPE = {
  flights: Flight,
  pnr: PNR,
  'pnr-remarks': PNRRemark,
  bags: Bag,
  airports: Airport,
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Upload and process CSV files
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dataType } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const startTime = Date.now();

    if (!MODEL_BY_TYPE[dataType]) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid data type specified' });
    }

    // Parse CSV using new service (normalized headers + alias mapping)
    const { rawAll, mappedRecords, errors } = await parseCSV(filePath, dataType);

    // Insert into domain collection (optional toggle)
    let insertedCount = 0;
    if (INSERT_IN_DB && mappedRecords.length) {
      try {
        const Model = MODEL_BY_TYPE[dataType];
        const result = await Model.insertMany(mappedRecords, { ordered: false });
        insertedCount = Array.isArray(result) ? result.length : 0;
      } catch (insErr) {
        // insertMany with ordered:false may still throw; best-effort count
        // We fallback to counting successful writes if available
        insertedCount = (insErr?.result?.result?.nInserted) || 0;
      }
    }

    // Persist a JSON copy for Stored Data UI
    try {
      await UploadedData.create({
        fileName,
        dataType,
        recordCount: rawAll.length,
        rawData: rawAll,
        userId: req.user?.id,
        metadata: {
          fileSize: req.file.size,
          uploadDuration: Date.now() - startTime,
          errors: (errors || []).slice(0, 5).map(e => e.error || String(e))
        }
      });
    } catch (e) {
      console.error('Failed to store raw JSON copy:', e.message);
    }

    // Clean up uploaded file
    fs.existsSync(filePath) && fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Successfully processed ${dataType} data`,
      recordsProcessed: rawAll.length,
      recordsInserted: insertedCount,
      errors
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Legacy per-type processors removed in favor of UploadService

module.exports = router;
