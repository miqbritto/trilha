import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameSessionsEntity } from "./gameSession.entity";
import { MovieEntity } from "./movie.entity";


@Entity('guesses')
export class GuessEntity {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'attempt_number' })
    attemptNumber!: number;

    @Column({ name: 'revealed_seconds' })
    revealedSeconds!: number;

    @Column({ name: 'is_correct' })
    isCorrect!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ name: 'game_session_id' })
    sessionId!: string;

    @Column({ name: 'guessed_movie_id' })
    guessedMovieId!: string;

    @ManyToOne(() => MovieEntity, (movie) => movie.guesses)
    @JoinColumn({ name: 'guessed_movie_id' })
    guessedMovie!: MovieEntity;

    @ManyToOne(() => GameSessionsEntity, (session) => session.guesses)
    @JoinColumn({ name: 'game_session_id' })
    session!: GameSessionsEntity;
}