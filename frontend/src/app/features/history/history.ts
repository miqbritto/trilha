import { Component, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { ChallengeCard } from './components/challenge-card/challenge-card';
import { GameService } from '../../core/services/game.service';
import { sign } from 'crypto';
import { GameChallengeHistory } from '../../core/models/game-challenge';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [Shell, ChallengeCard],
  selector: 'app-history',
  styleUrl: './history.scss',
  templateUrl: './history.html',
})
export class History implements OnInit {
  private readonly gameService = inject(GameService)

  protected readonly challenges = signal<GameChallengeHistory | null>(null)

  ngOnInit(): void {
    this.getAllChallenges();
  }

  async getAllChallenges() {
    const challenges = await firstValueFrom(this.gameService.getAllChallenges())
    this.challenges.set(challenges)
    console.log("todos", this.challenges())
  }
}
