# Game Configuration

This directory contains the game configuration file that allows you to customize various game settings.

## Configuration File

`game.config.ts` - Main configuration file for game settings

## Available Settings

### WORDS_PER_GAME
- **Type:** `number`
- **Default:** `10`
- **Description:** Number of words/rounds per game
- **Example:** Change to `5` for shorter games, `20` for longer games

### MIN_PLAYERS
- **Type:** `number`
- **Default:** `2`
- **Description:** Minimum number of players required to start a game
- **Example:** Change to `3` to require at least 3 players

### MAX_PLAYERS
- **Type:** `number`
- **Default:** `10`
- **Description:** Maximum number of players allowed in a room
- **Example:** Change to `6` for smaller rooms, `20` for larger rooms

### ROOM_INACTIVITY_TIMEOUT
- **Type:** `number` (milliseconds)
- **Default:** `900000` (15 minutes)
- **Description:** Time before inactive rooms are automatically deleted
- **Example:** 
  - `600000` = 10 minutes
  - `1800000` = 30 minutes
  - `3600000` = 1 hour

### CLEANUP_INTERVAL
- **Type:** `number` (milliseconds)
- **Default:** `60000` (1 minute)
- **Description:** How often the server checks for inactive rooms
- **Example:**
  - `30000` = 30 seconds
  - `120000` = 2 minutes

## How to Modify

1. Open `backend/src/game/config/game.config.ts`
2. Change the values you want to customize
3. Save the file
4. Rebuild the backend: `npm run build`
5. Restart the server: `npm run start` or `npm run start:dev`

## Example Customization

For a quick game with 5 rounds for 2-6 players:

```typescript
export const GameConfig = {
  WORDS_PER_GAME: 5,          // Changed from 10
  MIN_PLAYERS: 2,             // Keep default
  MAX_PLAYERS: 6,             // Changed from 10
  ROOM_INACTIVITY_TIMEOUT: 15 * 60 * 1000,  // Keep default
  CLEANUP_INTERVAL: 60 * 1000,               // Keep default
};
```

For a long tournament game with 20 rounds for 4-15 players:

```typescript
export const GameConfig = {
  WORDS_PER_GAME: 20,         // Changed from 10
  MIN_PLAYERS: 4,             // Changed from 2
  MAX_PLAYERS: 15,            // Changed from 10
  ROOM_INACTIVITY_TIMEOUT: 30 * 60 * 1000,  // 30 minutes
  CLEANUP_INTERVAL: 60 * 1000,               // Keep default
};
```

## Notes

- The frontend automatically adapts to the number of words configured
- Chemistry score percentage is calculated dynamically based on `WORDS_PER_GAME`
- Changes require server restart to take effect
- Make sure your word pool (in `constants/words.ts`) has enough words for your `WORDS_PER_GAME` setting
