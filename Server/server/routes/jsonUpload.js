const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Import the new model for storing raw data
const UploadedData = require('../models/UploadedData');

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

// Upload and store CSV data as JSON in MongoDB
router.post('/csv-json', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dataType } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`Processing ${dataType} data from ${fileName}`);

    // Process CSV and convert to JSON array
    const jsonData = await processCSVToJSON(filePath);
    
    // Store in MongoDB
    const uploadedData = new UploadedData({
      fileName: fileName,
      dataType: dataType,
      recordCount: jsonData.length,
      rawData: jsonData,
      userId: req.user?.id,
      metadata: {
        fileSize: req.file.size,
        uploadDuration: Date.now(),
        errors: []
      }
    });

    const savedData = await uploadedData.save();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Successfully stored ${dataType} data as JSON in MongoDB`,
      recordCount: jsonData.length,
      documentId: savedData._id,
      fileName: fileName
    });

  } catch (error) {
    console.error('Error processing CSV to JSON:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Get stored data by type
router.get('/data/:dataType', async (req, res) => {
  try {
    const { dataType } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const data = await UploadedData.find({ dataType, userId: req.user?.id })
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('fileName uploadDate recordCount metadata');

    const total = await UploadedData.countDocuments({ dataType, userId: req.user?.id });

    res.json({
      data,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching stored data:', error);
    res.status(500).json({ error: 'Failed to fetch stored data' });
  }
});

// Get specific uploaded data with raw JSON
router.get('/data/:dataType/:id', async (req, res) => {
  try {
    const { dataType, id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const data = await UploadedData.findOne({ 
      _id: id, 
      dataType,
      userId: req.user?.id
    });

    if (!data) {
      return res.status(404).json({ error: 'Data not found' });
    }

    // Return paginated raw data
    const paginatedData = data.rawData.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      metadata: {
        fileName: data.fileName,
        uploadDate: data.uploadDate,
        recordCount: data.recordCount,
        totalRecords: data.rawData.length
      },
      data: paginatedData,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data.rawData.length
      }
    });

  } catch (error) {
    console.error('Error fetching specific data:', error);
    res.status(500).json({ error: 'Failed to fetch specific data' });
  }
});

// Delete stored data
router.delete('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await UploadedData.findOneAndDelete({ _id: id, userId: req.user?.id });

    if (!deletedData) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json({
      success: true,
      message: `Deleted ${deletedData.fileName} with ${deletedData.recordCount} records`
    });

  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Process CSV file and convert to JSON array
async function processCSVToJSON(filePath) {
  const records = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert all values to appropriate types
        const processedRow = {};
        
        for (const [key, value] of Object.entries(row)) {
          // Try to parse numbers
          if (!isNaN(value) && value !== '' && !isNaN(parseFloat(value))) {
            processedRow[key] = parseFloat(value);
          }
          // Try to parse dates
          else if (isDateString(value)) {
            processedRow[key] = new Date(value);
          }
          // Keep as string
          else {
            processedRow[key] = value;
          }
        }
        
        records.push(processedRow);
      })
      .on('end', () => {
        console.log(`Processed ${records.length} records from CSV`);
        resolve(records);
      })
      .on('error', (error) => {
        console.error('Error processing CSV:', error);
        reject(error);
      });
  });
}

// Helper function to check if a string is a date
function isDateString(str) {
  if (typeof str !== 'string') return false;
  
  // Check for common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/ // MM-DD-YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
}

module.exports = router;
