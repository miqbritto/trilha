import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AdminAuthModule } from './admin-auth.module';
import { GameController } from '../game/game.controller';
import { GameService } from '../game/game.service';
import { MusicController } from '../music/music.controller';
import { MusicService } from '../music/music.service';

describe('Administrative API authentication', () => {
  let app: INestApplication;
  const key = 'test-only-admin-key-not-a-production-secret';
  let configuredKey: string | undefined;
  const challengeId = '00000000-0000-4000-8000-000000000001';
  const game = {
    createDailyChallenge: jest.fn().mockResolvedValue({ id: challengeId }),
    getDailyChallenge: jest.fn().mockResolvedValue({ id: challengeId }),
    getFreeChallenge: jest.fn().mockResolvedValue({ mode: 'free' }),
    checkGuess: jest.fn().mockResolvedValue({ correct: false }),
    getDailyResult: jest.fn().mockResolvedValue({ movie: {}, track: {} }),
  };
  const music = {
    create: jest.fn().mockResolvedValue({ id: 'track-id' }),
    getAllTracks: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AdminAuthModule],
      controllers: [GameController, MusicController],
      providers: [
        { provide: ConfigService, useValue: { get: () => configuredKey } },
        { provide: GameService, useValue: game },
        { provide: MusicService, useValue: music },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => configuredKey })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  beforeEach(() => {
    configuredKey = key;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('protects the track catalog with the admin key', async () => {
    await request(app.getHttpServer()).get('/music/all').expect(401);
    expect(music.getAllTracks).not.toHaveBeenCalled();
    await request(app.getHttpServer()).get('/music/all').set('X-Admin-Key', key).expect(200);
    expect(music.getAllTracks).toHaveBeenCalledTimes(1);
  });

  describe.each(['/games/daily', '/music'])('POST %s', (path) => {
    it.each([undefined, '', 'wrong', `${key}extra`, key.toUpperCase()])(
      'rejects missing or incorrect credentials (%#) before processing input',
      async (provided) => {
        const call = request(app.getHttpServer()).post(path);
        if (provided !== undefined) call.set('X-Admin-Key', provided);
        const response = await call.send({}).expect(401);
        expect(response.body.message).toBe('Acesso administrativo não autorizado.');
        expect(JSON.stringify(response.body)).not.toContain(key);
        expect(game.createDailyChallenge).not.toHaveBeenCalled();
        expect(music.create).not.toHaveBeenCalled();
      },
    );

    it.each([undefined, '', '   '])(
      'fails closed when server configuration is missing or blank (%#)',
      async (value) => {
        configuredKey = value;
        await request(app.getHttpServer())
          .post(path)
          .set('X-Admin-Key', key)
          .send({})
          .expect(401);
        expect(game.createDailyChallenge).not.toHaveBeenCalled();
        expect(music.create).not.toHaveBeenCalled();
      },
    );

    it('does not accept a key supplied in the URL or body', async () => {
      await request(app.getHttpServer())
        .post(path)
        .query({ 'X-Admin-Key': key })
        .send({ 'X-Admin-Key': key })
        .expect(401);
    });

    it('rejects repeated key headers', async () => {
      await request(app.getHttpServer())
        .post(path)
        .set({ 'x-admin-key': [key, key] })
        .send({})
        .expect(401);
    });
  });

  it('allows challenge creation with the correct key', async () => {
    await request(app.getHttpServer())
      .post('/games/daily')
      .set('X-Admin-Key', key)
      .send({ musicTrackId: challengeId, date: '2026-09-21' })
      .expect(201, { id: challengeId });
    expect(game.createDailyChallenge).toHaveBeenCalledWith(challengeId, '2026-09-21');
  });

  it('still validates challenge input after authentication', async () => {
    await request(app.getHttpServer())
      .post('/games/daily')
      .set('X-Admin-Key', key)
      .send({ musicTrackId: 'invalid', date: 'invalid' })
      .expect(400);
    expect(game.createDailyChallenge).not.toHaveBeenCalled();
  });

  it('reaches upload validation with the correct key', async () => {
    await request(app.getHttpServer())
      .post('/music')
      .set('X-Admin-Key', key)
      .send({ movieId: challengeId, title: 'Trilha de teste' })
      .expect(400);
    expect(music.create).not.toHaveBeenCalled();
  });

  it('rejects unauthorized multipart uploads before file validation', async () => {
    await request(app.getHttpServer())
      .post('/music')
      .field('movieId', challengeId)
      .field('title', 'Trilha de teste')
      .attach('file', Buffer.from('not audio'), 'invalid.txt')
      .expect(401);
    expect(music.create).not.toHaveBeenCalled();
  });

  it('keeps player endpoints public even without administrative configuration', async () => {
    configuredKey = undefined;
    for (const path of ['/games/daily', '/games/free', `/games/daily/${challengeId}/result`]) {
      await request(app.getHttpServer()).get(path).expect(200);
    }
    await request(app.getHttpServer())
      .post('/games/guesses')
      .send({ challengeId, tmdbId: 11 })
      .expect(201, { correct: false });
  });
});
