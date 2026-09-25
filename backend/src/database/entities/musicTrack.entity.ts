import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { MovieEntity } from "./movie.entity";


@Entity('music_tracks')
// Expression index managed by migration; preserve it during schema comparisons.
@Index('uq_music_track_movie_title_artist', { synchronize: false })
export class MusicTrackEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string; 

    @Column({ name: 'external_id', unique: true })
    externalId!: string;

    @Column()
    artist!: string;

    @Column({ name: 'preview_url', unique: true })
    previewUrl!: string;

    @Column({ nullable: true })
    source!: string;

    @Column()
    note!: string;

    @Column({ name: 'movie_id' })
    movieId!: string;

    @ManyToOne(() => MovieEntity, (movie) => movie.musicTracks)
    @JoinColumn({ name: 'movie_id' })
    movie!: MovieEntity;

}
