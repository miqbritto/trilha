import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicTrackEntity } from '../../database/entities/musicTrack.entity';
import { MovieEntity } from '../../database/entities/movie.entity';
import { StorageModule } from '../storage/storage.module';




@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([MusicTrackEntity, MovieEntity])],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService]
})
export class MusicModule {}
