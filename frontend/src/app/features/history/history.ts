import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { ChallengeCard } from './components/challenge-card/challenge-card';
import { GameService } from '../../core/services/game.service';
import { GameChallengeHistory } from '../../core/models/game-challenge';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  imports: [Shell, ChallengeCard, RouterLink],
  selector: 'app-history',
  styleUrl: './history.scss',
  templateUrl: './history.html',
})
export class History implements OnInit {
  private readonly gameService = inject(GameService)

  protected readonly challenges = signal<GameChallengeHistory[] | null>(null)


  protected readonly challengesByMonth = computed(() => {
    const groups = new Map<
    string,
    {
      key: string;
      label: string;
      challenges: GameChallengeHistory[];
    }>();

    for (const challenge of this.challenges() ?? []) {
      const [year, month] = challenge.date.split('-').map(Number);
      const key = `${year}-${String(month).padStart(2, "0")}`

      if (!groups.has(key)) {
        const label = new Intl.DateTimeFormat('pt-BR', {
          month: 'short',
          year: 'numeric'
        })
          .format(new Date(year, month - 1))
          .replace('.', '')
          .replace('de', '')
          .toUpperCase();

        groups.set(key, {
          key,
          label,
          challenges: []
        })
      }

      groups.get(key)!.challenges.push(challenge);
    }

    return [...groups.values()];
  })

  ngOnInit(): void {
    this.getAllChallenges();
  }

  async getAllChallenges() {
    const challenges = await firstValueFrom(this.gameService.getAllChallenges())
    this.challenges.set(challenges)
    console.log("todos", this.challenges())
  }
}
