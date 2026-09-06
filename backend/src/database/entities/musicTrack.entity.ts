import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { MovieEntity } from "./movie.entity";
import { GameSessionEntity } from "./gameSession.entity";

@Entity('music_tracks')
export class MusicTrackEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string; 

    @Column({ name: 'external_id' })
    externalId!: string;

    @Column({ nullable: true })
    artist!: string;

    @Column({ name: 'preview_url', nullable: true })
    previewUrl!: string;

    @Column()
    source!: string;

    @Column({ name: 'movie_id' })
    movieId!: string;

    @ManyToOne(() => MovieEntity, (movie) => movie.musicTracks)
    @JoinColumn({ name: 'movie_id' })
    movie!: MovieEntity;

    @OneToMany(() => GameSessionEntity, (gameSession) => gameSession.musicTrack)
    games!: GameSessionEntity[];



}