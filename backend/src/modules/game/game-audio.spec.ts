import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import request from 'supertest';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AudioRangeError } from '../storage/audio-range';

describe('Challenge audio HTTP response', () => {
  let app: INestApplication;
  const game = { getChallengeAudio: jest.fn() };
  const id = '00000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AdminAuthModule], controllers: [GameController],
      providers: [
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: GameService, useValue: game },
      ],
    }).overrideProvider(ConfigService).useValue({ get: () => undefined }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => jest.resetAllMocks());
  afterAll(async () => { await app.close(); });

  it('streams bytes with a neutral filename without a redirect or admin key', async () => {
    game.getChallengeAudio.mockResolvedValue({ stream: Readable.from(Buffer.from('audio')), type: 'audio/mpeg', length: 5 });
    const response = await request(app.getHttpServer()).get(`/games/daily/${id}/audio`).expect(200);
    expect(response.headers['content-disposition']).toBe('inline; filename="audio.mp3"');
    expect(response.headers['content-length']).toBe('5');
    expect(response.headers.location).toBeUndefined();
    expect(response.body).toEqual(Buffer.from('audio'));
  });
  it('returns 206 and content range for partial playback', async () => {
    game.getChallengeAudio.mockResolvedValue({ stream: Readable.from(Buffer.from('au')), type: 'audio/wav', length: 2, contentRange: 'bytes 0-1/5' });
    const response = await request(app.getHttpServer()).get(`/games/daily/${id}/audio`).set('Range', 'bytes=0-1').expect(206);
    expect(game.getChallengeAudio).toHaveBeenCalledWith(id, 'bytes=0-1');
    expect(response.headers['content-range']).toBe('bytes 0-1/5');
    expect(response.headers['content-disposition']).toBe('inline; filename="audio.wav"');
  });
  it('includes object size when the interval cannot be satisfied', async () => {
    game.getChallengeAudio.mockRejectedValue(new AudioRangeError(5));
    const response = await request(app.getHttpServer()).get(`/games/daily/${id}/audio`).set('Range', 'bytes=10-').expect(416);
    expect(response.headers['content-range']).toBe('bytes */5');
  });
  it('returns 404 for a missing challenge', async () => {
    game.getChallengeAudio.mockRejectedValue(new NotFoundException('Áudio não encontrado.'));
    await request(app.getHttpServer()).get(`/games/daily/${id}/audio`).expect(404);
  });
});
