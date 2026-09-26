import { Body, Controller, FileTypeValidator, Get, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin-auth/admin-api-key.guard';
import { MusicService } from './music.service';
import { CreateMusicDto } from './dto/create-music.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type {} from 'multer'

const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MiB


@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {
  }

  @Post()
  @UseGuards(AdminApiKeyGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_AUDIO_SIZE,
        files: 1
      }
    })
  )
  async create(
    @Body() dto: CreateMusicDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({
            fileType: /^audio\/(mpeg|wav|x-wav|wave|vnd\.wave)$/,
            overrideMimeType: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
      return await this.musicService.create(dto, file)
  }

  @Get("all")
  @UseGuards(AdminApiKeyGuard)
  getAllTracks() {
    return this.musicService.getAllTracks()
  }
}
