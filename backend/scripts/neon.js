const { readFileSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parse } = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');
const [command, ...args] = process.argv.slice(2);
const migrationCommands = [
  'migration:show',
  'migration:run',
  'migration:revert',
];

if (command !== 'dev' && !migrationCommands.includes(command)) {
  console.error(
    'Use: node scripts/neon.js dev|migration:show|migration:run|migration:revert',
  );
  process.exit(1);
}

let connectionString;
try {
  const env = parse(readFileSync(path.join(backendRoot, '.env.neon.local')));
  connectionString = env.NEON_DATABASE_URL;
  const url = new URL(connectionString);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname.endsWith('.neon.tech')
  ) {
    throw new Error();
  }
} catch {
  console.error(
    'Preencha NEON_DATABASE_URL com a URL PostgreSQL do Neon em .env.neon.local.',
  );
  process.exit(1);
}

const cliArgs =
  command === 'dev'
    ? [require.resolve('@nestjs/cli/bin/nest.js'), 'start', '--watch', ...args]
    : [
        '-r',
        'ts-node/register',
        '-r',
        'tsconfig-paths/register',
        require.resolve('typeorm/cli.js'),
        command,
        '-d',
        'src/database/typeorm.migration-config.ts',
        ...args,
      ];

console.log('Banco selecionado: Neon (.env.neon.local).');
const child = spawn(process.execPath, cliArgs, {
  cwd: backendRoot,
  env: { ...process.env, DATABASE_URL: connectionString },
  stdio: 'inherit',
  windowsHide: true,
});
child.on('error', (error) => {
  console.error('Não foi possível iniciar o comando:', error.code);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
