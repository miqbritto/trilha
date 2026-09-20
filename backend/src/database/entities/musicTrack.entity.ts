import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { MovieEntity } from "./movie.entity";


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

    @Column({ nullable: true })
    note!: string;

    @Column({ name: 'movie_id' })
    movieId!: string;

    @ManyToOne(() => MovieEntity, (movie) => movie.musicTracks)
    @JoinColumn({ name: 'movie_id' })
    movie!: MovieEntity;

}