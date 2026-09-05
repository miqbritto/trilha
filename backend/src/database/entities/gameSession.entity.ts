import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Entity, OneToMany } from "typeorm";
import { MusicTrackEntity } from "./musicTrack.entity";
import { GuessEntity } from "./guess.entity";

@Entity('game_sessions')
export class GameSessionsEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    status!: string;

    @Column()
    score!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @CreateDateColumn({ name: 'finished_at' })
    finishedAt!: Date;

    @Column({ name: 'music_track_id' })
    musicTrackId!: string;

    @ManyToOne(() => MusicTrackEntity, (musicTrack) => musicTrack.games)
    @JoinColumn({ name: 'music_track_id' })
    musicTrack!: MusicTrackEntity;

    @OneToMany(() => GuessEntity, (guess) => guess.session)
    guesses!: GuessEntity[];
}