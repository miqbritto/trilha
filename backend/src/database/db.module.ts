import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseOptions } from './database-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        ...getDatabaseOptions(configService),
        autoLoadEntities: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DbModule {}
