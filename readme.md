# United Airlines Flight Difficulty Score System

A comprehensive MERN stack application that calculates and visualizes flight difficulty scores for United Airlines operations at Chicago O'Hare International Airport (ORD).

## 🚀 Features

- **Real-time Flight Difficulty Scoring**: Advanced algorithm that considers multiple operational factors
- **Interactive Dashboard**: Visual analytics and insights for operational teams
- **Data Management**: CSV upload and processing for flight data
- **Operational Insights**: Recommendations and trend analysis
- **Responsive Design**: Works on desktop and mobile devices

## 📊 Difficulty Score Components

The flight difficulty score is calculated using six weighted factors:

1. **Delay Factor (25%)**: Based on departure delay minutes
2. **Ground Time Constraint (20%)**: Ratio of scheduled vs minimum turn time
3. **Passenger Load Factor (15%)**: Aircraft capacity utilization
4. **Special Service Requests (15%)**: Wheelchair, unaccompanied minors, etc.
5. **Bag Complexity (15%)**: Transfer bags, hot transfers, bag volume
6. **Aircraft Type Factor (10%)**: Fleet type and carrier complexity

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Multer** for file uploads
- **CSV Parser** for data processing
- **Moment.js** for date handling

### Frontend
- **React 18** with functional components
- **Ant Design** for UI components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

## 📁 Project Structure

```
united-flight-difficulty-score/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── config/            # Configuration
│   └── index.js           # Server entry point
└── package.json           # Root package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd united-flight-difficulty-score
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

### Alternative: Manual Setup

1. **Backend Setup**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```

## 📊 Data Upload

1. Navigate to the "Data Upload" page
2. Select the appropriate data type:
   - Flight Level Data
   - PNR Flight Level Data
   - PNR Remark Level Data
   - Bag Level Data
   - Airports Data
3. Upload your CSV file (max 50MB)
4. Monitor upload progress and results

### Data Upload Order

For best results, upload data in this order:
1. Airports Data
2. Flight Level Data
3. PNR Flight Level Data
4. PNR Remark Level Data
5. Bag Level Data

## 🔧 API Endpoints

### Flights
- `GET /api/flights` - Get flights with filtering
- `GET /api/flights/:id` - Get specific flight
- `GET /api/flights/:id/difficulty-details` - Get difficulty breakdown
- `GET /api/flights/daily/:date/summary` - Get daily summary

### Analytics
- `GET /api/analytics/eda` - Exploratory data analysis
- `GET /api/analytics/destinations` - Destination difficulty analysis
- `GET /api/analytics/insights` - Operational insights
- `GET /api/analytics/trends` - Difficulty trends over time

### Upload
- `POST /api/upload/csv` - Upload CSV data

## 📈 Usage

### Dashboard
- View key metrics and trends
- Monitor daily flight difficulty distribution
- Analyze ground time and delay patterns

### Flight List
- Browse all flights with difficulty scores
- Filter by date, category, carrier, etc.
- Sort by difficulty score or other factors

### Flight Details
- Detailed breakdown of difficulty factors
- Visual radar chart of score components
- Operational metrics and recommendations

### Analytics
- Destination difficulty analysis
- Time-based patterns
- Operational insights and recommendations

## 🎯 Key Metrics

- **Average Delay**: Mean departure delay in minutes
- **Load Factor**: Percentage of seats occupied
- **Ground Time Ratio**: Scheduled vs minimum turn time
- **Transfer Bag Ratio**: Percentage of transfer bags
- **Special Service Rate**: Requests per passenger

## 🔍 Difficulty Categories

- **Difficult** (Top 33%): Highest complexity flights requiring extra attention
- **Medium** (Middle 33%): Moderate complexity with standard procedures
- **Easy** (Bottom 33%): Low complexity flights with minimal issues

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🛡️ Security Features

- Rate limiting on API endpoints
- File upload validation
- CORS protection
- Input sanitization

## 🚀 Deployment

### Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/flight-difficulty
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd server
   npm start
   ```

## 📊 Sample Data

The system works with the provided United Airlines datasets:
- Flight Level Data (8,091 records)
- PNR Flight Level Data (687,870 records)
- PNR Remark Level Data (51,690 records)
- Bag Level Data (687,237 records)
- Airports Data (5,604 records)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Flight difficulty scoring algorithm
  - Interactive dashboard
  - Data upload capabilities
  - Analytics and insights
  - Responsive design

---

**Note**: This application is designed for United Airlines internal use and requires proper data access and security clearance.
