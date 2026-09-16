import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { TmdbService } from './tmdb.service';

describe('TmdbService.getMovieDetails', () => {
  let service: TmdbService;
  const http = { get: jest.fn() };

  beforeEach(async () => {
    http.get.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        TmdbService,
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-token' } },
      ],
    }).compile();
    service = module.get(TmdbService);
  });

  it('loads localized details and credits by ID and maps movie fields', async () => {
    http.get.mockReturnValue(of({ data: {
      id: 11,
      title: 'Guerra nas Estrelas',
      release_date: '1977-05-25',
      poster_path: '/poster.jpg',
      credits: { crew: [
        { name: 'George Lucas', job: 'Director' },
        { name: 'George Lucas', job: 'Director' },
        { name: 'John Williams', job: 'Original Music Composer' },
      ] },
    } }));

    await expect(service.getMovieDetails(11)).resolves.toEqual({
      tmdbId: 11,
      title: 'Guerra nas Estrelas',
      releaseYear: 1977,
      director: 'George Lucas',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    });
    expect(http.get).toHaveBeenCalledWith('https://api.themoviedb.org/3/movie/11', {
      params: { language: 'pt-BR', append_to_response: 'credits' },
      headers: { Authorization: 'Bearer test-token' },
      timeout: 5000,
    });
  });

  it('returns null for unavailable metadata', async () => {
    http.get.mockReturnValue(of({ data: {
      id: 11, title: 'Filme', release_date: '', poster_path: null,
      credits: { crew: [] },
    } }));

    await expect(service.getMovieDetails(11)).resolves.toEqual({
      tmdbId: 11, title: 'Filme', releaseYear: null, director: null, posterUrl: null,
    });
  });

  it('reports TMDB failures as service unavailability', async () => {
    http.get.mockReturnValue(throwError(() => new Error('timeout')));
    await expect(service.getMovieDetails(11)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
