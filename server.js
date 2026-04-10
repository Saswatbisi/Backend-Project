// 🔐 Load environment variables
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// ✅ DB CONNECTION
const connectDB = require('./db');

// 🔗 Controller
const userController = require('./controllers/userController');

// ✅ MODEL
const User = require('./models/User');

// ✅ AUTH MIDDLEWARE
const auth = require('./middleware/auth');

// ✅ Port
const port = process.env.PORT || 5000;

// 🔹 Middleware (Logging)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// 🔹 Middleware (Parse JSON)
app.use(express.json());

// ✅ Connect DB
connectDB().then((connected) => {
  if (!connected) {
    console.warn('⚠️ MongoDB is not connected. Routes that need DB will return errors.');
  }
});

// ═══════════════════════════════════════════
// 🔹 ROUTES
// ═══════════════════════════════════════════

// 🔹 Home Route
app.get('/', (_req, res) => {
  res.send('Server Running');
});

// 🔹 GET Users (Controller)
app.get('/api/users', userController.getUsers);

// ═══════════════════════════════════════════
// 🔐 SECTION 1: REGISTER (Password Hashing with Bcrypt)
// ═══════════════════════════════════════════

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, Email, and Password are required!'
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user (password is hashed automatically by pre-save hook)
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({
      message: 'User Registered Successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
// 🔐 SECTION 2: LOGIN (JWT Token Issuance)
// ═══════════════════════════════════════════

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required!' });
    }

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User does not exist' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. Create Token (Secret key from .env)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login Successful',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
// 🔐 SECTION 3: PROTECTED ROUTE (Dashboard)
// ═══════════════════════════════════════════

app.get('/api/dashboard', auth, (req, res) => {
  res.json({
    message: 'Welcome to the Private Dashboard',
    user: req.user
  });
});

// 🔹 Start server
app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
});