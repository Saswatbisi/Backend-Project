// 🔐 Load environment variables
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Unauthorized"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Listen for a specific event
  socket.on('message', (data) => {
    console.log('Message received:', data);
    // Broadcast to EVERYONE connected
    io.emit('message_broadcast', data);
  });

  socket.on('join_activity', (activityId) => {
    socket.join(activityId);
    console.log(`User joined room: ${activityId}`);
  });

  socket.on('send_activity_chat', (data) => {
    // Send ONLY to users in that specific activity room
    io.to(data.activityId).emit('new_chat', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// ✅ DB CONNECTION
const connectDB = require('./db');

// 🔗 Controller
const userController = require('./controllers/userController');

// ✅ MODELS
const User = require('./models/User');
const Post = require('./models/Post');

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

// ═══════════════════════════════════════════
// 📝 SECTION 4: POSTS (Data Relationships & Population)
// ═══════════════════════════════════════════

// @route   POST /api/posts
// @desc    Create a post linked to the logged-in user
app.post('/api/posts', auth, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id // Taken from the JWT middleware
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/posts
// @desc    Get all posts with Author details and pagination
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find posts, add pagination, and "fill in" the author name and email
    const posts = await Post.find()
      .skip(skip)
      .limit(limit)
      .populate('author', ['username', 'email']);
      
    const total = await Post.countDocuments();

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      posts
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 🔹 Start server
server.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
});