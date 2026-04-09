const mongoose = require('mongoose');

const dbURI = process.env.DB_URL || 'mongodb://localhost:27017/my_backend_db';

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("✅ MongoDB Connected...");
    return true;
  } catch (err) {
    console.error("❌ Connection Failed:", err.message);
    return false;
  }
};

module.exports = connectDB;