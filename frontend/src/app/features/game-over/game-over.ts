import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { DatePipe } from '@angular/common';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameResult, GameSession } from '../../core/models/game-session';
import { GameService } from '../../core/services/game.service';
import { DailyGameChallenge } from '../../core/models/game-challenge';
import { firstValueFrom } from 'rxjs';
import { getGameStatus } from '../../shared/utils/helpers';
import { MAX_GUESSES, guessSlots } from '../../shared/utils/constants';
import { GuessHistory } from '../../shared/components/guess-history/guess-history';
import { PlayerCard } from '../../shared/components/player-card/player-card';

@Component({
  selector: 'app-game-over',
  imports: [Shell, DatePipe, GuessHistory, PlayerCard],
  templateUrl: './game-over.html',
  styleUrl: './game-over.scss',
})
export class GameOver implements OnInit{

  readonly guessSlots = Array.from(
      { length: MAX_GUESSES },
      (_, index) => index + 1,
   )

  protected readonly gameStorage = inject(GameSessionStorage)
  protected readonly game = inject(GameService)

  protected readonly session = signal<GameSession | null>(null)
  protected readonly challenge = signal<DailyGameChallenge | null>(null)
  protected readonly result = signal<GameResult | null>(null);
  protected readonly attempts = computed(() => this.session()?.guesses ?? []);
  protected readonly attemptCount = computed(() => this.attempts().length);
  protected readonly revealedSeconds = computed(() => {
    if (!this.attemptCount()) return 0;
    return this.session()?.challenge.rules.revealStages?.[this.attemptCount() - 1] ?? null;
  });
  protected readonly shareFeedback = signal('');
  protected readonly isSharing = signal(false);

  protected readonly gameStatus = computed(() => {
    const session = this.session();

    return session 
      ? getGameStatus(session, MAX_GUESSES)
      : null;
  })

  readonly today = new Date()

  protected readonly resultSummary = computed(() => {
    const count = this.attemptCount();
    const status = this.gameStatus() === 'won' ? 'resolvido' : 'encerrado';
    const seconds = this.revealedSeconds();
    const duration = seconds === null ? '' : ` · ${seconds}s de trilha`;
    return `${status} em ${count} ${count === 1 ? 'tentativa' : 'tentativas'}${duration}`;
  });

  async shareResults() {
    if (this.isSharing() || !this.attemptCount()) return;
    this.isSharing.set(true);
    this.shareFeedback.set('');
    const bars = ['▁', '▂', '▄', '▆', '█'];
    const attempts = this.attempts()
      .map((guess, index) => guess.correct ? '◆' : bars[index] ?? '█')
      .join(' ');

    try {
      await navigator.clipboard.writeText(`TRILHA #142\n${attempts}\n${this.resultSummary()}`);
      this.shareFeedback.set('Resultado copiado!');
    } catch {
      this.shareFeedback.set('Não foi possível copiar. Tente novamente.');
    } finally {
      this.isSharing.set(false);
    }
  }

  ngOnInit(): void {
    this.getChallenge()
    console.log(this.gameStatus())
  }

  async getChallenge() {
    

    try {
      const session = this.gameStorage.load()
      this.session.set(session)
      if(!session) {
        return;
      }
      const result = await firstValueFrom(
        this.game.getDailyResult(session.challenge.id)
      );

      this.result.set(result); 
    } catch (error) {
      console.error("Erro ao carregar resultado", error)
    }
    
  }

}
