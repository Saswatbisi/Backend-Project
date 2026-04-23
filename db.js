require('dotenv').config();
const mongoose = require('mongoose');

const dbURI = process.env.DB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("✅ MongoDB Connected...");
    return true;
  } catch (err) {
    console.error("❌ Connection Failed:", err.message);
    return false; // Don't exit — let server stay alive
  }
};

module.exports = connectDB;