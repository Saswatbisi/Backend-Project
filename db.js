const mongoose = require('mongoose');

const dbURI = process.env.DB_URL || 'mongodb+srv://<db_username>:<db_password>@cluster0.hvhxsjy.mongodb.net/?appName=Cluster0';

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