import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MovieEntity } from './entities/movie.entity';
import { MusicTrackEntity } from './entities/musicTrack.entity';

import { DailyChallengeEntity } from './entities/daily-challenge';
import { getDatabaseOptions } from './database-options';

config();

const configService = new ConfigService();

const dataSourceOptions: DataSourceOptions = {
  ...getDatabaseOptions(configService),
  entities: [MovieEntity, MusicTrackEntity, DailyChallengeEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
};

export default new DataSource(dataSourceOptions);
