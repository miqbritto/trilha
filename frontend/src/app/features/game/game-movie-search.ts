import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap, timer, timeout } from 'rxjs';
import { Movie } from '../../core/models/movie';
import { MovieService } from '../../core/services/movie.service';

// Provided by Game so requests and selection live only as long as the screen.
@Injectable()
export class GameMovieSearch {
  private readonly movieService = inject(MovieService);
  private readonly directorSelection$ = new Subject<Movie | null>();
  private readonly searchTerms$ = new Subject<string>();

  readonly searchError = signal('');
  readonly searching = signal(false);
  readonly searchQuery = signal('');
  readonly suggestions = signal<Movie[] | null>(null);
  readonly selectedMovie = signal<Movie | null>(null);
  readonly directorLoading = signal(false);

  constructor() {
    this.directorSelection$
      .pipe(
        switchMap((movie) => {
          if (!movie) return of(null);

          return this.movieService.getDirector(movie.tmdbId).pipe(
            timeout(15000),
            catchError(() => of({ director: null })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.directorLoading.set(false);
        if (result) {
          this.selectedMovie.update((movie) =>
            movie ? { ...movie, director: result.director } : null,
          );
        }
      });

    this.searchTerms$
      .pipe(
        switchMap((search) => {
          this.searchError.set('');
          this.searching.set(search.length >= 2);
          if (search.length < 2) {
            return of<Movie[]>([]);
          }

          return timer(350).pipe(
            switchMap(() => this.movieService.searchMovie(search)),
            timeout(15000),
            catchError(() => {
              this.searchError.set('Não foi possível buscar filmes. Tente novamente.');
              return of<Movie[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((movies) => {
        this.searching.set(false);
        this.suggestions.set(movies);
      });
  }

  searchMovie(search: string) {
    this.clearSelectedMovie();
    this.suggestions.set([]);
    this.searchQuery.set(search.trim());
    this.searchTerms$.next(search.trim());
  }

  retrySearch() {
    this.searchTerms$.next(this.searchQuery());
  }

  selectMovie(movie: Movie) {
    this.searchTerms$.next('');
    this.searchQuery.set('');

    this.selectedMovie.set(movie);
    this.suggestions.set([]);
    this.directorLoading.set(true);
    this.directorSelection$.next(movie);
  }

  clearSelectedMovie() {
    this.selectedMovie.set(null);
    this.directorSelection$.next(null);
  }
}
