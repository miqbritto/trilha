import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMusicDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsUUID()
  movieId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  artist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}