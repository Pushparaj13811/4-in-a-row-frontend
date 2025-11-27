# 4-in-a-Row Frontend - Real-time Multiplayer Game

A beautiful, real-time multiplayer **4-in-a-Row** (Connect Four) game built with **React**, **TypeScript**, and **WebSockets**.

## What is this?

This is the frontend web application for a multiplayer Connect Four game. Features include:
- Real-time multiplayer gameplay via WebSockets
- Smart matchmaking (finds opponents or plays with AI bot)
- Live leaderboard with player statistics
- Auto-reconnection if you lose connection
- Keyboard controls for faster gameplay
- Beautiful dark-themed UI with smooth animations

## How to Run This Application

### Prerequisites

Make sure you have these installed:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **Backend server running** - See backend README for setup instructions

### Step-by-Step Setup

#### Step 1: Make Sure Backend is Running

Before starting the frontend, you need the backend server running. Open a terminal and:

```bash
# Navigate to backend folder
cd ../backend

# Start the backend (if not already running)
npm run dev
```

You should see:
```
🚀 WebSocket server running on ws://localhost:3001
```

Keep this terminal open and running!

#### Step 2: Install Frontend Dependencies

Open a **new terminal** window, navigate to the frontend folder, and run:

```bash
npm install
```

This installs all required packages (React, Vite, TypeScript, etc.).

#### Step 3: Start the Frontend

```bash
npm run dev
```

You should see output like this:

```
VITE v7.2.4  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### Step 4: Play the Game!

1. Open your browser and go to `http://localhost:5173/`
2. Enter a username (3-20 characters)
3. Click "Join Game"
4. Wait for an opponent (or play with the bot after 10 seconds)
5. Click columns or press 1-7 keys to drop discs
6. Win by connecting 4 discs in a row!

---

## Game Controls

### Mouse Controls
- **Click on columns** to drop your disc

### Keyboard Shortcuts
- **1-7** - Select column 1 through 7 to drop disc
- **L** - Open/close leaderboard
- **ESC** - Close leaderboard or dialogs

---

## Game Features

### Matchmaking
- Enter a username and join the matchmaking queue
- Wait up to 10 seconds for another player
- If no player found, you'll play against an AI bot
- The bot is smart - it blocks your wins and plays strategically!

### Reconnection
- If you lose connection during a game, don't worry!
- You have 30 seconds to reconnect automatically
- Your game state is preserved in session storage
- Just refresh the page if disconnected

### Leaderboard
- View top players sorted by wins
- See win/loss/draw statistics
- Win rate percentage for each player
- Medal icons for top 3 players

### Game Screens

1. **Login Screen** - Enter username to start
2. **Waiting Screen** - Finding opponent (10 second timer)
3. **Playing Screen** - Active game with live board
4. **Finished Screen** - Game over with result banner

---

## Understanding the UI

### Connection Status (Top Right)
- **Green**: Connected to server
- **Yellow**: Connecting...
- **Red**: Disconnected (will auto-reconnect)

### Player Colors
- **Red** - First player (starts the game)
- **Yellow** - Second player

### Turn Indicator
- **Green "Your Turn"** - It's your turn to play
- **Gray "Opponent's Turn"** - Wait for opponent

---

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Board.tsx          # Game board (7×6 grid)
│   │   ├── Board.css
│   │   ├── Leaderboard.tsx    # Leaderboard modal
│   │   └── Leaderboard.css
│   │
│   ├── services/           # Business logic
│   │   └── websocket.ts       # WebSocket communication
│   │
│   ├── types/              # TypeScript types
│   │   ├── game.types.ts      # Game-related types
│   │   ├── websocket.types.ts # WebSocket message types
│   │   └── index.ts           # Type exports
│   │
│   ├── constants/          # App constants
│   │   ├── game.constants.ts  # Game configuration
│   │   └── index.ts
│   │
│   ├── utils/              # Utility functions
│   │   ├── game.utils.ts      # Helper functions
│   │   └── index.ts
│   │
│   ├── App.tsx             # Main app component
│   ├── App.css             # App styles
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

---

## Available Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

---

## How It Works

### WebSocket Communication

The frontend connects to the backend via WebSocket for real-time updates:

```
Frontend (React)  ←→  WebSocket  ←→  Backend Server
     ↓                                    ↓
  User Actions                      Game Logic
     ↓                                    ↓
Send Messages                     Process & Respond
     ↓                                    ↓
Update UI State  ←←←  Receive Messages  ←←
```

### Message Flow Example

1. User clicks "Join Game"
   - Frontend sends: `{"type": "join", "username": "Alice"}`
   - Backend responds: `{"type": "waiting", "timeLeft": 10}`

2. Opponent found or bot ready
   - Backend sends: `{"type": "gameStart", "gameId": "...", "yourColor": "red", ...}`
   - Frontend updates UI to show game board

3. User makes a move (clicks column 3)
   - Frontend sends: `{"type": "move", "gameId": "...", "column": 3}`
   - Backend validates move and broadcasts to both players
   - Backend sends: `{"type": "move", "board": [...], "currentPlayer": "yellow"}`

4. Game ends
   - Backend sends: `{"type": "move", "winner": "red", ...}`
   - Frontend shows result screen

---

## Configuration

### Backend URL

The frontend connects to the backend at `ws://localhost:3001`. If you change the backend port, update it in:

```typescript
// src/constants/game.constants.ts
export const WEBSOCKET_URL = 'ws://localhost:3001';
```

### Game Constants

You can customize game behavior in `src/constants/game.constants.ts`:

```typescript
export const BOARD_ROWS = 6;           // Board height
export const BOARD_COLS = 7;           // Board width
export const MATCHMAKING_TIMEOUT = 10; // Seconds to wait for opponent
```

---

## Code Architecture Highlights

### Type Safety
- Full TypeScript coverage
- Strict type checking enabled
- Types defined in single source of truth (`src/types/`)

### Clean Imports
- Path aliases for cleaner imports: `@/components`, `@/types`, `@/utils`
- No relative path hell (`../../../`)

### State Management
- React hooks (useState, useEffect, useCallback, useRef)
- Session storage for reconnection persistence
- Proper cleanup in useEffect returns

### Reusable Code
- Utilities extracted to `src/utils/`
- Constants centralized in `src/constants/`
- Components are focused and single-purpose

---

## Troubleshooting

### "Failed to connect to game server"

**Problem**: Frontend can't reach backend

**Solution**:
1. Make sure backend is running (`npm run dev` in backend folder)
2. Check backend is on port 3001
3. Look for errors in backend terminal
4. Verify `WEBSOCKET_URL` in `src/constants/game.constants.ts`

### "Cannot rejoin this game"

**Problem**: Trying to rejoin an expired or invalid game

**Solution**:
1. Click "New Game" instead of trying to rejoin
2. Clear browser session storage (Dev Tools → Application → Session Storage)
3. Refresh the page

### Port 5173 already in use

**Problem**: Vite dev server port is occupied

**Solution**:
Vite will automatically try port 5174, 5175, etc. Just use the port shown in the terminal output.

### Board not updating

**Problem**: Moves aren't showing up

**Solution**:
1. Check browser console for WebSocket errors
2. Verify backend is running and accepting connections
3. Refresh the page to reconnect

---

## Design & Styling

### Color Palette
- **Background**: `#0F172A` (Dark navy)
- **Cards**: `#1E293B` (Slate)
- **Primary**: `#38BDF8` (Sky blue)
- **Success**: `#22C55E` (Green)
- **Error**: `#F87171` (Muted red)
- **Warning**: `#FBBF24` (Yellow)

### Responsive Design
- Mobile-friendly layout
- Adapts to different screen sizes
- Touch-friendly buttons and controls

---

## What's Next?

Once you're playing:
1. Try to beat the bot (it's strategic!)
2. Invite a friend to play together
3. Check the leaderboard to see top players
4. Use keyboard shortcuts for faster gameplay
5. Try reconnecting mid-game by refreshing the page

---

## Tips for Playing

- **Bot Strategy**: The bot blocks your winning moves, so think ahead!
- **Center columns**: Control the center for more winning opportunities
- **Think vertically**: Vertical wins are easier to setup than horizontal
- **Watch for diagonals**: They're the hardest to spot but very powerful
- **Time pressure**: No time limit, so take your time to plan

---

## Need Help?

- Check browser console for error messages (F12 → Console tab)
- Make sure backend server is running
- Verify WebSocket connection in Network tab (F12 → Network → WS)
- Clear browser cache and session storage if issues persist

**Enjoy the game!**
