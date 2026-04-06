const express = require('express');
const router = express.Router();
const DataProcessor = require('../services/dataProcessor');

// Process all stored JSON data into individual collections
router.post('/process-all', async (req, res) => {
  try {
    console.log('Starting data processing...');
    const userId = req.user?.id;
    const result = await DataProcessor.processAllStoredData(userId);
    
    res.json({
      success: true,
      message: 'Data processing completed successfully',
      totalProcessed: result.totalProcessed,
      totalErrors: result.totalErrors
    });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process stored data',
      details: error.message
    });
  }
});

// Process specific data type
router.post('/process/:dataType', async (req, res) => {
  try {
    const { dataType } = req.params;
    console.log(`Processing ${dataType} data...`);
    
    const UploadedData = require('../models/UploadedData');
    const data = await UploadedData.findOne({ dataType, userId: req.user?.id });
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: `No ${dataType} data found`
      });
    }
    
    const result = await DataProcessor.processDataByType(data);
    
    res.json({
      success: true,
      message: `${dataType} data processing completed`,
      totalProcessed: result.processed,
      totalErrors: result.errors,
      errorDetails: result.errorDetails?.slice(0, 5) // First 5 errors for debugging
    });
  } catch (error) {
    console.error(`Error processing ${req.params.dataType} data:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to process ${req.params.dataType} data`,
      details: error.message
    });
  }
});

// Get processing status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const status = await DataProcessor.getProcessingStatus(userId);
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing status',
      details: error.message
    });
  }
});

// Debug route to see stored data structure
router.get('/debug-data', async (req, res) => {
  try {
    const UploadedData = require('../models/UploadedData');
    const data = await UploadedData.find({ userId: req.user?.id }).limit(3);
    
    if (data.length > 0) {
      const debugInfo = data.map(item => ({
        dataType: item.dataType,
        fileName: item.fileName,
        recordCount: item.recordCount,
        firstRecord: item.rawData[0],
        allKeys: Object.keys(item.rawData[0] || {}),
        sampleValues: Object.keys(item.rawData[0] || {}).reduce((acc, key) => {
          acc[key] = {
            value: item.rawData[0][key],
            type: typeof item.rawData[0][key]
          };
          return acc;
        }, {})
      }));
      
      res.json({
        success: true,
        debugInfo
      });
    } else {
      res.json({
        success: true,
        message: 'No stored data found'
      });
    }
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get debug data',
      details: error.message
    });
  }
});

// Clear all processed data
router.delete('/clear-all', async (req, res) => {
  try {
    const userId = req.user?.id;
    await DataProcessor.clearAllProcessedData(userId);
    res.json({
      success: true,
      message: 'All processed data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing processed data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear processed data',
      details: error.message
    });
  }
});

module.exports = router;
