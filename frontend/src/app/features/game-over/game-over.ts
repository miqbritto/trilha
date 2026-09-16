import { Component, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { DatePipe } from '@angular/common';
import { GameSessionStorage } from '../../core/services/game-session-storage.service';
import { GameSession } from '../../core/models/game-session';
import { GameService } from '../../core/services/game.service';
import { DailyGameChallenge } from '../../core/models/game-challenge';
import { firstValueFrom } from 'rxjs';

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

  readonly today = new Date()

  ngOnInit(): void {
    this.getChallenge()
  }

  async getChallenge() {
    const challenge = await firstValueFrom(
      this.game.getDailyChallenge()
    )

    const session = this.gameStorage.load()

    this.challenge.set(challenge)
    this.session.set(session)

    return challenge;
  }

}
