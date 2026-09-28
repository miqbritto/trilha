import { StudioAccess } from '../../core/services/studio-access.service';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Studio } from './studio';
import { MovieService } from '../../core/services/movie.service';
import { MusicTrackService } from '../../core/services/music-track.service';
import { GameService } from '../../core/services/game.service';
import { Movie, RegisteredMovie } from '../../core/models/movie';

describe('Studio movie registration', () => {
  let studio: Studio;
  const movie: Movie = {
    tmdbId: 157336, title: 'Interestelar', releaseYear: 2014,
    director: null, posterUrl: null, quote: null,
  };
  const service = { searchMovie: vi.fn(), create: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: StudioAccess, useValue: { getKey: () => 'key' } },
      { provide: MovieService, useValue: service },
      { provide: MusicTrackService, useValue: {} },
      { provide: GameService, useValue: {} },
    ] });
    studio = TestBed.runInInjectionContext(() => new Studio());
  });

  afterEach(() => {
    studio.ngOnDestroy();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('debounces typing and discards an older search response', () => {
    const oldResults = new Subject<Movie[]>();
    service.searchMovie.mockReturnValueOnce(oldResults).mockReturnValueOnce(of([movie]));
    studio['searchTmdbMovies']('in');
    vi.advanceTimersByTime(299);
    expect(service.searchMovie).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    studio['searchTmdbMovies']('interestelar');
    oldResults.next([{ ...movie, title: 'Old result' }]);
    expect(studio['tmdbMovies']()).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(studio['tmdbMovies']()).toEqual([movie]);
  });

  it('invalidates a selection when the search is edited', () => {
    studio['selectTmdbMovie'](movie);
    studio['searchTmdbMovies']('x');
    expect(studio['tmdbSelection']()).toBeNull();
    expect(studio['movieSearching']()).toBe(false);
  });

  it('sends the selected ID and key once while saving, then resets on success', () => {
    const response = new Subject<RegisteredMovie>();
    service.create.mockReturnValue(response);
    const form = { invalid: false, resetForm: vi.fn() } as unknown as NgForm;
    studio['adminKey'] = 'test-key';
    studio['selectTmdbMovie'](movie);
    studio['movieQuote'] = 'Quote';
    studio['saveMovie'](form);
    studio['saveMovie'](form);
    expect(service.create).toHaveBeenCalledExactlyOnceWith(
      { tmdbId: movie.tmdbId, quote: 'Quote' }, 'test-key',
    );
    response.next({ id: 'local-id', tmdbId: movie.tmdbId, title: movie.title, quote: 'Quote' });
    expect(studio['movieSaving']()).toBe(false);
    expect(studio['tmdbSelection']()).toBeNull();
    expect(studio['adminKey']).toBe('test-key');
  });

  it('preserves the selection and quote after an authentication error', () => {
    service.create.mockReturnValue(throwError(() => ({ status: 401 })));
    studio['adminKey'] = 'wrong-key';
    studio['selectTmdbMovie'](movie);
    studio['movieQuote'] = 'Quote';
    studio['saveMovie']({ invalid: false } as NgForm);
    expect(studio['tmdbSelection']()).toEqual(movie);
    expect(studio['movieQuote']).toBe('Quote');
    expect(studio['movieError']()).toContain('Chave de administrador inválida');
    expect(studio['movieSaving']()).toBe(false);
  });
});
