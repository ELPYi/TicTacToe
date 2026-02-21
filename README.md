# Tic Tac Toe

A real-time multiplayer Tic Tac Toe game built with React and Node.js.

## Features

- **Room-based matchmaking** — Create or join games using unique room codes
- **Real-time gameplay** — Moves sync instantly between players via WebSockets
- **Rematch voting** — Both players can agree to play again without leaving the room
- **Auto-cleanup** — Rooms are cleaned up automatically when players disconnect

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express, Socket.IO

## Getting Started

### Prerequisites

- Node.js

### Installation

```bash
# Install dependencies for both client and server
cd client && npm install
cd ../server && npm install
```

### Running

```bash
# From root directory, start both in separate terminals:
npm run dev:client
npm run dev:server
```

The client runs on `http://localhost:5173` and the server on `http://localhost:3000`.

## How to Play

1. Open the app and create a new room or enter an existing room code
2. Share the room code with a friend
3. Take turns placing X or O on the 3x3 grid
4. First to get three in a row wins!
