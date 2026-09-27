import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Movie } from '../../core/models/movie';
import { MovieService } from '../../core/services/movie.service';
import { GameMovieSearch } from './game-movie-search';

describe('Game movie search', () => {
  const movie: Movie = {
    tmdbId: 1,
    title: 'Filme',
    releaseYear: 2000,
    director: null,
    posterUrl: null,
    quote: null,
  };
  let search: GameMovieSearch;
  let api: { searchMovie: ReturnType<typeof vi.fn>; getDirector: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    api = { searchMovie: vi.fn(() => of([movie])), getDirector: vi.fn() };
    TestBed.configureTestingModule({
      providers: [GameMovieSearch, { provide: MovieService, useValue: api }],
    });
    search = TestBed.inject(GameMovieSearch);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('debounces typing and ignores results from an outdated query immediately', () => {
    const pending = new Subject<Movie[]>();
    api.searchMovie.mockReturnValueOnce(pending);
    search.searchMovie('fi');
    vi.advanceTimersByTime(349);
    expect(api.searchMovie).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    search.searchMovie('filme');
    pending.next([{ ...movie, title: 'Outdated' }]);
    expect(search.suggestions()).toEqual([]);
    vi.advanceTimersByTime(350);
    expect(search.suggestions()).toEqual([movie]);
  });

  it('does not apply a previous director response to the new selection', () => {
    const pending = new Subject<{ director: string | null }>();
    api.getDirector
      .mockReturnValueOnce(pending)
      .mockReturnValueOnce(of({ director: 'New director' }));
    search.selectMovie(movie);
    search.selectMovie({ ...movie, tmdbId: 2 });
    pending.next({ director: 'Old director' });
    expect(search.selectedMovie()?.director).toBe('New director');
    expect(search.directorLoading()).toBe(false);
  });

  it('cancels director loading when the selection is cleared', () => {
    const pending = new Subject<{ director: string | null }>();
    api.getDirector.mockReturnValue(pending);
    search.selectMovie(movie);
    expect(search.directorLoading()).toBe(true);
    search.clearSelectedMovie();
    pending.next({ director: 'Director' });
    expect(search.selectedMovie()).toBeNull();
    expect(search.directorLoading()).toBe(false);
  });

  it('cancels pending work when its injector is destroyed', () => {
    search.searchMovie('filme');
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(350);
    expect(api.searchMovie).not.toHaveBeenCalled();
  });
});
