import { ConfigService } from '@nestjs/config';
import { getDatabaseOptions } from './database-options';

function options(values: Record<string, string>) {
  const config = { get: (key: string) => values[key] } as ConfigService;
  return getDatabaseOptions(config);
}

describe('database connection selection', () => {
  it('keeps the local connection when DATABASE_URL is absent', () => {
    expect(
      options({ DB_HOST: 'localhost', DB_PORT: '5433', DB_NAME: 'game' }),
    ).toMatchObject({
      host: 'localhost',
      port: 5433,
      database: 'game',
      synchronize: false,
      migrationsRun: false,
    });
    expect(options({})).not.toHaveProperty('url');
    expect(options({})).not.toHaveProperty('ssl');
  });

  it('prioritizes DATABASE_URL and prevents URL parameters from disabling TLS validation', () => {
    const result = options({
      DB_HOST: 'localhost',
      DATABASE_URL:
        'postgresql://user:p%40ss@example.neon.tech/game?sslmode=disable&sslrootcert=invalid&sslcert=invalid&sslkey=invalid&application_name=game',
    });
    const url = new URL(result.url!);
    expect(url.hostname).toBe('example.neon.tech');
    expect(url.password).toBe('p%40ss');
    expect([...url.searchParams.keys()]).toEqual(['application_name']);
    expect(result.ssl).toEqual({ rejectUnauthorized: true });
    expect(result).not.toHaveProperty('host');
    expect(result.synchronize).toBe(false);
    expect(result.migrationsRun).toBe(false);
  });

  it.each(['', 'invalid-secret', 'https://user:secret@example.com'])(
    'rejects an invalid URL without exposing credentials or falling back to local (%#)',
    (url) => {
      expect(() =>
        options({ DATABASE_URL: url, DB_HOST: 'localhost' }),
      ).toThrow('DATABASE_URL deve conter uma URL PostgreSQL válida.');
    },
  );
});
