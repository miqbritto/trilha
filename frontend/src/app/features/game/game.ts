import { Component, inject, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-game',
  imports: [Shell],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {
   // Static metadata & constants
   readonly bars  = Array.from({ length: 6 }, (_, i) => i);
   readonly waves = Array.from({ length: 12 }, (_, i) => i);

   // Dependencies — services
   private readonly movieService = inject(MovieService);

   // State — local state
   protected readonly isPressed  = signal(false);
   readonly suggestions          = signal<Movie[] | null>(null);
   readonly selectedMovie        = signal<Movie | null>(null);
   readonly directorLoading = signal(false);
   private readonly directorSelection$ = new Subject<Movie | null>();
   private readonly searchTerms$ = new Subject<string>();

   // Constructor — initialize the search subscription in the injection context
   constructor() {
      this.directorSelection$.pipe(
         switchMap(movie => {
            if (!movie) return of(null);

            return this.movieService.getDirector(movie.tmdbId).pipe(
               catchError(() => of({ director: null })),
            );
         }),
         takeUntilDestroyed(),
      ).subscribe(result => {
         this.directorLoading.set(false);
         if (result) {
            this.selectedMovie.update(movie => movie
               ? { ...movie, director: result.director }
               : null);
         }
      });

      this.searchTerms$.pipe(
         debounceTime(200),
         distinctUntilChanged(),
         switchMap(search => {
            if (search.length < 2) {
               return of<Movie[]>([]);
            }

            return this.movieService.searchMovie(search).pipe(
               catchError(error => {
                  console.error('Erro ao buscar filmes: ', error);
                  return of<Movie[]>([]);
               })
            );
         }),
         takeUntilDestroyed()
      ).subscribe(movies => {
         this.suggestions.set(movies);
      });
   }

   // Actions — public API used by the template
   pressButton() {
      this.isPressed.set(true);

      setTimeout(() => {
         this.isPressed.set(false);
      }, 1000);
   }

   searchMovie(search: string) {
      this.clearSelectedMovie();
      this.suggestions.set([]);
      this.searchTerms$.next(search.trim());
      console.log("suggestions", this.suggestions)
   }

   selectMovie(movie: Movie) {
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
