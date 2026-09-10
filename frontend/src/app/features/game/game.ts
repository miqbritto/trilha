import { Component, inject, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-game',
  imports: [Shell],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {

   private readonly searchTerms$ = new Subject<string>();

   private readonly movieService = inject(MovieService);
   readonly bars = Array.from({ length: 6 }, (_, i) => i)
   readonly waves = Array.from({ length: 12 }, (_, i) => i)

   protected readonly isPressed = signal(false);
   readonly suggestions = signal<Movie[] | null >(null);
   readonly selectedMovie = signal<Movie | null>(null)

   constructor() {
      this.searchTerms$.pipe(
         debounceTime(200),
         distinctUntilChanged(),
         switchMap( search => {
            if (search.length < 2) {
               return of<Movie[]>([]);
            }

            return this.movieService.searchMovie(search).pipe(
               catchError(error => {
                  console.error("Erro ao buscar filmes: ", error)
                  return of<Movie[]>([])
               })
            )
         }),
         takeUntilDestroyed()
      ).subscribe(movies => {
         this.suggestions.set(movies)
      })
   }

   pressButton() {
      this.isPressed.set(true);

      setTimeout(() => {
         this.isPressed.set(false);
      }, 1000);
   }

   searchMovie(search: string) {
      this.selectedMovie.set(null);
      this.suggestions.set([])
      this.searchTerms$.next(search.trim());
   }

   selectMovie(movie: Movie) {
    this.selectedMovie.set(movie);
    this.suggestions.set([]);
   }

}
