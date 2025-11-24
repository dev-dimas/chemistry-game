import { IsString, IsNotEmpty } from 'class-validator';

export class ReconnectDto {
  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;
}
