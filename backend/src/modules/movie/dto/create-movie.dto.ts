import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateMovieDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  tmdbId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  quote?: string;
}
