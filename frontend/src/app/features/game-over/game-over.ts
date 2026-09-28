import { afterNextRender, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { DatePipe } from '@angular/common';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameResult, GameSession } from '../../core/models/game-session';
import { GameService } from '../../core/services/game.service';
import { DailyGameChallenge } from '../../core/models/game-challenge';
import { firstValueFrom, timeout } from 'rxjs';
import { RouterLink } from '@angular/router';
import { getGameStatus } from '../../shared/utils/helpers';
import { MAX_GUESSES, guessSlots } from '../../shared/utils/constants';
import { GuessHistory } from '../../shared/components/guess-history/guess-history';
import { PlayerCard } from '../../shared/components/player-card/player-card';
import { nextTrilhaCountdown } from '../../shared/utils/next-trilha';

@Component({
  selector: 'app-game-over',
  imports: [Shell, DatePipe, GuessHistory, PlayerCard, RouterLink],
  templateUrl: './game-over.html',
  styleUrl: './game-over.scss',
})
export class GameOver implements OnInit{

  readonly guessSlots = Array.from(
      { length: MAX_GUESSES },
      (_, index) => index + 1,
   )

  protected readonly gameStorage    = inject(GameSessionStorage)
  protected readonly game           = inject(GameService)
  private readonly destroyRef       = inject(DestroyRef);


  protected readonly session        = signal<GameSession | null>(null)
  protected readonly challenge      = signal<DailyGameChallenge | null>(null)
  protected readonly result         = signal<GameResult | null>(null);
  protected readonly loading        = signal(false);
  protected readonly loadError      = signal('');
   protected readonly shareFeedback = signal('');
  protected readonly isSharing      = signal(false);
  protected readonly isCopied       = signal(false);

  protected readonly attempts       = computed(() => this.session()?.guesses ?? []);
  protected readonly attemptCount   = computed(() => this.attempts().length);
  protected readonly revealedSeconds = computed(() => {
    if (!this.attemptCount()) return 0;
    return this.session()?.challenge.rules.revealStages?.[this.attemptCount() - 1] ?? null;
  });
 
  private copiedTimeout?: ReturnType<typeof setTimeout>;
  protected readonly nextTrilha = signal(nextTrilhaCountdown(new Date()));

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.copiedTimeout));
    afterNextRender(() => {
      const update = () => this.nextTrilha.set(nextTrilhaCountdown(new Date()));
      update();
      const interval = setInterval(update, 1000);
      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  protected readonly gameStatus = computed(() => {
    const session = this.session();

    return session 
      ? getGameStatus(session, MAX_GUESSES)
      : null;
  })

  protected readonly challengeDate = computed(() => {
    const challenge = this.session()?.challenge;
    return challenge?.mode === 'daily' ? challenge.date : null;
  });
  protected readonly shareTitle = computed(() => {
    const challenge = this.session()?.challenge;
    return challenge ? `TRILHA #${challenge.number}` : 'TRILHA';
  });

  protected readonly resultSummary = computed(() => {
    const count = this.attemptCount();
    const status = this.gameStatus() === 'won' ? 'resolvido' : 'encerrado';
    const seconds = this.revealedSeconds();
    const duration = seconds === null ? '' : ` · ${seconds}s de trilha`;
    return `${status} em ${count} ${count === 1 ? 'tentativa' : 'tentativas'}${duration}`;
  });

  async shareResults() {
    if (this.isSharing() || this.isCopied() || !this.attemptCount()) return;
    this.isSharing.set(true);
    this.shareFeedback.set('');
    const bars = ['▁', '▂', '▄', '▆', '█'];
    const attempts = this.attempts()
      .map((guess, index) => guess.correct ? '◆' : bars[index] ?? '█')
      .join(' ');

    try {
      await navigator.clipboard.writeText(`${this.shareTitle()}\n${attempts}\n${this.resultSummary()}`);
      if (this.destroyRef.destroyed) return;
      this.isCopied.set(true);
      this.copiedTimeout = setTimeout(() => {
        this.isCopied.set(false);
        this.copiedTimeout = undefined;
      }, 2000);
    } catch {
      this.shareFeedback.set('Não foi possível copiar. Tente novamente.');
    } finally {
      this.isSharing.set(false);
    }
  }

  ngOnInit(): void {
    this.getChallenge()
  }

  async getChallenge() {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    try {
      const session = this.gameStorage.load()
      this.session.set(session)
      if(!session) {
        return;
      }
      const result = await firstValueFrom(
        this.game.getDailyResult(session.challenge.id).pipe(timeout(15000))
      );

      this.result.set(result); 
    } catch (error) {
      this.loadError.set('Não foi possível carregar o resultado. Tente novamente.');
      console.error("Erro ao carregar resultado", error)
    } finally {
      this.loading.set(false);
    }
    
  }

}
