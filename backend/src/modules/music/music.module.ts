import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicTrackEntity } from '../../database/entities/musicTrack.entity';
import { MovieEntity } from '../../database/entities/movie.entity';
import { StorageModule } from '../storage/storage.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';




@Module({
  imports: [
    AdminAuthModule,
    StorageModule,
    TypeOrmModule.forFeature([MusicTrackEntity, MovieEntity])],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService]
})
export class MusicModule {}
