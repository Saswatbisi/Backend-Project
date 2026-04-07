const express = require('express');
const app = express();

// 🔹 Middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// 🔹 Home
app.get('/', (_req, res) => {
  res.send('Server Running');
});

// 🔹 About
app.get('/about', (_req, res) => {
  res.send('This is the About API — Backend logic is active.');
});

// 🔹 User JSON
app.get('/user', (_req, res) => {
  res.json({
    name: "John",
    age: 22,
    role: "Developer"
  });
});

// 🔹 Dummy Data
const users = [
  { id: 1, name: "Alice", status: "Active" },
  { id: 2, name: "Bob", status: "Away" },
  { id: 3, name: "Charlie", status: "Offline" }
];

// 🔹 API Route
app.get('/api/users', (_req, res) => {
  res.json(users);
});

// 🔹 Server Start
app.listen(3000, () => {
  console.log('Server started on port 3000');
});