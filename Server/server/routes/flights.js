const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const PNR = require('../models/PNR');
const PNRRemark = require('../models/PNRRemark');
const Bag = require('../models/Bag');
const moment = require('moment');
const _ = require('lodash');

// Get the actual date range of stored flight data
router.get('/date-range', async (req, res) => {
  try {
    const userFilter = { userId: req.user.id };
    const [earliest, latest] = await Promise.all([
      Flight.findOne(userFilter).sort({ scheduled_departure_date_local: 1 }).select('scheduled_departure_date_local').lean(),
      Flight.findOne(userFilter).sort({ scheduled_departure_date_local: -1 }).select('scheduled_departure_date_local').lean()
    ]);

    if (!earliest || !latest) {
      return res.json({ minDate: null, maxDate: null, hasData: false });
    }

    res.json({
      minDate: earliest.scheduled_departure_date_local,
      maxDate: latest.scheduled_departure_date_local,
      hasData: true
    });
  } catch (error) {
    console.error('Error fetching date range:', error);
    res.status(500).json({ error: 'Failed to fetch date range' });
  }
});

// Get all flights with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      date,
      category,
      carrier,
      origin,
      destination,
      limit = 100,
      offset = 0,
      sortBy = 'difficulty_score',
      sortOrder = 'desc'
    } = req.query;

    let query = { userId: req.user.id };

    // Date filtering
    if (date) {
      const startDate = moment(date).startOf('day').toDate();
      const endDate = moment(date).endOf('day').toDate();
      query.scheduled_departure_date_local = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Category filtering
    if (category) {
      query.difficulty_category = category;
    }

    // Carrier filtering
    if (carrier) {
      query.carrier = carrier;
    }

    // Origin filtering
    if (origin) {
      query.scheduled_departure_station_code = origin;
    }

    // Destination filtering
    if (destination) {
      query.scheduled_arrival_station_code = destination;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [flights, total] = await Promise.all([
      Flight.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean(),
      Flight.countDocuments(query)
    ]);

    res.json({
      flights,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

// Get flight by ID
router.get('/:id', async (req, res) => {
  try {
    const flight = await Flight.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ error: 'Failed to fetch flight' });
  }
});

// Get flight difficulty details with breakdown
router.get('/:id/difficulty-details', async (req, res) => {
  try {
    const flight = await Flight.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Get detailed breakdown
    const details = {
      flight: flight,
      breakdown: {
        delay: {
          score: calculateDelayScore(flight),
          details: {
            scheduled_departure: flight.scheduled_departure_datetime_local,
            actual_departure: flight.actual_departure_datetime_local,
            delay_minutes: flight.departure_delay_minutes || 0
          }
        },
        groundTime: {
          score: calculateGroundTimeScore(flight),
          details: {
            scheduled_ground_time: flight.scheduled_ground_time_minutes,
            minimum_turn_time: flight.minimum_turn_minutes,
            ratio: flight.ground_time_ratio || 0
          }
        },
        passengerLoad: {
          score: calculatePassengerLoadScore(flight),
          details: {
            total_passengers: flight.total_passengers,
            total_seats: flight.total_seats,
            load_factor: flight.load_factor || 0
          }
        },
        specialServices: {
          score: await calculateSpecialServiceScore(flight),
          details: {
            wheelchair_requests: flight.wheelchair_requests || 0,
            unaccompanied_minors: flight.unaccompanied_minors || 0,
            total_special_requests: flight.special_service_requests || 0
          }
        },
        bagComplexity: {
          score: await calculateBagComplexityScore(flight),
          details: {
            total_bags: flight.total_bags || 0,
            checked_bags: flight.checked_bags || 0,
            transfer_bags: flight.transfer_bags || 0,
            hot_transfer_bags: flight.hot_transfer_bags || 0
          }
        },
        aircraftType: {
          score: calculateAircraftTypeScore(flight),
          details: {
            fleet_type: flight.fleet_type,
            carrier: flight.carrier
          }
        }
      }
    };

    res.json(details);
  } catch (error) {
    console.error('Error fetching flight details:', error);
    res.status(500).json({ error: 'Failed to fetch flight details' });
  }
});

// Get daily difficulty summary
router.get('/daily/:date/summary', async (req, res) => {
  try {
    const date = req.params.date;
    const startDate = moment(date).startOf('day').toDate();
    const endDate = moment(date).endOf('day').toDate();

    const dateMatch = { scheduled_departure_date_local: { $gte: startDate, $lt: endDate }, userId: req.user.id };

    const [summary, categoryBreakdown, topDifficultFlights] = await Promise.all([
      Flight.aggregate([
        { $match: dateMatch },
        { $group: {
          _id: null,
          totalFlights: { $sum: 1 },
          averageDelay: { $avg: '$departure_delay_minutes' },
          averageLoadFactor: { $avg: '$load_factor' },
          averageDifficultyScore: { $avg: '$difficulty_score' },
          difficultFlights: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Difficult'] }, 1, 0] } },
          mediumFlights: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Medium'] }, 1, 0] } },
          easyFlights: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Easy'] }, 1, 0] } }
        }}
      ]),

      Flight.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$difficulty_category', count: { $sum: 1 }, avgScore: { $avg: '$difficulty_score' } } }
      ]),

      Flight.find(dateMatch)
        .sort({ difficulty_score: -1 })
        .limit(10)
        .select('flight_number scheduled_departure_station_code scheduled_arrival_station_code difficulty_score difficulty_category')
        .lean()
    ]);

    res.json({
      date,
      summary: summary[0] || {},
      categoryBreakdown,
      topDifficultFlights
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// Helper functions (same as in main server file)
function calculateDelayScore(flight) {
  if (!flight.actual_departure_datetime_local || !flight.scheduled_departure_datetime_local) {
    return 0;
  }

  const delayMinutes = moment(flight.actual_departure_datetime_local)
    .diff(moment(flight.scheduled_departure_datetime_local), 'minutes');

  if (delayMinutes <= 0) return 0;
  if (delayMinutes <= 15) return 20;
  if (delayMinutes <= 30) return 40;
  if (delayMinutes <= 60) return 60;
  if (delayMinutes <= 120) return 80;
  return 100;
}

function calculateGroundTimeScore(flight) {
  if (!flight.scheduled_ground_time_minutes || !flight.minimum_turn_minutes) {
    return 0;
  }

  const groundTimeRatio = flight.scheduled_ground_time_minutes / flight.minimum_turn_minutes;
  
  if (groundTimeRatio >= 2.0) return 0;
  if (groundTimeRatio >= 1.5) return 20;
  if (groundTimeRatio >= 1.2) return 40;
  if (groundTimeRatio >= 1.0) return 60;
  if (groundTimeRatio >= 0.8) return 80;
  return 100;
}

function calculatePassengerLoadScore(flight) {
  if (!flight.total_seats || flight.total_seats === 0) return 0;

  const loadFactor = flight.load_factor || 0;
  
  if (loadFactor < 0.7) return 0;
  if (loadFactor < 0.8) return 20;
  if (loadFactor < 0.9) return 40;
  if (loadFactor < 0.95) return 60;
  if (loadFactor < 1.0) return 80;
  return 100;
}

async function calculateSpecialServiceScore(flight) {
  try {
    const specialRequests = await PNRRemark.countDocuments({
      flight_number: flight.flight_number,
      scheduled_departure_date_local: flight.scheduled_departure_date_local
    });

    const totalPassengers = flight.total_passengers || 1;
    const specialRequestRatio = specialRequests / totalPassengers;

    if (specialRequestRatio === 0) return 0;
    if (specialRequestRatio < 0.05) return 20;
    if (specialRequestRatio < 0.10) return 40;
    if (specialRequestRatio < 0.15) return 60;
    if (specialRequestRatio < 0.20) return 80;
    return 100;

  } catch (error) {
    console.error('Error calculating special service score:', error);
    return 0;
  }
}

async function calculateBagComplexityScore(flight) {
  try {
    const bagData = await Bag.aggregate([
      {
        $match: {
          flight_number: flight.flight_number,
          scheduled_departure_date_local: flight.scheduled_departure_date_local
        }
      },
      {
        $group: {
          _id: '$bag_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const checkedBags = bagData.find(item => item._id === 'Checked')?.count || 0;
    const transferBags = bagData.find(item => item._id === 'Transfer')?.count || 0;
    const totalBags = checkedBags + transferBags;

    if (totalBags === 0) return 0;

    const transferRatio = transferBags / totalBags;
    const bagsPerPassenger = totalBags / (flight.total_passengers || 1);

    let score = 0;
    
    if (transferRatio > 0.3) score += 40;
    else if (transferRatio > 0.2) score += 20;

    if (bagsPerPassenger > 1.5) score += 40;
    else if (bagsPerPassenger > 1.2) score += 20;

    const hotTransferBags = await Bag.countDocuments({
      flight_number: flight.flight_number,
      scheduled_departure_date_local: flight.scheduled_departure_date_local,
      bag_type: 'Transfer',
      is_hot_transfer: true
    });

    if (hotTransferBags > 0) score += 20;

    return Math.min(score, 100);

  } catch (error) {
    console.error('Error calculating bag complexity score:', error);
    return 0;
  }
}

function calculateAircraftTypeScore(flight) {
  const fleetType = flight.fleet_type || '';
  const carrier = flight.carrier || '';

  if (carrier === 'Express') return 60;
  
  if (fleetType.includes('787') || fleetType.includes('777')) return 40;
  if (fleetType.includes('767') || fleetType.includes('757')) return 30;
  if (fleetType.includes('737') || fleetType.includes('A320')) return 20;
  
  return 10;
}

module.exports = router;
