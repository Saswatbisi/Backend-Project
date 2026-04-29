// 🔐 Load environment variables
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Worker } = require('worker_threads');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// ✅ REDIS CACHE
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
client.connect().then(() => console.log('✅ Redis Connected...')).catch(console.error);
// 🔗 Controller
const userController = require('./controllers/userController');

// ✅ MODELS
const User = require('./models/User');
const Post = require('./models/Post');

// 📄 SWAGGER DOCUMENTATION
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger_config');

// ✅ AUTH MIDDLEWARE
const auth = require('./middleware/auth');

// ✅ Port
const port = process.env.PORT || 5000;

// 🛡️ Helmet: Harden HTTP headers
app.use(helmet());

// 🔹 Middleware (Logging)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// 🔹 Middleware (Parse JSON)
app.use(express.json());

// 📄 Swagger UI - Live Interactive API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Platform Core API Docs',
}));

// ═══════════════════════════════════════════
// 🚦 RATE LIMITING
// ═══════════════════════════════════════════

// 1. General API limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});
// app.use('/api/', apiLimiter); // DISABLING FOR LOAD TESTING

// 2. Strict login limiter: 5 attempts per hour
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 failed attempts allowed per hour
  message: { error: 'Too many login attempts. Account locked for 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/login', loginLimiter);
app.use('/api/register', loginLimiter);

// ✅ Connect DB
connectDB().then((connected) => {
  if (!connected) {
    console.warn('⚠️ MongoDB is not connected. Routes that need DB will return errors.');
  }
});

// ═══════════════════════════════════════════
// 🔹 ROUTES
// ═══════════════════════════════════════════

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Returns server status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
// 🔹 Home Route
app.get('/', (_req, res) => {
  res.send('Server Running');
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (paginated)
 *     description: Retrieves a paginated list of all registered users. Passwords are excluded from the response. Used by the Analyst team for user metrics.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUsers'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 🔹 GET Users (Controller)
app.get('/api/users', userController.getUsers);

// ═══════════════════════════════════════════
// 🔐 SECTION 1: REGISTER (Password Hashing with Bcrypt)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Password is hashed using bcrypt before storage.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
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

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login and receive JWT token
 *     description: Authenticates a user and returns a JWT token valid for 1 hour. This token must be passed in the `x-auth-token` header for protected routes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful, JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts (rate limited)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
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

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Access the protected dashboard
 *     description: Returns the authenticated user's dashboard data. Requires a valid JWT token in the `x-auth-token` header.
 *     tags: [Protected]
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data for authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the Private Dashboard
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *       401:
 *         description: Unauthorized - no token or invalid token
 */
app.get('/api/dashboard', auth, (req, res) => {
  res.json({
    message: 'Welcome to the Private Dashboard',
    user: req.user
  });
});

// ═══════════════════════════════════════════
// 📝 SECTION 4: POSTS (Data Relationships & Population)
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a post linked to the authenticated user. Requires JWT token. Used by the AI/ML team to push feature data.
 *     tags: [Posts]
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostInput'
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (paginated, cached)
 *     description: Retrieves a paginated list of posts with populated author details. Supports Redis caching. This is the primary data-pull endpoint for the Analyst team.
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPosts'
 *       500:
 *         description: Server error
 */
// @route   GET /api/posts
// @desc    Get all posts with Author details and pagination
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_page_${page}_limit_${limit}`;

    // CHECK CACHE IF ENABLED
    if (process.env.ENABLE_CACHE === 'true') {
      const cached = await client.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // Find posts, add pagination, and "fill in" the author name and email
    const posts = await Post.find()
      .skip(skip)
      .limit(limit)
      .populate('author', ['username', 'email']);
      
    const total = await Post.countDocuments();

    const responseTemplate = {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      posts
    };

    // SET CACHE IF ENABLED
    if (process.env.ENABLE_CACHE === 'true') {
      await client.setEx(cacheKey, 3600, JSON.stringify(responseTemplate));
    }

    res.json(responseTemplate);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     description: Retrieves a specific post by MongoDB ObjectId. Uses Redis caching with 1-hour TTL. Used by the AI/ML team for individual feature lookups.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
// @route   GET /api/posts/:id
// @desc    Get post by ID (with Redis caching)
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Try to fetch from Redis
    const cachedPost = await client.get(id);

    if (cachedPost) {
      console.log("Cache Hit! Returning data from Redis.");
      return res.json(JSON.parse(cachedPost));
    }

    // 2. If not in Redis, fetch from MongoDB
    const post = await Post.findById(id);

    if (!post) return res.status(404).send('Post not found');

    // 3. Save to Redis with an Expiry (TTL) of 1 hour (3600 seconds)
    // This ensures the cache doesn't stay "stale" forever
    await client.setEx(id, 3600, JSON.stringify(post));

    console.log("Cache Miss. Fetching from DB and updating Redis.");
    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     description: Updates a post and invalidates the Redis cache entry to ensure data consistency.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostInput'
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
// @route   PUT /api/posts/:id
// @desc    Update a post and invalidate cache
app.put('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // CRITICAL: Delete the old cache so the next GET fetches fresh data
    await client.del(req.params.id);

    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ═══════════════════════════════════════════
// ⚙️ SECTION 5: BACKGROUND TASKS & QUEUES
// ═══════════════════════════════════════════

/**
 * @swagger
 * /api/block:
 *   get:
 *     summary: Blocking CPU task (demonstration)
 *     description: Deliberately blocks the event loop to demonstrate why worker threads are needed. Do NOT call in production.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Task completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: number
 *                 timeTakenMs:
 *                   type: number
 */
// @route   GET /api/block
// @desc    Blocking route that freezes the event loop
app.get('/api/block', (req, res) => {
  console.log(`[${new Date().toISOString()}] Starting blocking task...`);
  const startTime = Date.now();
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += i;
  }
  const endTime = Date.now();
  console.log(`[${new Date().toISOString()}] Finished blocking task in ${endTime - startTime}ms`);
  
  res.json({ success: true, result, timeTakenMs: endTime - startTime });
});

/**
 * @swagger
 * /api/heavy-task:
 *   get:
 *     summary: Non-blocking heavy task (Worker Thread)
 *     description: Offloads a CPU-intensive computation to a worker thread, keeping the event loop free for other requests.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Task completed via worker thread
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: number
 *                 timeTakenMs:
 *                   type: number
 *       500:
 *         description: Worker error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @route   GET /api/heavy-task
// @desc    Offloads heavy task to a Worker Thread
app.get('/api/heavy-task', (req, res) => {
  console.log(`[${new Date().toISOString()}] Starting worker task...`);
  const startTime = Date.now();
  
  const worker = new Worker('./worker.js', {
    workerData: { iterations: 1000000000 }
  });

  worker.on('message', (result) => {
    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] Finished worker task in ${endTime - startTime}ms`);
    res.json({ success: true, result, timeTakenMs: endTime - startTime });
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
    res.status(500).json({ error: err.message });
  });
});

// 🔹 Start server (only when not in test mode)
if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`🚀 Server started on port ${port}`);
    console.log(`📄 API Docs available at http://localhost:${port}/api-docs`);
  });
}

// Export app for integration testing with Supertest
module.exports = app;