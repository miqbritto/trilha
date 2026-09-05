const { spawnSync } = require('node:child_process');
const path = require('node:path');

const migrationName = process.argv.slice(2).join(' ');

if (!migrationName) {
  console.error('Informe o nome da migration. Exemplo: npm run migration:generate -- CreateMovieTable');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    '-r',
    'ts-node/register',
    '-r',
    'tsconfig-paths/register',
    require.resolve('typeorm/cli.js'),
    'migration:generate',
    '-d',
    'src/database/typeorm.migration-config.ts',
    path.join('src/database/migrations', migrationName),
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);