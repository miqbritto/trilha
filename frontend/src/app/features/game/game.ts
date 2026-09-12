import { Component, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameSession } from '../../core/models/game-session';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameChallenge } from '../../core/models/game-challenge';
import { Location } from '@angular/common';
import { GameService } from '../../core/services/game.service';


@Component({
  selector: 'app-game',
  imports: [Shell],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {
   // Static metadata & constants
   readonly bars  = Array.from({ length: 5 }, (_, i) => i);
   readonly waves = Array.from({ length: 12 }, (_, i) => i);

   // Dependencies — services
   private readonly movieService = inject(MovieService);
   private readonly storage      = inject(GameSessionStorage)
   private readonly location     = inject(Location)
   private readonly gameService  = inject(GameService)

   // State — local state
   protected readonly isPressed  = signal(false);
   readonly suggestions          = signal<Movie[] | null>(null);
   readonly selectedMovie        = signal<Movie | null>(null);
   readonly directorLoading      = signal(false);
   readonly session              = signal<GameSession | null>(null)
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

   ngOnInit(): void {
      
      // const state = this.location.getState() as {
      //    challenge?: GameChallenge
      // }

      // const challenge = state.challenge

      // if (challenge) {
      //    this.startNewGame(challenge)
      //    return;
      // }

      // const savedSession = this.storage.load()

      // if(savedSession) {
      //    this.session.set(savedSession)
      // }
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


   makeGuess() {
      
   }

   private startNewGame(challenge: GameChallenge) {
      const newSession: GameSession = {
         version: 1,
         challenge,
         guesses: []
      }

      this.session.set(newSession)
      this.storage.save(newSession)
   }

}
