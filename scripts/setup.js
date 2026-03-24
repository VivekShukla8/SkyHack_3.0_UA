#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Setup script for United Airlines Flight Difficulty Score System
 * 
 * This script automates the setup process for the MERN stack application
 */

class SetupScript {
  constructor() {
    this.projectRoot = process.cwd();
    this.serverDir = path.join(this.projectRoot, 'server');
    this.clientDir = path.join(this.projectRoot, 'client');
  }

  async run() {
    console.log('🚀 Setting up United Airlines Flight Difficulty Score System...\n');

    try {
      this.checkPrerequisites();
      this.installDependencies();
      this.createDirectories();
      this.createEnvironmentFiles();
      this.displayInstructions();
      
      console.log('\n✅ Setup completed successfully!');
      console.log('\n🎉 You can now start the application with: npm run dev');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  checkPrerequisites() {
    console.log('📋 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
      throw new Error(`Node.js version 14 or higher is required. Current version: ${nodeVersion}`);
    }
    
    console.log(`✅ Node.js version: ${nodeVersion}`);

    // Check if MongoDB is available
    try {
      execSync('mongod --version', { stdio: 'pipe' });
      console.log('✅ MongoDB is available');
    } catch (error) {
      console.log('⚠️  MongoDB not found. Please install MongoDB and ensure it\'s running.');
    }

    // Check if CSV files exist
    const csvFiles = [
      'Airports Data.csv',
      'Flight Level Data.csv',
      'PNR+Flight+Level+Data.csv',
      'PNR Remark Level Data.csv',
      'Bag+Level+Data.csv'
    ];

    const missingFiles = csvFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      console.log('⚠️  Missing CSV files:', missingFiles.join(', '));
      console.log('   Please ensure all data files are in the project root directory.');
    } else {
      console.log('✅ All CSV data files found');
    }
  }

  installDependencies() {
    console.log('\n📦 Installing dependencies...');
    
    // Install root dependencies
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Install server dependencies
    console.log('Installing server dependencies...');
    execSync('npm install', { 
      cwd: this.serverDir, 
      stdio: 'inherit' 
    });

    // Install client dependencies
    console.log('Installing client dependencies...');
    execSync('npm install', { 
      cwd: this.clientDir, 
      stdio: 'inherit' 
    });

    console.log('✅ Dependencies installed successfully');
  }

  createDirectories() {
    console.log('\n📁 Creating necessary directories...');
    
    const directories = [
      'server/uploads',
      'server/logs',
      'processed-data',
      'client/public'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  createEnvironmentFiles() {
    console.log('\n⚙️  Creating environment files...');
    
    // Server .env file
    const serverEnvPath = path.join(this.serverDir, '.env');
    if (!fs.existsSync(serverEnvPath)) {
      const serverEnvContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/flight-difficulty

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DEST=uploads/`;

      fs.writeFileSync(serverEnvPath, serverEnvContent);
      console.log('✅ Created server/.env file');
    }

    // Client .env file
    const clientEnvPath = path.join(this.clientDir, '.env');
    if (!fs.existsSync(clientEnvPath)) {
      const clientEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=1.0.0`;

      fs.writeFileSync(clientEnvPath, clientEnvContent);
      console.log('✅ Created client/.env file');
    }
  }

  displayInstructions() {
    console.log('\n📖 Setup Instructions:');
    console.log('\n1. Start MongoDB:');
    console.log('   mongod');
    console.log('\n2. Start the application:');
    console.log('   npm run dev');
    console.log('\n3. Open your browser:');
    console.log('   http://localhost:3000');
    console.log('\n4. Upload your data:');
    console.log('   - Go to the "Data Upload" page');
    console.log('   - Upload CSV files in this order:');
    console.log('     1. Airports Data.csv');
    console.log('     2. Flight Level Data.csv');
    console.log('     3. PNR+Flight+Level+Data.csv');
    console.log('     4. PNR Remark Level Data.csv');
    console.log('     5. Bag+Level+Data.csv');
    console.log('\n5. View the dashboard:');
    console.log('   - Navigate to the Dashboard to see flight difficulty scores');
    console.log('   - Use the Flight List to browse individual flights');
    console.log('   - Check Analytics for insights and recommendations');
    
    console.log('\n🔧 Available Scripts:');
    console.log('   npm run dev          - Start both frontend and backend');
    console.log('   npm run server       - Start only the backend');
    console.log('   npm run client       - Start only the frontend');
    console.log('   npm run build        - Build for production');
    console.log('   npm run install-all  - Install all dependencies');
    
    console.log('\n📊 Data Processing:');
    console.log('   node scripts/process-data.js  - Process and validate CSV data');
    
    console.log('\n🆘 Troubleshooting:');
    console.log('   - Ensure MongoDB is running on port 27017');
    console.log('   - Check that all CSV files are in the project root');
    console.log('   - Verify Node.js version 14 or higher');
    console.log('   - Check server logs for any errors');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new SetupScript();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = SetupScript;
