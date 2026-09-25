import { INestApplication, ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { MovieEntity } from '../../database/entities/movie.entity';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { TmdbService } from '../tmdb/tmdb.service';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

describe('Movie registration', () => {
  let app: INestApplication;
  const key = 'test-admin-key';
  const saved = { id: 'movie-id', tmdbId: 157336, title: 'Interestelar', quote: '' };
  const repo = { findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() };
  const tmdb = { getMovieDetails: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AdminAuthModule],
      controllers: [MovieController],
      providers: [MovieService,
        { provide: ConfigService, useValue: { get: () => key } },
        { provide: getRepositoryToken(MovieEntity), useValue: repo },
        { provide: TmdbService, useValue: tmdb }],
    }).overrideProvider(ConfigService).useValue({ get: () => key }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation(value => value);
    repo.save.mockImplementation(async value => ({ id: saved.id, ...value }));
    tmdb.getMovieDetails.mockResolvedValue({ tmdbId: saved.tmdbId, title: saved.title });
  });

  afterAll(async () => { await app?.close(); });

  it('requires the admin key before accessing TMDB or the database', async () => {
    await request(app.getHttpServer()).post('/movies').send({ tmdbId: saved.tmdbId }).expect(401);
    expect(repo.findOneBy).not.toHaveBeenCalled();
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, '157336', null, 2147483648])('rejects invalid IDs: %s', async tmdbId => {
    await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId }).expect(400);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('uses the TMDB title and stores an empty optional quote', async () => {
    const response = await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId: saved.tmdbId, title: 'Untrusted title' }).expect(201);
    expect(response.body).toEqual(saved);
    expect(tmdb.getMovieDetails).toHaveBeenCalledWith(saved.tmdbId);
  });

  it('trims the administrator quote', async () => {
    const response = await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId: saved.tmdbId, quote: '  Uma frase  ' }).expect(201);
    expect(response.body.quote).toBe('Uma frase');
  });

  it('returns existing movies without overwriting their quote', async () => {
    repo.findOneBy.mockResolvedValue({ ...saved, quote: 'Original' });
    const response = await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId: saved.tmdbId, quote: 'Changed' }).expect(201);
    expect(response.body.quote).toBe('Original');
    expect(repo.save).not.toHaveBeenCalled();
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
  });

  it('returns the existing record after a concurrent insert conflict', async () => {
    repo.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(saved);
    repo.save.mockRejectedValue({ driverError: { code: '23505' } });
    const response = await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId: saved.tmdbId }).expect(201);
    expect(response.body).toEqual(saved);
  });

  it('does not save a movie when TMDB fails', async () => {
    tmdb.getMovieDetails.mockRejectedValue(new ServiceUnavailableException());
    await request(app.getHttpServer()).post('/movies').set('x-admin-key', key)
      .send({ tmdbId: saved.tmdbId }).expect(503);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
