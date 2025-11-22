# Multiplayer Chemistry Game

A live multiplayer word-association game built with React and NestJS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd chemistry-game
    ```

2.  **Install Backend Dependencies**:
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**:
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the Backend Server** (Runs on port 3000):
    ```bash
    cd backend
    npm run start
    ```

2.  **Start the Frontend Client** (Runs on port 5173):
    ```bash
    cd frontend
    npm run dev
    ```

3.  Open `http://localhost:5173` in your browser.

## 🎮 Game Rules
1.  **Create a Room**: Enter your name and start a room. Share the link or code with friends.
2.  **Join**: Minimum 2 players required to start. Up to 10 players supported.
3.  **Play**: 
    - A word appears (e.g., "Sun").
    - Everyone types the first word that comes to mind.
    - If everyone types the same word -> **CHEMISTRY!** (Points awarded).
4.  **Win**: Complete 20 rounds and compare scores.

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Vite, Socket.io-client
- **Backend**: NestJS, Socket.io
- **Language**: TypeScript

## 📂 Project Structure
- `/backend`: NestJS server handling game state and WebSocket connections.
- `/frontend`: React application for the user interface.
- `/documentation`: Project specifications and API details.
