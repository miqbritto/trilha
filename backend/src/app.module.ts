import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './database/db.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './modules/game/game.module';
import { MovieModule } from './modules/movie/movie.module';

@Module({
  imports: [
    DbModule,
    GameModule,
    MovieModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
