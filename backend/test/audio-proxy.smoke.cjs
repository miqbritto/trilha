// Run after npm run build: node test/audio-proxy.smoke.cjs
require('reflect-metadata');
const path = require('node:path');
require('tsconfig-paths').register({
  baseUrl: path.resolve(__dirname, '../dist'), paths: { 'src/*': ['*'] },
});
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const request = require('supertest');
const { S3ServiceException } = require('@aws-sdk/client-s3');
const { GameController } = require('../dist/modules/game/game.controller');
const { GameService } = require('../dist/modules/game/game.service');
const { MusicController } = require('../dist/modules/music/music.controller');
const { MusicService } = require('../dist/modules/music/music.service');
const { AdminAuthModule } = require('../dist/modules/admin-auth/admin-auth.module');
const { StorageService } = require('../dist/modules/storage/storage.service');
const { AudioRangeError, audioRange } = require('../dist/modules/storage/audio-range');

async function main() {
  const id = '00000000-0000-4000-8000-000000000001';
  const key = 'audios/secret-movie_secret-song.mp3';
  const config = {
    R2_BUCKET_NAME: 'test', R2_PUBLIC_URL: 'https://private.invalid',
    R2_ENDPOINT: 'https://private.invalid', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test',
  };
  const storage = new StorageService({ getOrThrow: name => config[name] });
  const commands = [];
  storage.client.send = async command => {
    commands.push(command);
    assert.equal(command.input.Key, key);
    if (command.constructor.name === 'HeadObjectCommand') return { ContentLength: 5 };
    const partial = command.input.Range;
    return { Body: Readable.from(Buffer.from(partial ? 'au' : 'audio')),
      ContentLength: partial ? 2 : 5, ContentRange: partial ? 'bytes 0-1/5' : undefined };
  };
  const challenge = { id, number: 1, date: '2026-09-26', musicTrack: { externalId: key, previewUrl: `https://private.invalid/${key}` } };
  const game = new GameService({}, { findOne: async () => challenge }, {}, storage);
  const module = await Test.createTestingModule({
    imports: [AdminAuthModule], controllers: [GameController, MusicController],
    providers: [
      { provide: ConfigService, useValue: { get: () => 'test-admin-key' } },
      { provide: GameService, useValue: game },
      { provide: MusicService, useValue: { getAllTracks: async () => [] } },
    ],
  }).overrideProvider(ConfigService).useValue({ get: () => 'test-admin-key' }).compile();
  const app = module.createNestApplication();
  await app.init();
  try {
    const api = request(app.getHttpServer());
    for (const route of ['/games/daily', `/games/daily/${id}`]) {
      const response = await api.get(route).expect(200);
      assert.equal(response.body.audioUrl, `/games/daily/${id}/audio`);
      assert(!JSON.stringify(response.body).includes('secret'));
      assert(!JSON.stringify(response.body).includes('private.invalid'));
    }
    const full = await api.get(`/games/daily/${id}/audio`).expect(200);
    assert.deepEqual(full.body, Buffer.from('audio'));
    assert.equal(full.headers['content-disposition'], 'inline; filename="audio.mp3"');
    assert.equal(full.headers.location, undefined);
    const partial = await api.get(`/games/daily/${id}/audio`).set('Range', 'bytes=0-1').expect(206);
    assert.equal(partial.headers['content-range'], 'bytes 0-1/5');
    assert.deepEqual(partial.body, Buffer.from('au'));
    const invalid = await api.get(`/games/daily/${id}/audio`).set('Range', 'bytes=5-').expect(416);
    assert.equal(invalid.headers['content-range'], 'bytes */5');
    await api.get('/games/daily/not-a-uuid/audio').expect(400);
    await api.get('/music/all').expect(401);
    await api.get('/music/all').set('x-admin-key', 'test-admin-key').expect(200);
    assert.equal(audioRange('bytes=-2', 5), 'bytes=3-4');
    assert.equal(audioRange('bytes=1-', 5), 'bytes=1-4');
    assert.throws(() => audioRange('bytes=0-1,3-4', 5), AudioRangeError);
    storage.client.send = async () => { throw new Error(`internal ${key}`); };
    const unavailable = await api.get(`/games/daily/${id}/audio`).expect(503);
    assert(!JSON.stringify(unavailable.body).includes('secret'));
    storage.client.send = async () => {
      throw new S3ServiceException({ name: 'NoSuchKey', $fault: 'client', $metadata: { httpStatusCode: 404 }, message: key });
    };
    await api.get(`/games/daily/${id}/audio`).expect(404);
    console.log('Audio proxy checks passed: URLs, streaming, ranges, safe errors and catalog authentication.');
  } finally {
    await app.close();
    storage.client.destroy();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
