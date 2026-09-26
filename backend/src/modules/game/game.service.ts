import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { REVEAL_STAGES } from './constants/reveal-stages.constant';
import { DailyChallengeEntity } from 'src/database/entities/daily-challenge';
import { getGameDate } from './utils/game-date';
import { ChallengeHistoryResponse, DailyChallengeResponse, FreeChallengeResponse, StudioChallengeResponse } from './dto/challenge-response.dto';
import { TmdbService } from '../tmdb/tmdb.service';
import { StorageService } from '../storage/storage.service';


@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    constructor(
         @InjectRepository(MusicTrackEntity)
         private readonly musicTrackRepo: Repository<MusicTrackEntity>,
         @InjectRepository(DailyChallengeEntity)
         private readonly dailyChallengeRepo: Repository<DailyChallengeEntity>,
         private readonly tmdbService: TmdbService,
         private readonly storageService: StorageService,
        
    ) {}

    async createDailyChallenge(
        musicTrackId: string,
        date: string
    ) {
        const musicTrack = await this.musicTrackRepo.findOne({
            where: { id: musicTrackId },
        });

        if(!musicTrack) {
            throw new NotFoundException("Trilha não encontrada");
        }

        return this.dailyChallengeRepo.manager.transaction(async (manager) => {
            // Serialize numbering and date checks across concurrent studio requests.
            await manager.query('LOCK TABLE "daily_challenges" IN SHARE ROW EXCLUSIVE MODE');
            const challenges = manager.getRepository(DailyChallengeEntity);
            const existingChallenge = await challenges.findOne({ where: { date } });
            if (existingChallenge) {
                throw new ConflictException('Já existe um desafio para essa data');
            }
            const lastChallenge = await challenges.findOne({
                where: {}, order: { number: 'DESC' },
            });
            const challenge = challenges.create({
                date, musicTrackId, number: (lastChallenge?.number ?? 0) + 1,
            });
            return challenges.save(challenge);
        });
    }

    async findDailyChallenge(): Promise<DailyChallengeEntity> {
        const date = getGameDate();

        const todayChallenge = await this.dailyChallengeRepo.findOne({
            where: { date },
            relations: { musicTrack: true}
        })

        if(!todayChallenge) {
            throw new NotFoundException("Nenhum desafio disponível");
        }

        return todayChallenge;
    }

    async getChallengeHistory(): Promise<ChallengeHistoryResponse[]> {
        const challenges = await this.dailyChallengeRepo.find({
            where: { date:  LessThanOrEqual(getGameDate())},
            order: { date: 'DESC' }
        })

        if(!challenges) {
            return [];
        }

        return challenges.map(challenge => ({
            id: challenge.id,
            number: challenge.number,
            date: challenge.date,
        }))
    }

    async getStudioChallenges(): Promise<StudioChallengeResponse[]> {
        const challenges = await this.dailyChallengeRepo.find({
            relations: {
            musicTrack: {
                movie: true,
            },
            },
            order: { date: 'ASC' },
        });

        return challenges.map((challenge) => ({
            id: challenge.id,
            number: challenge.number,
            date: challenge.date,
            track: {
            id: challenge.musicTrack.id,
            title: challenge.musicTrack.title,
            artist: challenge.musicTrack.artist,
            movie: challenge.musicTrack.movie.title,
            },
        }));
    }

    async getChallenge(challengeId: string): Promise<DailyChallengeResponse> {
        const challenge = await this.dailyChallengeRepo.findOne({
            where: { id: challengeId},
            relations: { musicTrack: true }
        })

        if (!challenge) {
            throw new NotFoundException("Desafio não encontrado");
        }
        
        const audioUrl = challenge.musicTrack?.externalId?.trim()
            ? `/games/daily/${challenge.id}/audio` : undefined;

        if(!audioUrl) {
            throw new NotFoundException("Audio indisponível para o desafio de hoje")
        }

        return {
            id: challenge.id,
            mode: "daily",
            number: challenge.number,
            date: challenge.date,
            rules: {
                revealStages: [...REVEAL_STAGES]
            },
            audioUrl
        }
    }

    async getDailyChallenge(): Promise<DailyChallengeResponse> {
        const challenge = await this.findDailyChallenge();

        const audioUrl = challenge.musicTrack?.externalId?.trim()
            ? `/games/daily/${challenge.id}/audio` : undefined;

        if(!audioUrl) {
            throw new NotFoundException("Audio indisponível para o desafio de hoje")
        }

        return {
            id: challenge.id,
            mode: "daily",
            number: challenge.number,
            date: challenge.date,
            rules: {
                revealStages: [...REVEAL_STAGES]
            },
            audioUrl
        }
    }

    async getChallengeAudio(challengeId: string, range?: string) {
        const challenge = await this.dailyChallengeRepo.findOne({
            where: { id: challengeId }, relations: { musicTrack: true },
        });
        const key = challenge?.musicTrack?.externalId;
        if (!key) throw new NotFoundException('Áudio não encontrado.');
        return this.storageService.getAudio(key, range);
    }

    async getFreeChallenge(): Promise<FreeChallengeResponse> {
        const musicTrack = await this.musicTrackRepo
            .createQueryBuilder("musicTrack")
            .select(["musicTrack.id"])
            .where("musicTrack.previewUrl IS NOT NULL")
            .andWhere("TRIM(musicTrack.previewUrl) <> ''")
            .orderBy("RANDOM()")
            .getOne();

        if(!musicTrack) {
            throw new NotFoundException("Nenhuma trilha disponível para jogar")
        }

        return {
            id: musicTrack.id,
            mode: "free",
            rules: {
                revealStages: [...REVEAL_STAGES]
            }
        }
    }

    async checkGuess(challengeId: string, tmdbId: number) {
        const challenge = await this.dailyChallengeRepo.findOne({
            where: { id: challengeId },
            relations: { 
                musicTrack: {
                    movie: true
                }
            }
        })

        if (!challenge) {
            throw new NotFoundException("Desafio não encontrado")
        }

        const correctMovie = challenge.musicTrack.movie;
        const isCorrect = correctMovie.tmdbId === tmdbId

        return {
            correct: isCorrect
        }
    }

    async getDailyResult(challengeId: string) {
        const daily = await this.dailyChallengeRepo.findOne({
            where: { id: challengeId },
            relations: {
                musicTrack: {
                    movie: true
                }
            }
        })

        if(!daily) {
            throw new NotFoundException("Desafio não encontrado");
        }

        const { musicTrack } = daily;
        const { movie } = musicTrack;

        let tmdbMovie: Awaited<ReturnType<TmdbService['getMovieDetails']>> | null = null;
        if (Number.isSafeInteger(movie.tmdbId) && movie.tmdbId > 0) {
            try {
                tmdbMovie = await this.tmdbService.getMovieDetails(movie.tmdbId);
            } catch (error) {
                if (!(error instanceof ServiceUnavailableException)) {
                    throw error;
                }
                this.logger.warn(`TMDB indisponível para o filme ${movie.tmdbId}; resultado sem metadados adicionais.`);
            }
        }

        return {
            movie: {
                tmdbId: movie.tmdbId,
                title: tmdbMovie?.title || movie.title,
                releaseYear: tmdbMovie?.releaseYear ?? null,
                director: tmdbMovie?.director ?? null,
                posterUrl: tmdbMovie?.posterUrl ?? null,
                quote: movie.quote
            },
            track: {
                title: musicTrack.title,
                artist: musicTrack.artist,
                note: musicTrack.note
            },
        }
    }

    

}
