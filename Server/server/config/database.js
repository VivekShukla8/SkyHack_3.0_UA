const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://vivekshukla942493:vivek9424@cluster0.vkysmvm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    const conn = await mongoose.connect(uri.trim());

    console.log(`MongoDB Connected successfully`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.warn('Server will continue running without database connection.');
  }
};

module.exports = connectDB;

