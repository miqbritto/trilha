import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MovieEntity } from './entities/movie.entity';
import { MusicTrackEntity } from './entities/musicTrack.entity';
import { GameSessionEntity } from './entities/gameSession.entity';
import { GuessEntity } from './entities/guess.entity';
import { DailyChallengeEntity } from './entities/daily-challenge';

config();

const configService = new ConfigService();

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [MovieEntity, MusicTrackEntity, GameSessionEntity, GuessEntity, DailyChallengeEntity],
    migrations: [__dirname + '/migrations/*.ts'],
    synchronize: false
}

export default new DataSource(dataSourceOptions);