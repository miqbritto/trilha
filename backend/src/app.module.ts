import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './database/db.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './modules/game/game.module';
import { MovieModule } from './modules/movie/movie.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { StorageModule } from './modules/storage/storage.module';
import { MusicModule } from './modules/music/music.module';

@Module({
  imports: [
    DbModule,
    GameModule,
    MovieModule,
    TmdbModule,
    MusicModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
