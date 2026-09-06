import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameSessionEntity } from 'src/database/entities/gameSession.entity';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { Repository } from 'typeorm';
import { GameSessionStatus } from './enums/game-session-status.enum';
import { GuessEntity } from 'src/database/entities/guess.entity';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { REVEAL_STAGES } from './constants/reveal-stages.constant';

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
         private readonly movieRepo: Repository<MovieEntity>
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

    

}
