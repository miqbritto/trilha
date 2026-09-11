import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameSessionEntity } from 'src/database/entities/gameSession.entity';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { Repository } from 'typeorm';
import { GameSessionStatus } from './enums/game-session-status.enum';
import { GuessEntity } from 'src/database/entities/guess.entity';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { REVEAL_STAGES } from './constants/reveal-stages.constant';
import { DailyChallengeEntity } from 'src/database/entities/daily-challenge';
import { getGameDate } from './utils/game-date';
import { DailyChallengeResponse, FreeChallengeResponse } from './dto/challenge-response.dto';

@Injectable()
export class GameService {

    constructor(
         @InjectRepository(GameSessionEntity)
         private readonly gameSessionRepo: Repository<GameSessionEntity>,
         @InjectRepository(MusicTrackEntity)
         private readonly musicTrackRepo: Repository<MusicTrackEntity>,
         @InjectRepository(GuessEntity)
         private readonly guessRepo: Repository<GuessEntity>,
         @InjectRepository(MovieEntity)
         private readonly movieRepo: Repository<MovieEntity>,
         @InjectRepository(DailyChallengeEntity)
         private readonly dailyChallengeRepo: Repository<DailyChallengeEntity>
    ) {}

    async createGameSession(): Promise<GameSessionEntity> {
        const musicTrack = await this.musicTrackRepo.createQueryBuilder('musicTrack')
            .orderBy('RANDOM()')
            .getOne();

        if(!musicTrack) {
            throw new NotFoundException("Trilha não encontrada");
        }

        const gameSession = this.gameSessionRepo.create({
            musicTrackId: musicTrack?.id,
            status: GameSessionStatus.IN_PROGRESS,
            score: 0,
        });

        return this.gameSessionRepo.save(gameSession);
    }

    async createGuess(gameId: string, movieId: string): Promise<any> {
        const gameSession = await this.gameSessionRepo.findOne({
            where: { id: gameId },
            relations: {
                musicTrack: {
                    movie: true
                }
            }
        })

        if(!gameSession) {
            throw new NotFoundException("Jogo não encontrado")
        }

        if(gameSession.status !== GameSessionStatus.IN_PROGRESS) {
            throw new BadRequestException("Jogo já terminado");
        }

        const guessedMovie = await this.movieRepo.findOne({
            where: { id: movieId }
        })

        if(!guessedMovie) {
            throw new NotFoundException("Filme não encontrado")
        }

        const correctMovie = gameSession.musicTrack.movie;

        const isCorrect = guessedMovie.id === correctMovie.id;

        const attemptNumber = await this.guessRepo.count({
            where: {
                sessionId: gameSession.id
            }
        }) + 1;

        const revealedSeconds = REVEAL_STAGES[attemptNumber - 1];

        const guess = this.guessRepo.create({
            attemptNumber,
            revealedSeconds,
            isCorrect,
            sessionId: gameSession.id,
            guessedMovieId: guessedMovie.id
        });

        console.log({
            attemptNumber,
            revealedSeconds,
            isCorrect,
            sessionId: gameSession.id,
            guessedMovieId: guessedMovie.id,
        });

        const savedGuess = await this.guessRepo.save(guess);

        console.log('GUESS SALVO:', savedGuess);

        if(isCorrect) {
            gameSession.status = GameSessionStatus.WON;
            gameSession.finishedAt = new Date();
        } else if (attemptNumber >= REVEAL_STAGES.length) {
            gameSession.status = GameSessionStatus.LOST;
            gameSession.finishedAt = new Date()
        }

        await this.gameSessionRepo.save(gameSession);

        return {
            correct: isCorrect,
            attemptNumber,
            revealedSeconds,
            status: gameSession.status
        };

    }

    async findGame(gameId: string): Promise<GameSessionEntity> {
        const game = await this.gameSessionRepo.findOne({
            where: { id: gameId}
        })
        if(!game) {
            throw new NotFoundException("Jogo não encontrado")
        }

        return game;
    }

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

        const existingChallenge = await this.dailyChallengeRepo.findOne({
            where: { date }
        })

        if(existingChallenge) {
            throw new ConflictException("Já existe um desafio para essa data")
        }

        const challenge = await this.dailyChallengeRepo.create({
            date,
            musicTrackId
        })

        return this.dailyChallengeRepo.save(challenge);
    }

    async findDailyChallenge(): Promise<DailyChallengeEntity> {
        const date = getGameDate();

        const todayChallenge = await this.dailyChallengeRepo.findOne({
            where: { date }
        })

        if(!todayChallenge) {
            throw new NotFoundException("Nenhum desafio disponível");
        }

        return todayChallenge;
    }

    async getDailyChallenge(): Promise<DailyChallengeResponse> {
        const challenge = await this.findDailyChallenge();

        return {
            id: challenge.id,
            mode: "daily",
            date: challenge.date,
            rules: {
                revealStages: [...REVEAL_STAGES]
            }
        }
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

    

}
