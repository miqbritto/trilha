import { IsUUID } from 'class-validator';

export class CreateGuessDto {
    @IsUUID()
    movieId!: string;
}