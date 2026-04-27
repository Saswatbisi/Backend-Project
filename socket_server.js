const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the index.html test client
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 1. Listen for a connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 2. Listen for a custom event from the client
    socket.on('join_activity', (data) => {
        console.log(`User joined activity: ${data.activityName}`);

        // 3. Broadcast to EVERYONE else that someone joined
        socket.broadcast.emit('new_participant', {
            message: `A new user has joined ${data.activityName}!`
        });
    });

    socket.on('subscribe_to_event', (eventId) => {
        // Join a specific room based on Event ID
        socket.join(eventId);
        console.log(`Socket ${socket.id} joined room: ${eventId}`);

        // Send a message ONLY to people in this specific room
        io.to(eventId).emit('notification', `Live update for Event ${eventId}: The organizer has arrived!`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
