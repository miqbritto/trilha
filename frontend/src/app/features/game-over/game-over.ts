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

  protected readonly gameStatus = computed(() => {
    const session = this.session();

    return session 
      ? getGameStatus(session, MAX_GUESSES)
      : null;
  })

  readonly today = new Date()

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
