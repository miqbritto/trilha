import { PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Entity, OneToMany } from "typeorm";
import { MusicTrackEntity } from "./musicTrack.entity";
import { GuessEntity } from "./guess.entity";
import { GameSessionStatus } from "src/modules/game/enums/game-session-status.enum";

@Entity('game_sessions')
export class GameSessionsEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: GameSessionStatus
    })
    status!: GameSessionStatus;

    @Column()
    score!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', name: 'finished_at', nullable: true })
    finishedAt!: Date | null;

    @Column({ name: 'music_track_id' })
    musicTrackId!: string;

    @ManyToOne(() => MusicTrackEntity, (musicTrack) => musicTrack.games)
    @JoinColumn({ name: 'music_track_id' })
    musicTrack!: MusicTrackEntity;

    @OneToMany(() => GuessEntity, (guess) => guess.session)
    guesses!: GuessEntity[];
}