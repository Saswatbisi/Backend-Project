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
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and Password are required!"
      });
    }

    // Mock user creation without DB
    const mockUser = {
      _id: Date.now().toString(),
      username,
      password,
      createdAt: new Date()
    };

    res.status(201).json({
      message: "User Registered Successfully",
      data: mockUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});