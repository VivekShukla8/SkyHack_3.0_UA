const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const moment = require('moment');

// Helper: build date filter with userId scoping
function buildDateFilter(startDate, endDate, userId) {
  const filter = {};
  if (userId) filter.userId = userId;
  if (startDate && endDate) {
    filter.scheduled_departure_date_local = {
      $gte: moment(startDate).startOf('day').toDate(),
      $lt: moment(endDate).endOf('day').toDate()
    };
  }
  return filter;
}

// ─── GET /eda ────────────────────────────────────────────────
// Uses pre-aggregated fields on Flight docs — NO $lookup needed
router.get('/eda', async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate, req.user.id);

    // Run ALL aggregations in parallel
    const [delayStats, groundTimeStats, bagStats, passengerStats, specialServiceStats, correlationData] = await Promise.all([

      // 1. Delay analysis
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          averageDelay: { $avg: '$departure_delay_minutes' },
          totalFlights: { $sum: 1 },
          delayedFlights: { $sum: { $cond: [{ $gt: ['$departure_delay_minutes', 0] }, 1, 0] } }
        }}
      ]),

      // 2. Ground time analysis
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          avgGroundTimeRatio: {
            $avg: { $cond: [
              { $and: [{ $gt: ['$minimum_turn_minutes', 0] }, { $gt: ['$scheduled_ground_time_minutes', 0] }] },
              { $divide: ['$scheduled_ground_time_minutes', '$minimum_turn_minutes'] },
              0
            ]}
          },
          flightsBelowMinTurn: {
            $sum: { $cond: [
              { $and: [
                { $gt: ['$minimum_turn_minutes', 0] },
                { $lte: [{ $divide: ['$scheduled_ground_time_minutes', '$minimum_turn_minutes'] }, 1.0] }
              ]}, 1, 0
            ]}
          }
        }}
      ]),

      // 3. Bag analysis — use pre-aggregated fields on Flight docs
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          avgBagsPerFlight: { $avg: { $ifNull: ['$total_bags', 0] } },
          avgTransferRatio: {
            $avg: { $cond: [
              { $gt: [{ $ifNull: ['$total_bags', 0] }, 0] },
              { $divide: [{ $ifNull: ['$transfer_bags', 0] }, '$total_bags'] },
              0
            ]}
          }
        }}
      ]),

      // 4. Passenger load analysis
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          avgLoadFactor: { $avg: '$load_factor' },
          avgPassengers: { $avg: '$total_passengers' },
          highLoadFlights: { $sum: { $cond: [{ $gte: ['$load_factor', 0.9] }, 1, 0] } }
        }}
      ]),

      // 5. Special service analysis — use pre-aggregated fields on Flight docs
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          avgSpecialRequestsPerFlight: { $avg: { $ifNull: ['$special_service_requests', 0] } },
          totalWheelchairRequests: { $sum: { $ifNull: ['$wheelchair_requests', 0] } },
          totalUnaccompaniedMinors: { $sum: { $ifNull: ['$unaccompanied_minors', 0] } }
        }}
      ]),

      // 6. Correlation analysis
      Flight.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          correlation: { $avg: { $multiply: ['$load_factor', '$departure_delay_minutes'] } },
          avgLoad: { $avg: '$load_factor' },
          avgDelay: { $avg: '$departure_delay_minutes' }
        }}
      ])
    ]);

    res.json({
      delayAnalysis: delayStats[0] || {},
      groundTimeAnalysis: groundTimeStats[0] || {},
      bagAnalysis: bagStats[0] || {},
      passengerAnalysis: passengerStats[0] || {},
      specialServiceAnalysis: specialServiceStats[0] || {},
      correlationAnalysis: correlationData[0] || {}
    });

  } catch (error) {
    console.error('Error fetching EDA data:', error);
    res.status(500).json({ error: 'Failed to fetch EDA data' });
  }
});

// ─── GET /destinations ───────────────────────────────────────
router.get('/destinations', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate, req.user.id);

    const destinationStats = await Flight.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: '$scheduled_arrival_station_code',
        totalFlights: { $sum: 1 },
        avgDifficultyScore: { $avg: '$difficulty_score' },
        avgDelay: { $avg: '$departure_delay_minutes' },
        avgLoadFactor: { $avg: '$load_factor' },
        difficultFlights: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Difficult'] }, 1, 0] } },
        avgGroundTimeRatio: {
          $avg: { $cond: [
            { $gt: ['$minimum_turn_minutes', 0] },
            { $divide: ['$scheduled_ground_time_minutes', '$minimum_turn_minutes'] },
            0
          ]}
        }
      }},
      { $addFields: { difficultyRate: { $divide: ['$difficultFlights', '$totalFlights'] } } },
      { $sort: { avgDifficultyScore: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(destinationStats);
  } catch (error) {
    console.error('Error fetching destination analysis:', error);
    res.status(500).json({ error: 'Failed to fetch destination analysis' });
  }
});

// ─── GET /insights ───────────────────────────────────────────
router.get('/insights', async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate, req.user.id);

    // Run all queries in parallel
    const [difficultDestinations, difficultyDrivers, timePatterns] = await Promise.all([
      // Top difficult destinations
      Flight.aggregate([
        { $match: { ...dateFilter, difficulty_category: 'Difficult' } },
        { $group: { _id: '$scheduled_arrival_station_code', count: { $sum: 1 }, avgScore: { $avg: '$difficulty_score' }, avgDelay: { $avg: '$departure_delay_minutes' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Common difficulty drivers
      Flight.aggregate([
        { $match: { ...dateFilter, difficulty_category: 'Difficult' } },
        { $group: {
          _id: null,
          avgDelay: { $avg: '$departure_delay_minutes' },
          avgLoadFactor: { $avg: '$load_factor' },
          avgGroundTimeRatio: { $avg: { $cond: [{ $gt: ['$minimum_turn_minutes', 0] }, { $divide: ['$scheduled_ground_time_minutes', '$minimum_turn_minutes'] }, 0] } },
          avgSpecialRequests: { $avg: { $ifNull: ['$special_service_requests', 0] } },
          avgBags: { $avg: { $ifNull: ['$total_bags', 0] } }
        }}
      ]),

      // Time-based patterns
      Flight.aggregate([
        { $match: dateFilter },
        { $addFields: { hour: { $hour: '$scheduled_departure_datetime_local' } } },
        { $group: {
          _id: '$hour',
          avgDifficultyScore: { $avg: '$difficulty_score' },
          flightCount: { $sum: 1 },
          difficultCount: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Difficult'] }, 1, 0] } }
        }},
        { $addFields: { difficultyRate: { $divide: ['$difficultCount', '$flightCount'] } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const recommendations = generateRecommendations(difficultDestinations, difficultyDrivers, timePatterns);

    res.json({
      difficultDestinations,
      difficultyDrivers: difficultyDrivers[0] || {},
      timePatterns,
      recommendations
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// ─── GET /trends ─────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  try {
    const { groupBy = 'day' } = req.query;
    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate, req.user.id);

    let groupFormat;
    if (groupBy === 'hour') {
      groupFormat = {
        year: { $year: '$scheduled_departure_datetime_local' },
        month: { $month: '$scheduled_departure_datetime_local' },
        day: { $dayOfMonth: '$scheduled_departure_datetime_local' },
        hour: { $hour: '$scheduled_departure_datetime_local' }
      };
    } else {
      groupFormat = {
        year: { $year: '$scheduled_departure_date_local' },
        month: { $month: '$scheduled_departure_date_local' },
        day: { $dayOfMonth: '$scheduled_departure_date_local' }
      };
    }

    const trends = await Flight.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: groupFormat,
        avgDifficultyScore: { $avg: '$difficulty_score' },
        totalFlights: { $sum: 1 },
        difficultFlights: { $sum: { $cond: [{ $eq: ['$difficulty_category', 'Difficult'] }, 1, 0] } },
        avgDelay: { $avg: '$departure_delay_minutes' }
      }},
      { $addFields: {
        difficultyRate: { $divide: ['$difficultFlights', '$totalFlights'] },
        date: { $dateFromParts: {
          year: '$_id.year', month: '$_id.month', day: '$_id.day',
          ...(groupBy === 'hour' && { hour: '$_id.hour' })
        }}
      }},
      { $sort: { date: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// ─── Recommendations Generator ──────────────────────────────
function generateRecommendations(difficultDestinations, difficultyDrivers, timePatterns) {
  const recommendations = [];

  if (difficultDestinations.length > 0) {
    recommendations.push({
      category: 'Destination Management', priority: 'High',
      title: 'Focus on High-Difficulty Destinations',
      description: `Top difficult destinations: ${difficultDestinations.slice(0, 3).map(d => d._id).join(', ')}`,
      actions: ['Increase ground crew allocation', 'Implement dedicated gate assignments', 'Pre-position equipment and resources']
    });
  }

  const peakHours = timePatterns.filter(p => p.difficultyRate > 0.3).sort((a, b) => b.difficultyRate - a.difficultyRate).slice(0, 3);
  if (peakHours.length > 0) {
    recommendations.push({
      category: 'Resource Planning', priority: 'High',
      title: 'Peak Hour Resource Allocation',
      description: `High difficulty rates during hours: ${peakHours.map(h => h._id).join(', ')}`,
      actions: ['Increase staffing during peak difficulty hours', 'Implement staggered break schedules', 'Pre-allocate additional ground equipment']
    });
  }

  if (difficultyDrivers[0]?.avgGroundTimeRatio < 1.2) {
    recommendations.push({
      category: 'Ground Operations', priority: 'Medium',
      title: 'Ground Time Optimization',
      description: 'Average ground time ratio is below optimal levels',
      actions: ['Review minimum turn time requirements', 'Optimize gate assignments', 'Implement parallel boarding processes']
    });
  }

  if (difficultyDrivers[0]?.avgLoadFactor > 0.9) {
    recommendations.push({
      category: 'Passenger Management', priority: 'Medium',
      title: 'High Load Factor Management',
      description: 'High passenger loads contributing to difficulty',
      actions: ['Implement priority boarding', 'Increase gate agent staffing', 'Pre-allocate overhead bin space']
    });
  }

  return recommendations;
}

module.exports = router;
