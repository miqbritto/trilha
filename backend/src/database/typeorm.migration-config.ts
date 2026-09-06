import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MovieEntity } from './entities/movie.entity';
import { MusicTrackEntity } from './entities/musicTrack.entity';
import { GameSessionsEntity } from './entities/gameSession.entity';
import { GuessEntity } from './entities/guess.entity';

config();

const configService = new ConfigService();

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [MovieEntity, MusicTrackEntity, GameSessionsEntity, GuessEntity],
    migrations: [__dirname + '/migrations/*.ts'],
    synchronize: false
}

export default new DataSource(dataSourceOptions);