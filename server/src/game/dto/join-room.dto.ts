import { IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(4, 4, { message: 'Room ID must be exactly 4 characters' })
  roomId: string;

  @IsString()
  @Length(1, 12, { message: 'Player name must be between 1 and 12 characters' })
  playerName: string;

  @IsString()
  playerId?: string;
}
