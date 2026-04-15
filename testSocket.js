const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('Generating dummy token for Socket Authentication...');
const token = jwt.sign(
  { id: 'testUserId_999', username: 'TestUser_Sockets' },
  'my_super_secret_jwt_key_2026',
  { expiresIn: '1h' }
);

console.log('Attempting to connect to WS server...');
const socket = io('ws://localhost:5000', {
  auth: {
    token: token
  }
});

// Timeout fail safe
const timeout = setTimeout(() => {
  console.error('❌ Timeout! Server did not respond.');
  process.exit(1);
}, 5000);

socket.on('connect', () => {
  console.log(`✅ Successfully connected! Socket ID: ${socket.id}`);
  
  console.log('Joning room: activity_456...');
  socket.emit('join_activity', 'activity_456');
  
  setTimeout(() => {
    console.log('Sending message to room activity_456...');
    socket.emit('send_activity_chat', {
      activityId: 'activity_456',
      message: 'Hello Live Room!'
    });
  }, 500);
});

socket.on('new_chat', (msg) => {
  console.log(`✅ Received 'new_chat' in room: ${msg}`);
  clearTimeout(timeout);
  console.log('🎉 Socket operations completely functional! Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Connection failed (Auth/Server Error):', err.message);
  process.exit(1);
});
