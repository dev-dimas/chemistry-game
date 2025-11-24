import { IsString, IsNotEmpty } from 'class-validator';

export class KickPlayerDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Target player ID is required' })
  targetId: string;
}
