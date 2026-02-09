const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
});

// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

const { createRoom, joinRoom, makeMove, playAgain, removePlayer, sanitizeRoom } = require('./rooms');

io.on('connection', (socket) => {
  socket.on('create-room', ({ playerName }, callback) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    callback({ ok: true, roomCode: room.code, mark: 'X' });
  });

  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const result = joinRoom(roomCode, socket.id, playerName);
    if (result.error) {
      callback({ ok: false, error: result.error });
      return;
    }

    socket.join(roomCode);
    callback({ ok: true, mark: 'O' });

    // Notify the first player
    socket.to(roomCode).emit('opponent-joined', { opponentName: playerName });

    // Send initial game state to both players
    io.to(roomCode).emit('game-state', sanitizeRoom(result.room));
  });

  socket.on('make-move', ({ roomCode, index }) => {
    const result = makeMove(roomCode, socket.id, index);
    if (result.error) return;
    io.to(roomCode).emit('game-state', sanitizeRoom(result.room));
  });

  socket.on('play-again', ({ roomCode }) => {
    const result = playAgain(roomCode, socket.id);
    if (result.error) return;
    io.to(roomCode).emit('game-state', sanitizeRoom(result.room));
  });

  socket.on('leave-room', () => {
    const result = removePlayer(socket.id);
    if (result) {
      socket.leave(result.roomCode);
      if (result.remaining) {
        io.to(result.roomCode).emit('opponent-left');
      }
    }
  });

  socket.on('disconnecting', () => {
    const result = removePlayer(socket.id);
    if (result && result.remaining) {
      socket.to(result.roomCode).emit('opponent-left');
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
