// 🔐 Load environment variables
require('dotenv').config();

const express = require('express');
const app = express();

// 🔗 Import controller
const userController = require('./controllers/userController');

// ✅ Port from .env
const port = process.env.PORT || 5000;

// 🔹 Middleware (Logging)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// 🔹 Middleware (Parse JSON)
app.use(express.json());

// 🔹 Home Route
app.get('/', (_req, res) => {
  res.send('Server Running');
});

// 🔹 About Route
app.get('/about', (_req, res) => {
  res.send('This is the About API — Backend logic is active.');
});

// 🔹 Status Route (.env check)
app.get('/status', (_req, res) => {
  res.json({
    message: "System Online",
    environment_port: port,
    auth_status: process.env.API_KEY ? "Securely Loaded" : "Missing Key"
  });
});

// 🔹 GET Users (Controller)
app.get('/api/users', userController.getUsers);

// 🔹 GET Register API (for testing)
app.get('/api/register', (req, res) => {
  res.json({
    message: "Register endpoint - Use POST with username and password in body",
    example: {
      method: "POST",
      url: "/api/register",
      body: { username: "yourname", password: "yourpass" }
    }
  });
});

// 🔹 POST Register API
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and Password are required!"
    });
  }

  res.status(201).json({
    message: "User Registered Successfully",
    user: username
  });
});
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});