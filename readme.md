# United Airlines Flight Difficulty Score System

A comprehensive MERN stack application that calculates and visualizes flight difficulty scores for United Airlines operations at Chicago O'Hare International Airport (ORD).

## 🚀 Features

- **Real-time Flight Difficulty Scoring**: Advanced algorithm that considers multiple operational factors
- **Interactive Dashboard**: Visual analytics and insights for operational teams
- **Data Management**: CSV upload and JSON-based processing pipeline for flight data
- **Operational Insights**: Recommendations and trend analysis
- **User Authentication**: JWT-based login/register system with per-user data scoping
- **Dark / Light Theme**: Toggle between dark and light modes across the entire UI
- **Processing Controls**: Real-time progress tracking with cancel support during data processing
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
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **Multer** for file uploads
- **CSV Parser** for data processing
- **Moment.js** for date handling
- **bcryptjs** + **jsonwebtoken** for authentication
- **express-rate-limit** for API rate limiting
- **Lodash** for data utilities

### Frontend
- **React 18** with functional components & hooks
- **Ant Design (v6)** for UI components
- **Recharts (v3)** for data visualization (bar, line, pie, radar, area charts)
- **React Router v6** for client-side routing
- **Axios** for API calls
- **Day.js** & **Moment.js** for date handling
- **Context API** for global state (Auth, Theme, Processing)

## 📁 Project Structure

```
UnitedAirlines/
├── Client/                          # React frontend
│   ├── public/
│   └── src/
│       ├── api/                     # API utility functions
│       ├── auth/
│       │   └── AuthContext.js       # JWT auth context & provider
│       ├── components/
│       │   ├── DataProcessor.js     # Real-time data processing with progress & cancel
│       │   └── Navbar.js            # Top navigation bar with theme toggle
│       ├── context/
│       │   ├── ProcessingContext.js  # Processing state (locks navigation during processing)
│       │   └── ThemeContext.js       # Dark / light theme context
│       ├── pages/
│       │   ├── Analytics.js         # EDA, destination analysis, insights, trends
│       │   ├── Dashboard.js         # KPI cards, charts, difficulty distribution
│       │   ├── DataUpload.js        # CSV upload for 5 data types (max 50 MB)
│       │   ├── FlightDetails.js     # Per-flight difficulty breakdown & radar chart
│       │   ├── FlightList.js        # Searchable/filterable flight table
│       │   ├── Login.js             # User login page
│       │   ├── Register.js          # User registration page
│       │   └── StoredData.js        # View & clear uploaded JSON data
│       ├── App.js                   # Root component with routes & providers
│       ├── App.css                  # App-level styles
│       └── index.css                # Global design system & theme variables
│
├── Server/
│   └── server/
│       ├── config/                  # Database connection config
│       ├── middleware/
│       │   └── auth.js              # JWT authentication middleware
│       ├── models/
│       │   ├── Airport.js           # Airport schema (code, name, timezone, etc.)
│       │   ├── Bag.js               # Bag-level data schema
│       │   ├── Flight.js            # Flight schema with computed difficulty fields
│       │   ├── PNR.js               # PNR flight-level schema
│       │   ├── PNRRemark.js         # PNR remark-level schema
│       │   ├── UploadedData.js      # Uploaded JSON metadata per user
│       │   └── User.js             # User schema (username, password hash)
│       ├── routes/
│       │   ├── analytics.js         # EDA, destination, insights, trends endpoints
│       │   ├── auth.js              # Register & login endpoints
│       │   ├── flights.js           # Flight CRUD & difficulty details
│       │   ├── jsonUpload.js        # JSON data upload & retrieval per user
│       │   ├── processData.js       # Trigger server-side data processing
│       │   └── upload.js            # CSV file upload handling
│       ├── services/
│       │   ├── dataProcessor.js     # Joins datasets & computes difficulty scores
│       │   ├── difficultyCalculator.js  # Core scoring algorithm (6-factor weighted)
│       │   └── uploadService.js     # CSV parsing & MongoDB bulk insert
│       ├── uploads/                 # Temporary CSV upload directory
│       ├── index.js                 # Server entry point (Express app setup)
│       └── .env                     # Environment variables
│
├── sample-data/                     # Sample CSV files for testing
├── scripts/                         # Utility scripts (setup, data generation, debug)
├── .gitignore
└── readme.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher) running on `localhost:27017`
- **npm**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VivekShukla8/SkyHack_3.0_UA.git
   cd SkyHack_3.0_UA
   ```

2. **Install backend dependencies**
   ```bash
   cd Server/server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd Client
   npm install
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start the backend** (runs on port 5000)
   ```bash
   cd Server/server
   npm run dev
   ```

6. **Start the frontend** (runs on port 3000, in a new terminal)
   ```bash
   cd Client
   npm start
   ```

### Environment Variables

The backend `.env` file is located at `Server/server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/flight-difficulty
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 📊 Data Upload

1. Register / Log in to your account
2. Navigate to the **Data Upload** page
3. Select the appropriate data type:
   - Flight Level Data
   - PNR Flight Level Data
   - PNR Remark Level Data
   - Bag Level Data
   - Airports Data
4. Upload your CSV file (max 50 MB)
5. Monitor upload progress and results

### Recommended Upload Order

For best results, upload data in this order:
1. Airports Data
2. Flight Level Data
3. PNR Flight Level Data
4. PNR Remark Level Data
5. Bag Level Data

### Data Processing

After uploading, navigate to the **Stored Data** page to:
- View uploaded JSON files scoped to your user account
- Trigger the **data processing pipeline** (joins all datasets, computes difficulty scores)
- Track real-time processing progress with a cancel option
- Clear processed data when needed

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Flights
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flights` | Get flights with filtering & pagination |
| `GET` | `/api/flights/:id` | Get specific flight by ID |
| `GET` | `/api/flights/:id/difficulty-details` | Get difficulty breakdown |
| `GET` | `/api/flights/daily/:date/summary` | Get daily summary |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/eda` | Exploratory data analysis |
| `GET` | `/api/analytics/destinations` | Destination difficulty analysis |
| `GET` | `/api/analytics/insights` | Operational insights |
| `GET` | `/api/analytics/trends` | Difficulty trends over time |

### Upload & Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/csv` | Upload CSV data file |
| `POST` | `/api/json-upload` | Upload processed JSON data |
| `GET` | `/api/json-upload` | Get uploaded data (per user) |
| `DELETE` | `/api/json-upload` | Clear uploaded data |
| `POST` | `/api/process-data` | Trigger data processing pipeline |

## 📈 Usage

### Dashboard
- View KPI cards (total flights, avg difficulty, avg delay, avg load factor)
- Monitor daily flight difficulty distribution via bar/area charts
- Analyze ground time and delay patterns

### Flight List
- Browse all flights with difficulty scores in a sortable table
- Filter by date, category, carrier, aircraft type
- Click any flight to view detailed breakdown

### Flight Details
- Detailed breakdown of all six difficulty factors
- Visual **radar chart** of score components
- Operational metrics and recommendations

### Analytics
- **EDA tab**: Distribution histograms, correlation analysis
- **Destinations tab**: Difficulty heatmap by destination
- **Insights tab**: Operational recommendations
- **Trends tab**: Time-series difficulty trends

### Stored Data
- View count of uploaded JSON files per user
- Process or clear data with one click
- Real-time progress bar during processing

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

- JWT-based user authentication
- Per-user data scoping (users only see their own uploads)
- Rate limiting on API endpoints
- File upload validation (type & size)
- CORS protection
- Password hashing with bcryptjs

## 📊 Sample Data

Sample CSV files are provided in the `sample-data/` directory for testing:
- Flight Level Data (sample & large)
- PNR Flight Level Data (sample & large)
- PNR Remark Level Data (sample & large)
- Bag Level Data (sample & large)
- Airports Data (sample & large)

## 🔧 Utility Scripts

The `scripts/` directory contains helpful utilities:
- `setup.js` — Initial database setup
- `process-data.js` — CLI data processing
- `generate-large-sample-data.js` — Generate large test datasets
- `generate-test-output.js` — Generate test output data
- `debug-csv.js` — Debug CSV parsing issues

## 📄 License

This project is licensed under the MIT License.

---

**Built for SkyHack 3.0 — United Airlines Flight Difficulty Score Challenge**
