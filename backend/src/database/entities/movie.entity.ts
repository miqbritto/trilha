import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MusicTrackEntity } from './musicTrack.entity';


@Entity('movies')
export class MovieEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: "tmdb_id", nullable: true })
    tmdbId!: number;

    @Column({ unique: true })
    title!: string;

    @Column({ nullable: true })
    quote!: string;

    @OneToMany(() => MusicTrackEntity, (musicTrack) => musicTrack.movie)
    musicTracks!: MusicTrackEntity[];
}