import { Component, inject, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie';


@Component({
  selector: 'app-game',
  imports: [Shell],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {
  private readonly movieService = inject(MovieService);
   readonly bars = Array.from({ length: 6 }, (_, i) => i)
   readonly waves = Array.from({ length: 12 }, (_, i) => i)

   protected readonly isPressed = signal(false);
   readonly suggestions = signal<Movie[] | null >(null);
   readonly selectedMovie = signal<Movie | null>(null)

   pressButton() {
      this.isPressed.set(true);

      setTimeout(() => {
         this.isPressed.set(false);
      }, 1000);
   }

   searchMovie(search: string) {
    this.selectedMovie.set(null);
    this.suggestions.set([])
    this.movieService.searchMovie(search);
   }

   selectMovie(movie: Movie) {
    this.selectedMovie.set(movie);
    this.suggestions.set([]);
   }

}
