import { IsString, IsNotEmpty } from 'class-validator';

export class RoomActionDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;
}
