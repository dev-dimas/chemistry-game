import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Room } from '../game/interfaces/game.interfaces';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null;
  private readonly ROOM_PREFIX = 'room:';
  private readonly PLAYER_ROOM_PREFIX = 'player:room:';

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.client = new Redis(redisUrl);
      this.logger.log('✅ Redis client connected');
    } else {
      // Fallback to in-memory mode if Redis is not configured
      this.logger.warn(
        '⚠️  Redis URL not configured, using in-memory storage (not recommended for production)',
      );
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  async setRoom(roomId: string, room: Room): Promise<void> {
    if (!this.client) return;

    try {
      const key = `${this.ROOM_PREFIX}${roomId}`;
      await this.client.set(key, JSON.stringify(room), 'EX', 3600); // 1 hour TTL

      // Index player-to-room mappings
      for (const player of [...room.players, ...room.spectators]) {
        await this.client.set(
          `${this.PLAYER_ROOM_PREFIX}${player.id}`,
          roomId,
          'EX',
          3600,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to set room ${roomId}:`, error);
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    if (!this.client) return null;

    try {
      const key = `${this.ROOM_PREFIX}${roomId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get room ${roomId}:`, error);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    if (!this.client) return;

    try {
      const key = `${this.ROOM_PREFIX}${roomId}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete room ${roomId}:`, error);
    }
  }

  async getRoomByPlayerId(playerId: string): Promise<string | null> {
    if (!this.client) return null;

    try {
      const roomId = await this.client.get(
        `${this.PLAYER_ROOM_PREFIX}${playerId}`,
      );
      return roomId;
    } catch (error) {
      this.logger.error(`Failed to get room for player ${playerId}:`, error);
      return null;
    }
  }

  async getAllRooms(): Promise<Room[]> {
    if (!this.client) return [];

    try {
      const keys = await this.client.keys(`${this.ROOM_PREFIX}*`);
      const rooms: Room[] = [];

      for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
          rooms.push(JSON.parse(data));
        }
      }

      return rooms;
    } catch (error) {
      this.logger.error('Failed to get all rooms:', error);
      return [];
    }
  }

  async cleanupInactiveRooms(timeout: number): Promise<number> {
    if (!this.client) return 0;

    try {
      const rooms = await this.getAllRooms();
      const now = Date.now();
      let cleaned = 0;

      for (const room of rooms) {
        if (now - room.lastActivity > timeout) {
          await this.deleteRoom(room.id);
          cleaned++;
          this.logger.log(`Cleaned up inactive room: ${room.id}`);
        }
      }

      return cleaned;
    } catch (error) {
      this.logger.error('Failed to cleanup inactive rooms:', error);
      return 0;
    }
  }
}
