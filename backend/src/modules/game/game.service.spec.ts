import { Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailyChallengeEntity } from '../../database/entities/daily-challenge';
import { GameSessionEntity } from '../../database/entities/gameSession.entity';
import { GuessEntity } from '../../database/entities/guess.entity';
import { MovieEntity } from '../../database/entities/movie.entity';
import { MusicTrackEntity } from '../../database/entities/musicTrack.entity';
import { TmdbService } from '../tmdb/tmdb.service';
import { GameService } from './game.service';

describe('GameService.getDailyResult', () => {
  let service: GameService;
  const dailyRepo = { findOne: jest.fn() };
  const tmdb = { getMovieDetails: jest.fn() };
  const localMovie = {
    tmdbId: 11, title: 'Título local', releaseYear: 1978,
    director: 'Diretor local', posterUrl: '/local.jpg',
  };
  const remoteMovie = {
    tmdbId: 11, title: 'Guerra nas Estrelas', releaseYear: 1977,
    director: 'George Lucas', posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  };
  const track = { title: 'Main Title', artist: 'John Williams' };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    dailyRepo.findOne.mockResolvedValue({ musicTrack: { ...track, movie: localMovie } });
    tmdb.getMovieDetails.mockResolvedValue(remoteMovie);
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: getRepositoryToken(DailyChallengeEntity), useValue: dailyRepo },
        ...[GameSessionEntity, MusicTrackEntity, GuessEntity, MovieEntity].map(entity => ({
          provide: getRepositoryToken(entity), useValue: {},
        })),
        { provide: TmdbService, useValue: tmdb },
      ],
    }).compile();
    service = module.get(GameService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('uses TMDB metadata for the challenge movie while preserving its track', async () => {
    await expect(service.getDailyResult('challenge-id')).resolves.toEqual({ movie: remoteMovie, track });
    expect(tmdb.getMovieDetails).toHaveBeenCalledWith(11);
    expect(dailyRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'challenge-id' }, relations: { musicTrack: { movie: true } },
    });
  });

  it('keeps the result available when TMDB fails', async () => {
    tmdb.getMovieDetails.mockRejectedValue(new ServiceUnavailableException());
    await expect(service.getDailyResult('challenge-id')).resolves.toEqual({ movie: localMovie, track });
  });

  it('fills missing TMDB metadata with local values', async () => {
    tmdb.getMovieDetails.mockResolvedValue({
      ...remoteMovie, releaseYear: null, director: null, posterUrl: null,
    });
    await expect(service.getDailyResult('challenge-id')).resolves.toEqual({
      movie: { ...localMovie, title: remoteMovie.title }, track,
    });
  });

  it.each([null, 0, -1])('skips TMDB when the stored ID is %s', async tmdbId => {
    const movie = { ...localMovie, tmdbId };
    dailyRepo.findOne.mockResolvedValue({ musicTrack: { ...track, movie } });
    await expect(service.getDailyResult('challenge-id')).resolves.toEqual({ movie, track });
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
  });

  it('rejects an unknown challenge without querying TMDB', async () => {
    dailyRepo.findOne.mockResolvedValue(null);
    await expect(service.getDailyResult('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
  });
});
