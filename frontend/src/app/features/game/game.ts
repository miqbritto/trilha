import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie';
import { catchError, firstValueFrom, of, Subject, switchMap, timer, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameSession } from '../../core/models/game-session';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameService } from '../../core/services/game.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MAX_GUESSES } from '../../shared/utils/constants';
import { GuessHistory } from '../../shared/components/guess-history/guess-history';
import { PlayerCard } from '../../shared/components/player-card/player-card';



@Component({
  selector: 'app-game',
  imports: [Shell, DatePipe, GuessHistory, PlayerCard],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {
   // Static metadata & constants
   readonly guessSlots = Array.from(
      { length: MAX_GUESSES },
      (_, index) => index + 1,
   )

   // Dependencies — services
   private readonly movieService = inject(MovieService);
   private readonly storage      = inject(GameSessionStorage)
   private readonly gameService  = inject(GameService)
   private readonly router = inject(Router);
   private readonly route  = inject(ActivatedRoute)
   readonly submitting = signal(false);
   readonly loading = signal(false);
   readonly loadError = signal('');
   readonly guessError = signal('');
   readonly searchError = signal('');
   readonly searching = signal(false);
   readonly searchQuery = signal('');

   // State — local state
   readonly challengeDate = computed(() => {
      const challenge = this.session()?.challenge;
      return challenge?.mode === 'daily' ? challenge.date : null;
   });
   readonly isCorrect            = signal<boolean | null>(null);
   readonly suggestions          = signal<Movie[] | null>(null);
   readonly selectedMovie        = signal<Movie | null>(null);
   readonly directorLoading      = signal(false);
   readonly session              = signal<GameSession | null>(null)
   readonly lastGuessedMovie     = signal<Movie | undefined>(undefined)
   private readonly directorSelection$ = new Subject<Movie | null>();
   private readonly searchTerms$ = new Subject<string>();
   readonly guessesMade          = computed(
      () => this.session()?.guesses.length ?? 0,
   )
   readonly revealStages = computed(() => this.session()?.challenge.rules.revealStages ?? []);
   readonly playbackLimit = computed(() => {
      const stages = this.revealStages();
      return stages[Math.min(this.guessesMade(), stages.length - 1)] ?? 0;
   });
   readonly remainingGuesses     = computed(
      () => Math.max(0, MAX_GUESSES - this.guessesMade())
   )
   readonly hasWon               = computed(
      () => this.session()?.guesses.some(guess => guess.correct) ?? false
   )
   readonly currentGuess         = computed(() => {
      if(!this.session() || this.hasWon() || this.remainingGuesses() === 0) {
         return null;
      }

      return this.guessesMade() + 1;
   })
   readonly hasGuessed           = computed(() => {
      if(this.guessesMade() > 0) {
         return true;
      }
      return false;
   })

   // Constructor — initialize the search subscription in the injection context
   constructor() {
      this.directorSelection$.pipe(
         switchMap(movie => {
            if (!movie) return of(null);

            return this.movieService.getDirector(movie.tmdbId).pipe(
               timeout(15000),
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
         switchMap(search => {
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
               })
            );
         }),
         takeUntilDestroyed()
      ).subscribe(movies => {
         this.searching.set(false);
         this.suggestions.set(movies);
      });
   }

   ngOnInit() {
      this.startNewGame()
   }

   // Actions — public API used by the template
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
      this.guessError.set('');
      this.selectedMovie.set(movie);
      this.suggestions.set([]);
      this.directorLoading.set(true);
      this.directorSelection$.next(movie);
   }

   clearSelectedMovie() {
      this.selectedMovie.set(null);
      this.directorSelection$.next(null);
   }


   async makeGuess() {
      const movie = this.selectedMovie();
      const session = this.session();

      if(!movie || !session || this.submitting() || this.hasWon() || !this.remainingGuesses()) return;

      this.submitting.set(true);
      this.guessError.set('');

      try {
         const response = await firstValueFrom(this.gameService.sendGuess(session.challenge.id, movie.tmdbId).pipe(timeout(15000)))
         const updatedSession: GameSession = {
            ...session,
            guesses: [...session.guesses, { movie, correct: response.correct }]
         };
         this.storage.save(updatedSession);
         this.session.set(updatedSession);
         this.isCorrect.set(response.correct)
         this.clearSelectedMovie();

         const guesses = this.session()?.guesses;
         const lastGuess = guesses?.at(-1)?.movie
         this.lastGuessedMovie.set(lastGuess)
         if (this.hasWon() || this.remainingGuesses() === 0) {
            await this.router.navigate(['/game-over']);
         }
         
      } catch (error) {
         this.guessError.set('Não foi possível confirmar o palpite. Tente novamente.');
         console.error("Erro ao verificar palpite: ", error);
      } finally {
         this.submitting.set(false);
      }
   
   }

   async startNewGame() {
      if (this.loading()) return;
      this.loading.set(true);
      this.loadError.set('');
      const challengeId = this.route.snapshot.paramMap.get("challengeId")

      try {
         const challenge = await firstValueFrom(
            (challengeId
               ? this.gameService.getChallenge(challengeId)
               : this.gameService.getDailyChallenge()).pipe(timeout(15000))
         );

         const savedSession = this.storage.load();

         if (savedSession && savedSession.challenge.id === challenge.id) {
            const restoredSession = { ...savedSession, challenge };
            this.session.set(restoredSession);
            this.storage.save(restoredSession);
            const lastGuess = savedSession.guesses.at(-1);
            this.isCorrect.set(lastGuess?.correct ?? null);
            this.lastGuessedMovie.set(lastGuess?.movie);
            if (this.hasWon() || this.remainingGuesses() === 0) {
               await this.router.navigate(['/game-over']);
            }
            return;
         }

         const newSession: GameSession = {
            version: 1,
            challenge,
            guesses: []
         };

         this.session.set(newSession);
         this.storage.save(newSession);
      } catch (error) {
         this.loadError.set(error instanceof HttpErrorResponse && error.status === 404
            ? (challengeId ? 'Este desafio não está disponível.' : 'O desafio de hoje ainda não está disponível. Volte daqui a pouco.')
            : 'Não foi possível carregar o desafio. Tente novamente.');
      } finally {
         this.loading.set(false);
      }
   }

}
