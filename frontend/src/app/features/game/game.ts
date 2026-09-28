import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Shell }                   from '../../shared/components/shell/shell';
import { GameMovieSearch }         from './game-movie-search';
import { Movie }                   from '../../core/models/movie';
import { HttpErrorResponse }       from '@angular/common/http';
import { GameSession }             from '../../core/models/game-session';
import { GameSessionStorage }      from '../../core/services/game-session-storage.service';
import { GameService }             from '../../core/services/game.service';
import { DatePipe }                from '@angular/common';
import { ActivatedRoute, Router }  from '@angular/router';
import { MAX_GUESSES }             from '../../shared/utils/constants';
import { GuessHistory }            from '../../shared/components/guess-history/guess-history';
import { PlayerCard }              from '../../shared/components/player-card/player-card';
import { firstValueFrom, timeout } from 'rxjs';
@Component({
  selector: 'app-game',
  providers: [GameMovieSearch],
  imports: [Shell, DatePipe, GuessHistory, PlayerCard],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {
  readonly guessSlots = Array.from({ length: MAX_GUESSES }, (_, index) => index + 1);

  readonly movieSearch          = inject(GameMovieSearch);
  private readonly storage      = inject(GameSessionStorage);
  private readonly gameService  = inject(GameService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);

  readonly submitting           = signal(false);
  readonly loading              = signal(false);
  readonly loadError            = signal('');
  readonly guessError           = signal('');
  readonly session              = signal<GameSession | null>(null);

  readonly isCorrect            = computed(() => this.session()?.guesses.at(-1)?.correct ?? null);
  
  readonly lastGuessedMovie     = computed(() => this.session()?.guesses.at(-1)?.movie);

  readonly challengeDate        = computed(() => {
    const challenge = this.session()?.challenge;
    return challenge?.mode === 'daily' ? challenge.date : null;
  });

  readonly guessesMade          = computed(() => this.session()?.guesses.length ?? 0);
  readonly revealStages         = computed(() => this.session()?.challenge.rules.revealStages ?? []);
  readonly playbackLimit        = computed(() => {
    const stages = this.revealStages();
    return stages[Math.min(this.guessesMade(), stages.length - 1)] ?? 0;
  });
  readonly remainingGuesses     = computed(() => Math.max(0, MAX_GUESSES - this.guessesMade()));
  readonly hasWon               = computed(() => this.session()?.guesses.some((guess) => guess.correct) ?? false);
  readonly hasGuessed           = computed(() => this.guessesMade() > 0);

  ngOnInit() {
    this.startNewGame();
  }

  selectMovie(movie: Movie) {
    this.guessError.set('');
    this.movieSearch.selectMovie(movie);
  }

  async makeGuess() {
    const movie = this.movieSearch.selectedMovie();
    const session = this.session();

    if (!movie || !session || this.submitting() || this.hasWon() || !this.remainingGuesses())
      return;

    this.submitting.set(true);
    this.guessError.set('');

    try {
      const response = await firstValueFrom(
        this.gameService.sendGuess(session.challenge.id, movie.tmdbId).pipe(timeout(15000)),
      );
      const updatedSession: GameSession = {
        ...session,
        guesses: [...session.guesses, { movie, correct: response.correct }],
      };
      this.storage.save(updatedSession);
      this.session.set(updatedSession);

      this.movieSearch.clearSelectedMovie();

      if (this.hasWon() || this.remainingGuesses() === 0) {
        await this.router.navigate(['/game-over']);
      }
    } catch (error) {
      this.guessError.set('Não foi possível confirmar o palpite. Tente novamente.');
      console.error('Erro ao verificar palpite: ', error);
    } finally {
      this.submitting.set(false);
    }
  }

  async startNewGame() {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    const challengeId = this.route.snapshot.paramMap.get('challengeId');

    try {
      const challenge = await firstValueFrom(
        (challengeId
          ? this.gameService.getChallenge(challengeId)
          : this.gameService.getDailyChallenge()
        ).pipe(timeout(15000)),
      );

      const savedSession = this.storage.load();

      if (savedSession && savedSession.challenge.id === challenge.id) {
        const restoredSession = { ...savedSession, challenge };
        this.session.set(restoredSession);
        this.storage.save(restoredSession);

        if (this.hasWon() || this.remainingGuesses() === 0) {
          await this.router.navigate(['/game-over']);
        }
        return;
      }

      const newSession: GameSession = {
        version: 1,
        challenge,
        guesses: [],
      };

      this.session.set(newSession);
      this.storage.save(newSession);
    } catch (error) {
      this.loadError.set(
        error instanceof HttpErrorResponse && error.status === 404
          ? challengeId
            ? 'Este desafio não está disponível.'
            : 'O desafio de hoje ainda não está disponível. Volte daqui a pouco.'
          : 'Não foi possível carregar o desafio. Tente novamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
