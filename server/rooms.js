const { nanoid } = require('nanoid');
const { createBoard, checkWinner } = require('./game');

const rooms = new Map();

function generateCode() {
  return nanoid(6).toUpperCase();
}

function createRoom(socketId, playerName) {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }

  const room = {
    code,
    players: [{ id: socketId, name: playerName, mark: 'X' }],
    board: createBoard(),
    currentTurn: 'X',
    winner: null,
    gameActive: false,
    playAgainVotes: [],
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.players.length >= 2) return { error: 'Room is full' };

  room.players.push({ id: socketId, name: playerName, mark: 'O' });
  room.gameActive = true;
  return { room };
}

function makeMove(roomCode, socketId, index) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (!room.gameActive) return { error: 'Game is not active' };

  const player = room.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not in room' };
  if (player.mark !== room.currentTurn) return { error: 'Not your turn' };
  if (index < 0 || index > 8) return { error: 'Invalid cell' };
  if (room.board[index] !== null) return { error: 'Cell already taken' };

  room.board[index] = player.mark;

  const result = checkWinner(room.board);
  if (result) {
    room.winner = result;
    room.gameActive = false;
  } else {
    room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
  }

  return { room };
}

function playAgain(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.players.length < 2) return { error: 'Need two players' };

  if (!room.playAgainVotes.includes(socketId)) {
    room.playAgainVotes.push(socketId);
  }

  if (room.playAgainVotes.length >= 2) {
    room.board = createBoard();
    room.currentTurn = 'X';
    room.winner = null;
    room.gameActive = true;
    room.playAgainVotes = [];
    return { room, started: true };
  }

  return { room, started: false };
}

function removePlayer(socketId) {
  for (const [code, room] of rooms) {
    const index = room.players.findIndex((p) => p.id === socketId);
    if (index === -1) continue;

    room.players.splice(index, 1);
    room.gameActive = false;
    room.winner = null;

    if (room.players.length === 0) {
      rooms.delete(code);
      return { roomCode: code, remaining: null };
    }

    return { roomCode: code, remaining: room.players[0] };
  }

  return null;
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function sanitizeRoom(room) {
  return {
    board: room.board,
    currentTurn: room.currentTurn,
    winner: room.winner,
    gameActive: room.gameActive,
    players: room.players.map((p) => ({ name: p.name, mark: p.mark })),
    playAgainVotes: room.playAgainVotes.map(
      (id) => room.players.find((p) => p.id === id)?.mark
    ),
  };
}

module.exports = { createRoom, joinRoom, makeMove, playAgain, removePlayer, getRoom, sanitizeRoom };
