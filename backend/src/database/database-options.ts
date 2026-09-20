import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export function getDatabaseOptions(
  config: ConfigService,
): Extract<DataSourceOptions, { type: 'postgres' }> {
  const connectionString = config.get<string>('DATABASE_URL');
  const base = {
    type: 'postgres' as const,
    synchronize: false,
    migrationsRun: false,
  };

  if (connectionString !== undefined) {
    let url: URL;
    try {
      url = new URL(connectionString);
      if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname
      ) {
        throw new Error();
      }
    } catch {
      throw new Error('DATABASE_URL deve conter uma URL PostgreSQL válida.');
    }

    // O pg substitui o objeto ssl quando estes parâmetros aparecem na URL.
    for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
      url.searchParams.delete(key);
    }

    return {
      ...base,
      url: url.toString(),
      ssl: { rejectUnauthorized: true },
      connectTimeoutMS: 15000,
    };
  }

  return {
    ...base,
    host: config.get<string>('DB_HOST'),
    port: Number(config.get<string>('DB_PORT') ?? 5432),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
  };
}
