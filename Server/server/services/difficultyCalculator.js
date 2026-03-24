const moment = require('moment');
const _ = require('lodash');

class FlightDifficultyCalculator {
  static async calculateDailyScores(date) {
    try {
      console.log(`Calculating difficulty scores for ${date}`);
      
      const Flight = require('../models/Flight');
      const PNR = require('../models/PNR');
      const PNRRemark = require('../models/PNRRemark');
      const Bag = require('../models/Bag');

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
      const PNRRemark = require('../models/PNRRemark');
      
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
      const Bag = require('../models/Bag');
      
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

  static async aggregateFlightData(flight) {
    try {
      const PNR = require('../models/PNR');
      const PNRRemark = require('../models/PNRRemark');
      const Bag = require('../models/Bag');

      // Aggregate passenger data
      const pnrData = await PNR.aggregate([
        {
          $match: {
            flight_number: flight.flight_number,
            scheduled_departure_date_local: flight.scheduled_departure_date_local
          }
        },
        {
          $group: {
            _id: null,
            totalPassengers: { $sum: '$total_pax' },
            childrenCount: { $sum: { $cond: [{ $eq: ['$is_child', 'Y'] }, '$total_pax', 0] } },
            basicEconomyCount: { $sum: '$basic_economy_pax' },
            strollerUsers: { $sum: { $cond: [{ $eq: ['$is_stroller_user', 'Y'] }, '$total_pax', 0] } },
            lapChildren: { $sum: '$lap_child_count' }
          }
        }
      ]);

      // Aggregate special service requests
      const specialServiceData = await PNRRemark.aggregate([
        {
          $match: {
            flight_number: flight.flight_number,
            scheduled_departure_date_local: flight.scheduled_departure_date_local
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            wheelchairRequests: {
              $sum: { $cond: [{ $eq: ['$special_service_request', 'Airport Wheelchair'] }, 1, 0] }
            },
            unaccompaniedMinors: {
              $sum: { $cond: [{ $eq: ['$special_service_request', 'Unaccompanied Minor'] }, 1, 0] }
            }
          }
        }
      ]);

      // Aggregate bag data
      const bagData = await Bag.aggregate([
        {
          $match: {
            flight_number: flight.flight_number,
            scheduled_departure_date_local: flight.scheduled_departure_date_local
          }
        },
        {
          $group: {
            _id: null,
            totalBags: { $sum: 1 },
            checkedBags: {
              $sum: { $cond: [{ $eq: ['$bag_type', 'Checked'] }, 1, 0] }
            },
            transferBags: {
              $sum: { $cond: [{ $eq: ['$bag_type', 'Transfer'] }, 1, 0] }
            },
            hotTransferBags: {
              $sum: { $cond: ['$is_hot_transfer', 1, 0] }
            }
          }
        }
      ]);

      // Update flight with aggregated data
      const updateData = {
        total_passengers: pnrData[0]?.totalPassengers || 0,
        children_count: pnrData[0]?.childrenCount || 0,
        basic_economy_count: pnrData[0]?.basicEconomyCount || 0,
        stroller_users: pnrData[0]?.strollerUsers || 0,
        lap_children: pnrData[0]?.lapChildren || 0,
        special_service_requests: specialServiceData[0]?.totalRequests || 0,
        wheelchair_requests: specialServiceData[0]?.wheelchairRequests || 0,
        unaccompanied_minors: specialServiceData[0]?.unaccompaniedMinors || 0,
        total_bags: bagData[0]?.totalBags || 0,
        checked_bags: bagData[0]?.checkedBags || 0,
        transfer_bags: bagData[0]?.transferBags || 0,
        hot_transfer_bags: bagData[0]?.hotTransferBags || 0,
        load_factor: pnrData[0]?.totalPassengers ? 
          (pnrData[0].totalPassengers / flight.total_seats) : 0
      };

      return updateData;

    } catch (error) {
      console.error('Error aggregating flight data:', error);
      return {};
    }
  }
}

module.exports = FlightDifficultyCalculator;
