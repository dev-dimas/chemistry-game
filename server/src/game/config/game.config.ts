/**
 * Game Configuration
 *
 * This file contains all customizable game settings.
 * Modify these values to change game behavior.
 */

export const GameConfig = {
  /**
   * Number of words/rounds per game
   * Default: 10
   */
  WORDS_PER_GAME: 2,

  /**
   * Minimum number of players required to start a game
   * Default: 2
   */
  MIN_PLAYERS: 2,

  /**
   * Maximum number of players allowed in a room
   * Default: 10
   */
  MAX_PLAYERS: 10,

  /**
   * Room inactivity timeout in milliseconds
   * Rooms inactive longer than this will be automatically deleted
   * Default: 15 minutes (15 * 60 * 1000)
   */
  ROOM_INACTIVITY_TIMEOUT: 15 * 60 * 1000,

  /**
   * Cleanup interval in milliseconds
   * How often to check for inactive rooms
   * Default: 1 minute (60 * 1000)
   */
  CLEANUP_INTERVAL: 60 * 1000,
};
