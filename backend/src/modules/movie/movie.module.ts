import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity]), TmdbModule],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
