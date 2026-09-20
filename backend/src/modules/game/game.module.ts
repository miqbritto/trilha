import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallengeEntity } from 'src/database/entities/daily-challenge';
import { TmdbModule } from '../tmdb/tmdb.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TmdbModule,
    StorageModule,
    TypeOrmModule.forFeature([
      MusicTrackEntity,
      MovieEntity,
      DailyChallengeEntity,
    ]),
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
