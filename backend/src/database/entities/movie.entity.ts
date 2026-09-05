import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity('movies')
export class Movie {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    title!: string;

    @Column()
    releaseYear!: number;

    @Column({ nullable: true })
    posterUrl!: string;
}