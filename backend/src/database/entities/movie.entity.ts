import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MusicTrackEntity } from './musicTrack.entity';
import { GuessEntity } from './guess.entity';


@Entity('movies')
export class MovieEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: "tmdb_id", nullable: true })
    tmdbId!: number;

    @Column({ unique: true })
    title!: string;

    @Column({ name: 'release_year' })
    releaseYear!: number;

    @Column({ nullable: true })
    director!: string;

    @Column({ nullable: true, name: 'poster_url' })
    posterUrl!: string;

    @OneToMany(() => MusicTrackEntity, (musicTrack) => musicTrack.movie)
    musicTracks!: MusicTrackEntity[];

    @OneToMany(() => GuessEntity, (guess) => guess.guessedMovie)
    guesses!: GuessEntity[];
}