import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @Length(1, 50, { message: 'Answer must be between 1 and 50 characters' })
  answer: string;
}
