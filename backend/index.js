
// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { handleWebSocketConnection } = require('./routes/signaling');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Basic HTTP route for health checks
app.get('/', (req, res) => {
  res.send('AI Voice Translator Backend is running!');
});

// WebSocket connection handling
wss.on('connection', handleWebSocketConnection);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    wss.close(() => {
        console.log('WebSocket server closed.');
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    });
});
