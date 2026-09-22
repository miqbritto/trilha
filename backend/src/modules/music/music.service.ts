import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { CreateMusicDto } from './dto/create-music.dto';

@Injectable()
export class MusicService {
    private readonly logger = new Logger(MusicService.name);

    constructor(
        @InjectRepository(MusicTrackEntity)
        private readonly musicRepo: Repository<MusicTrackEntity>,
        @InjectRepository(MovieEntity)
        private readonly movieRepo: Repository<MovieEntity>,

        private readonly storageService: StorageService
    ) {}

    async create(
        dto: CreateMusicDto,
        file: { buffer: Buffer, mimetype: string}
    ): Promise<MusicTrackEntity> {
        const formats: Record<string, string> = {
            'audio/wav': 'wav',
            'audio/x-wav': 'wav',
            'audio/wave': 'wav',
            'audio/vnd.wave': 'wav',
            'audio/mpeg': 'mp3'
        };

        const extension = formats[file.mimetype];

        if (!extension) {
            throw new BadRequestException('Envie um áudio WAV ou MP3.');
        }

        const movie = await this.movieRepo.findOneBy({
            id: dto.movieId
        })

        if (!movie) {
            throw new NotFoundException('Filme não encontrado.');
        }

        const slugify = (name: string): string => name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const key = `audios/${slugify(movie.title)}_${slugify(dto.title)}.${extension}`
        const contentType =
            extension === 'wav' ? 'audio/wav' : 'audio/mpeg'

        const uploaded = await this.storageService.upload(
            key, 
            file.buffer, 
            contentType
        );

        try {
            const music = this.musicRepo.create({
                title: dto.title.trim(),
                artist: dto.artist?.trim(),
                note: dto.note?.trim(),
                movieId: movie.id,
                source: "R2",
                externalId: uploaded.key,
                previewUrl: uploaded.url
            })

            return await this.musicRepo.save(music)
        } catch (error) {
            try {
                await this.storageService.delete(uploaded.key)
            } catch {
                this.logger.error(
                    `Falha ao remover arquivo após erro no cadastro: ${uploaded.key}`
                )
            }

            throw error
        }
    }
}
