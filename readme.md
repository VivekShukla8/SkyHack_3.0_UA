# ✈️ United Airlines Flight Difficulty Score System

A comprehensive MERN stack application that calculates and visualizes flight difficulty scores for United Airlines operations at Chicago O'Hare International Airport (ORD). Built for **SkyHack 3.0**.

---

## 🚀 Features

- **Public Landing Page**: A rich, animated landing page introducing the platform — with interactive UI mockups, algorithm breakdown, workflow guide, and call-to-action for new users
- **Real-time Flight Difficulty Scoring**: Advanced 6-factor weighted algorithm that scores every flight on a 0–100 scale
- **Interactive Dashboard**: KPI cards, bar/area charts, daily difficulty distribution, fleet status, and top delayed routes
- **Flight List**: Sortable, filterable table with difficulty scores, ranks, delays, load factors, and category badges
- **In-Depth Analytics**: EDA, destination heatmaps, hourly difficulty patterns, trend analysis, and AI-generated operational recommendations
- **Bulk Data Pipeline**: CSV upload for 5 data sources (airports, flights, PNR, remarks, bags) with real-time progress tracking and cancel support
- **User Authentication & Data Isolation**: JWT-based login/register with strict per-user data scoping — users never see another account's data
- **Route Protection**: All data pages are wrapped with `RequireAuth` guards; unauthenticated users are redirected to login
- **Dark / Light Theme**: Full theme toggle using Ant Design's `darkAlgorithm` / `defaultAlgorithm` via `ConfigProvider`, with CSS variable-based theming for custom components
- **Processing Controls**: Real-time progress bar with cancel option during data processing; navigation is locked while processing is active
- **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## 📊 Difficulty Score Components

The flight difficulty score is calculated using six weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Departure Delay** | 25% | Minutes of actual vs scheduled departure delay |
| **Ground Time Constraint** | 20% | Ratio of scheduled vs minimum turn time |
| **Passenger Load Factor** | 15% | Aircraft capacity utilization (passengers ÷ seats) |
| **Special Service Requests** | 15% | Wheelchair, unaccompanied minor, and SSR requests |
| **Bag Complexity** | 15% | Transfer bags, hot transfers, bags-per-passenger ratio |
| **Aircraft Type Factor** | 10% | Fleet type and carrier complexity adjustment |

### Difficulty Categories

| Category | Percentile | Meaning |
|----------|-----------|---------|
| 🟢 **Easy** | Bottom 33% | Smooth operations expected |
| 🟡 **Medium** | Middle 34% | Monitor and prepare |
| 🔴 **Difficult** | Top 33% | Needs extra resources and attention |

---

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
- **Ant Design (v5)** with dynamic `darkAlgorithm` / `defaultAlgorithm` theming
- **Recharts (v3)** for data visualization (bar, line, pie, radar, area charts)
- **React Router v6** for client-side routing with protected routes
- **Axios** for API calls with JWT interceptors
- **Day.js** & **Moment.js** for date handling
- **Context API** for global state (Auth, Theme, Processing)

---

## 📁 Project Structure

```
UnitedAirlines/
├── Client/                          # React frontend
│   ├── public/
│   └── src/
│       ├── api/
│       │   └── axios.js             # Axios instance with JWT interceptors
│       ├── auth/
│       │   ├── AuthContext.js       # JWT auth context & provider
│       │   └── RequireAuth.js       # Route guard — redirects unauthenticated users
│       ├── components/
│       │   ├── DataProcessor.js     # Real-time data processing with progress & cancel
│       │   └── Navbar.js            # Fixed navbar with centered nav, theme toggle, user menu
│       ├── context/
│       │   ├── ProcessingContext.js  # Processing state (locks navigation during processing)
│       │   └── ThemeContext.js       # Dark / light theme via data-theme attribute
│       ├── pages/
│       │   ├── LandingPage.js       # Public landing page with hero, features, algorithm, previews
│       │   ├── LandingPage.css      # Landing page styles (dark & light mode)
│       │   ├── Analytics.js         # EDA, destination analysis, insights, trends
│       │   ├── Dashboard.js         # KPI cards, charts, difficulty distribution
│       │   ├── DataUpload.js        # CSV upload for 5 data types (max 50 MB)
│       │   ├── FlightDetails.js     # Per-flight difficulty breakdown & radar chart
│       │   ├── FlightList.js        # Searchable/filterable flight table
│       │   ├── Login.js             # User login page (redirects to origin after auth)
│       │   ├── Register.js          # User registration page
│       │   └── StoredData.js        # View & clear uploaded JSON data
│       ├── App.js                   # Root component — AppShell with ConfigProvider theming
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
│       │   └── User.js             # User schema (email, password hash)
│       ├── routes/
│       │   ├── analytics.js         # EDA, destination, insights, trends endpoints
│       │   ├── auth.js              # Register & login endpoints
│       │   ├── flights.js           # Flight CRUD & difficulty details
│       │   ├── jsonUpload.js        # JSON data upload & retrieval per user
│       │   ├── processData.js       # Trigger server-side data processing (user-scoped)
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
└── README.md
```

---

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

5. **Start the backend** (runs on port 9001)
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
PORT=9001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret_key
```

---

## 🌐 Application Pages

### Landing Page (`/`)
The public-facing landing page — accessible without login. It includes:
- **Hero section** with platform tagline, stats bar, and CTA buttons
- **Features grid** — 6 capability cards (Scoring, Analytics, Pipeline, Security, Insights, Collaboration)
- **Algorithm breakdown** — visual representation of the 6 weighted scoring factors
- **Workflow timeline** — 4 steps from upload to insights
- **Interactive previews** — CSS mini-mockups of Dashboard, Flight List, Analytics, and Data Upload
- **Data pipeline** — 5 data sources visualization
- **CTA section** with sign-up/sign-in buttons
- **Footer** with branding

### Dashboard (`/dashboard`) 🔒
- KPI cards (total flights, avg difficulty, avg delay, avg load factor)
- Daily flight difficulty distribution via bar/area charts
- Score distribution by day with custom tooltips
- Ground time and delay pattern analysis

### Flight List (`/flights`) 🔒
- Sortable table with difficulty scores, ranks, delays, load factors
- Filter by date, difficulty category (Easy/Medium/Difficult), and carrier (Mainline/Express)
- Pagination with configurable page size
- Click any flight to view detailed breakdown

### Flight Details (`/flights/:id`) 🔒
- Detailed breakdown of all six difficulty factors
- Visual **radar chart** of score components
- Operational metrics and per-flight recommendations

### Analytics (`/analytics`) 🔒
- **EDA tab**: Distribution histograms, correlation analysis
- **Destinations tab**: Difficulty heatmap by destination
- **Insights tab**: Operational recommendations
- **Trends tab**: Time-series difficulty trends

### Data Upload (`/upload`) 🔒
- Drag-and-drop CSV upload for 5 data types
- Guided upload order with validation
- Max 50 MB per file

### Stored Data (`/stored-data`) 🔒
- View count of uploaded JSON files per user
- Process or clear data with one click
- Real-time progress bar with cancel option

> 🔒 = Requires authentication. Unauthenticated users are redirected to `/login`.

---

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Flights (🔒 Authenticated, user-scoped)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flights` | Get flights with filtering & pagination |
| `GET` | `/api/flights/:id` | Get specific flight by ID |
| `GET` | `/api/flights/:id/difficulty-details` | Get difficulty breakdown |
| `GET` | `/api/flights/daily/:date/summary` | Get daily summary |
| `GET` | `/api/flights/date-range` | Get min/max date range |

### Analytics (🔒 Authenticated, user-scoped)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/eda` | Exploratory data analysis |
| `GET` | `/api/analytics/destinations` | Destination difficulty analysis |
| `GET` | `/api/analytics/insights` | Operational insights |
| `GET` | `/api/analytics/trends` | Difficulty trends over time |

### Upload & Data (🔒 Authenticated, user-scoped)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/csv` | Upload CSV data file |
| `POST` | `/api/json-upload` | Upload processed JSON data |
| `GET` | `/api/json-upload` | Get uploaded data (per user) |
| `DELETE` | `/api/json-upload` | Clear uploaded data |
| `POST` | `/api/process-data` | Trigger data processing pipeline |

---

## 🛡️ Security & Data Isolation

- **JWT Authentication**: Token-based auth with `Bearer` headers on every API call
- **Per-User Data Scoping**: All database queries are filtered by `userId` — users never see other accounts' data
- **Route Protection**: Frontend `RequireAuth` component guards all data pages; unauthenticated users are redirected to login with return-path preserved
- **API Rate Limiting**: Express rate limiter on all endpoints
- **File Validation**: Type and size checks on CSV uploads (max 50 MB)
- **CORS Protection**: Configurable origin whitelist
- **Password Hashing**: bcryptjs with salt rounds
- **401 Interceptor**: Automatic token cleanup and redirect on expired/invalid tokens

---

## 🎨 Theme System

The application supports **Dark** and **Light** modes:

- **Toggle**: Sun/Moon icon in the navbar switches themes instantly
- **Ant Design Integration**: `ConfigProvider` dynamically switches between `theme.darkAlgorithm` and `theme.defaultAlgorithm`
- **Custom Tokens**: `colorBgContainer`, `colorBgElevated`, `colorText`, `colorBorder`, etc. are set per-theme
- **CSS Variables**: `--bg-page`, `--bg-card`, `--text-primary`, `--text-muted`, `--navbar-bg`, etc. in `index.css`
- **Persistence**: Theme preference is stored via `data-theme` attribute on `<html>`

---

## 📊 Sample Data

Sample CSV files are provided in the `sample-data/` directory for testing:
- Flight Level Data (sample & large)
- PNR Flight Level Data (sample & large)
- PNR Remark Level Data (sample & large)
- Bag Level Data (sample & large)
- Airports Data (sample & large)

### Recommended Upload Order
1. Airports Data
2. Flight Level Data
3. PNR Flight Level Data
4. PNR Remark Level Data
5. Bag Level Data

---

## 🔧 Utility Scripts

The `scripts/` directory contains helpful utilities:
- `setup.js` — Initial database setup
- `process-data.js` — CLI data processing
- `generate-large-sample-data.js` — Generate large test datasets
- `generate-test-output.js` — Generate test output data
- `debug-csv.js` — Debug CSV parsing issues

---

## 📄 License

This project is licensed under the MIT License.

---

**Built for SkyHack 3.0 — United Airlines Flight Difficulty Score Challenge**
