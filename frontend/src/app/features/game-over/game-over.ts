import { Component, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { DatePipe } from '@angular/common';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameResult, GameSession } from '../../core/models/game-session';
import { GameService } from '../../core/services/game.service';
import { DailyGameChallenge } from '../../core/models/game-challenge';
import { firstValueFrom } from 'rxjs';
import { Movie } from '../../core/models/movie';

@Component({
  selector: 'app-game-over',
  imports: [Shell, DatePipe],
  templateUrl: './game-over.html',
  styleUrl: './game-over.scss',
})
export class GameOver implements OnInit{

  protected readonly gameStorage = inject(GameSessionStorage)
  protected readonly game = inject(GameService)

  protected readonly session = signal<GameSession | null>(null)
  protected readonly challenge = signal<DailyGameChallenge | null>(null)
  protected readonly result = signal<GameResult | null>(null);

  readonly today = new Date()

  ngOnInit(): void {
    this.getChallenge()
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
