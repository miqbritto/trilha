require('reflect-metadata');
require('dotenv').config();

const { readFile } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { ConfigService } = require('@nestjs/config');
const {
  StorageService,
} = require('./dist/modules/storage/storage.service');

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error('Informe o caminho de um arquivo WAV.');
  }

  const body = await readFile(filePath);
  const storage = new StorageService(new ConfigService());

  const result = await storage.upload(
    `audios/testes/${randomUUID()}.wav`,
    body,
    'audio/wav',
  );

  console.log('Upload concluído!');
  console.log('Chave:', result.key);
  console.log('URL:', result.url);
}

main().catch((error) => {
  console.error('Falha no upload:', error.name, error.message);
  process.exitCode = 1;
});