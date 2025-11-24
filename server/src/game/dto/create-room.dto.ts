import { IsString, IsIn, IsOptional, Length } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(1, 12, { message: 'Player name must be between 1 and 12 characters' })
  playerName: string;

  @IsIn(['en', 'id'], { message: 'Language must be either "en" or "id"' })
  language: 'en' | 'id';

  @IsOptional()
  @IsString()
  playerId?: string;
}
