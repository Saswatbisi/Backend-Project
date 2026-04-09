// 🔐 Load environment variables
require('dotenv').config();

const express = require('express');
const app = express();

// ✅ DB CONNECTION
const connectDB = require('./db');
let dbConnected = false;

// 🔗 Controller
const userController = require('./controllers/userController');

// ✅ MODEL
const User = require('./models/User');

// ✅ Port
const port = process.env.PORT || 5000;

// 🔹 Middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

app.use(express.json());

// ✅ Connect DB
connectDB().then((connected) => {
  dbConnected = connected;
  if (!connected) {
    console.warn('⚠️ MongoDB is not connected. /api/register POST will return 503 until the database is available.');
  }
});

// 🔹 Routes
app.get('/', (_req, res) => {
  res.send('Server Running');
});

app.get('/api/users', userController.getUsers);

app.get('/api/register', (_req, res) => {
  res.json({
    message: 'Register endpoint is available. Use POST to create a user.',
    example: {
      method: 'POST',
      url: '/api/register',
      body: { username: 'saswatbisi', password: '12345' }
    }
  });
});

// 🔹 POST API (DB SAVE)
app.post('/api/register', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      error: 'Database is not connected. Start MongoDB and restart the server.'
    });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and Password are required!"
      });
    }

    const newUser = new User({ username, password });
    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User Registered Successfully",
      data: savedUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});