require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const rateLimit = require('express-rate-limit');

// Import models
const Flight = require('./models/Flight');
const PNR = require('./models/PNR');
const PNRRemark = require('./models/PNRRemark');
const Bag = require('./models/Bag');
const Airport = require('./models/Airport');

// Import routes
const flightRoutes = require('./routes/flights');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const jsonUploadRoutes = require('./routes/jsonUpload');
const processDataRoutes = require('./routes/processData');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000', // Explicitly allow development origin
  process.env.CORS_ORIGIN // Allow origin from .env for production/staging
];

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Import database connection
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', auth, uploadRoutes);
app.use('/api/json-upload', auth, jsonUploadRoutes);
app.use('/api/process-data', auth, processDataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Flight Difficulty Score Calculation Service
class FlightDifficultyCalculator {
  static async calculateDailyScores(date) {
    try {
      console.log(`Calculating difficulty scores for ${date}`);
      
      // Get all flights for the given date
      const flights = await Flight.find({
        scheduled_departure_date_local: {
          $gte: moment(date).startOf('day').toDate(),
          $lt: moment(date).endOf('day').toDate()
        }
      });

      if (flights.length === 0) {
        console.log('No flights found for the given date');
        return [];
      }

      // Calculate scores for each flight
      const scoredFlights = await Promise.all(
        flights.map(async (flight) => {
          const score = await this.calculateFlightScore(flight);
          return { ...flight.toObject(), difficulty_score: score };
        })
      );

      // Sort by difficulty score (highest first)
      scoredFlights.sort((a, b) => b.difficulty_score - a.difficulty_score);

      // Assign ranks and categories
      const rankedFlights = scoredFlights.map((flight, index) => {
        const rank = index + 1;
        const category = this.categorizeFlight(rank, scoredFlights.length);
        
        return {
          ...flight,
          difficulty_rank: rank,
          difficulty_category: category
        };
      });

      // Update flights in database
      await Promise.all(
        rankedFlights.map(flight => 
          Flight.findByIdAndUpdate(flight._id, {
            difficulty_score: flight.difficulty_score,
            difficulty_rank: flight.difficulty_rank,
            difficulty_category: flight.difficulty_category
          })
        )
      );

      console.log(`Updated ${rankedFlights.length} flights with difficulty scores`);
      return rankedFlights;

    } catch (error) {
      console.error('Error calculating daily scores:', error);
      throw error;
    }
  }

  static async calculateFlightScore(flight) {
    try {
      let score = 0;
      const weights = {
        delay: 0.25,
        groundTime: 0.20,
        passengerLoad: 0.15,
        specialServices: 0.15,
        bagComplexity: 0.15,
        aircraftType: 0.10
      };

      // 1. Delay Factor (0-100 points)
      const delayScore = this.calculateDelayScore(flight);
      score += delayScore * weights.delay;

      // 2. Ground Time Constraint (0-100 points)
      const groundTimeScore = this.calculateGroundTimeScore(flight);
      score += groundTimeScore * weights.groundTime;

      // 3. Passenger Load Factor (0-100 points)
      const passengerLoadScore = this.calculatePassengerLoadScore(flight);
      score += passengerLoadScore * weights.passengerLoad;

      // 4. Special Service Requests (0-100 points)
      const specialServiceScore = await this.calculateSpecialServiceScore(flight);
      score += specialServiceScore * weights.specialServices;

      // 5. Bag Complexity (0-100 points)
      const bagComplexityScore = await this.calculateBagComplexityScore(flight);
      score += bagComplexityScore * weights.bagComplexity;

      // 6. Aircraft Type Factor (0-100 points)
      const aircraftTypeScore = this.calculateAircraftTypeScore(flight);
      score += aircraftTypeScore * weights.aircraftType;

      return Math.round(score * 100) / 100; // Round to 2 decimal places

    } catch (error) {
      console.error('Error calculating flight score:', error);
      return 0;
    }
  }

  static calculateDelayScore(flight) {
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

  static calculateGroundTimeScore(flight) {
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

  static calculatePassengerLoadScore(flight) {
    if (!flight.total_seats || flight.total_seats === 0) return 0;

    const loadFactor = flight.load_factor || 0;
    
    if (loadFactor < 0.7) return 0;
    if (loadFactor < 0.8) return 20;
    if (loadFactor < 0.9) return 40;
    if (loadFactor < 0.95) return 60;
    if (loadFactor < 1.0) return 80;
    return 100;
  }

  static async calculateSpecialServiceScore(flight) {
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

  static async calculateBagComplexityScore(flight) {
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
      
      // Transfer bag complexity
      if (transferRatio > 0.3) score += 40;
      else if (transferRatio > 0.2) score += 20;

      // High bag volume
      if (bagsPerPassenger > 1.5) score += 40;
      else if (bagsPerPassenger > 1.2) score += 20;

      // Hot transfer bags (connection time < 30 min)
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

  static calculateAircraftTypeScore(flight) {
    const fleetType = flight.fleet_type || '';
    const carrier = flight.carrier || '';

    // Express carriers generally have higher complexity
    if (carrier === 'Express') return 60;
    
    // Larger aircraft have more complexity
    if (fleetType.includes('787') || fleetType.includes('777')) return 40;
    if (fleetType.includes('767') || fleetType.includes('757')) return 30;
    if (fleetType.includes('737') || fleetType.includes('A320')) return 20;
    
    return 10;
  }

  static categorizeFlight(rank, totalFlights) {
    const percentile = rank / totalFlights;
    
    if (percentile <= 0.33) return 'Difficult';
    if (percentile <= 0.67) return 'Medium';
    return 'Easy';
  }
}

// Make the calculator available globally
global.FlightDifficultyCalculator = FlightDifficultyCalculator;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Only listen when running standalone (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
