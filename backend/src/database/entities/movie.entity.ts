import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MusicTrackEntity } from './musicTrack.entity';


@Entity('movies')
export class MovieEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: "tmdb_id", unique: true })
    tmdbId!: number;

    @Column()
    title!: string;

    @Column()
    quote!: string;

    @OneToMany(() => MusicTrackEntity, (musicTrack) => musicTrack.movie)
    musicTracks!: MusicTrackEntity[];
}