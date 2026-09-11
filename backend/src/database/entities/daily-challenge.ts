import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MusicTrackEntity } from './musicTrack.entity';

@Entity('daily_challenges')
export class DailyChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date', unique: true })
  date!: string;

  @Column({ name: 'music_track_id', type: 'uuid' })
  musicTrackId!: string;

  @ManyToOne(() => MusicTrackEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'music_track_id' })
  musicTrack!: MusicTrackEntity;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}