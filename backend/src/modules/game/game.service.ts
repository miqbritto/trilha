import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameSessionsEntity } from 'src/database/entities/gameSession.entity';
import { MusicTrackEntity } from 'src/database/entities/musicTrack.entity';
import { Repository } from 'typeorm';
import { GameSessionStatus } from './enums/game-session-status.enum';
import { GuessEntity } from 'src/database/entities/guess.entity';
import { MovieEntity } from 'src/database/entities/movie.entity';
import { REVEAL_STAGES } from './constants/reveal-stages.constant';

@Injectable()
export class GameService {

    constructor(
         @InjectRepository(GameSessionsEntity)
         private gameSessionsRepository: Repository<GameSessionsEntity>,
         @InjectRepository(MusicTrackEntity)
         private musicTrackRepository: Repository<MusicTrackEntity>,
         @InjectRepository(GuessEntity)
         private guessRepository: Repository<GuessEntity>,
         @InjectRepository(MovieEntity)
         private movieRepository: Repository<MovieEntity>
    ) {}

    async createGameSession(): Promise<GameSessionsEntity> {
        const musicTrack = await this.musicTrackRepository.createQueryBuilder('musicTrack')
            .orderBy('RANDOM()')
            .getOne();

        const gameSession = this.gameSessionsRepository.create({
            musicTrackId: musicTrack?.id,
            status: GameSessionStatus.IN_PROGRESS,
            score: 0,
        });

        return this.gameSessionsRepository.save(gameSession);
    }

    async createGuess(gameId: string, movieId: string) {
        const gameSession = await this.gameSessionsRepository.findOne({
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

        const guessedMovie = await this.movieRepository.findOne({
            where: { id: movieId }
        })

        if(!guessedMovie) {
            throw new NotFoundException("Filme não encontrado")
        }

        const correctMovie = gameSession.musicTrack.movie;

        const isCorrect = guessedMovie.id === correctMovie.id;

        const attemptNumber = gameSession.guesses.length + 1;

        const revealedSeconds = REVEAL_STAGES[attemptNumber - 1];

        const guess = await this.guessRepository.create({
            attemptNumber,
            revealedSeconds,
            guessedMovie,
            isCorrect,
            sessionId: gameSession.id,
            guessedMovieId: guessedMovie.id
        });

        await this.guessRepository.save(guess);

        if(isCorrect) {
            gameSession.status = GameSessionStatus.WON;
            gameSession.finishedAt = new Date();
        } else if (attemptNumber >= REVEAL_STAGES.length) {
            gameSession.status = GameSessionStatus.LOST;
            gameSession.finishedAt = new Date()
        }

        await this.gameSessionsRepository.save(gameSession);

        return {
            correct: isCorrect,
            attemptNumber,
            revealedSeconds,
            status: gameSession.status
        };

    }

    

}
