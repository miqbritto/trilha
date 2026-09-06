import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { GameSessionEntity } from 'src/database/entities/gameSession.entity';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { GuessEntity } from 'src/database/entities/guess.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameSessionEntity,
      MusicTrackEntity,
      MovieEntity,
      GuessEntity,
    ]),
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
