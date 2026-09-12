import { Component, inject } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { GameService } from '../../core/services/game.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  imports: [Shell],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {

  private readonly gameService = inject(GameService)
  private readonly router = inject(Router)

  async play() {
    try {
      const challenge = await firstValueFrom(
        this.gameService.getDailyChallenge()
      )

      await this.router.navigate(["/game"], {
        state: { challenge }
      })
    } catch (error) {
        console.error("Erro ao carregar desafio", error)
    }
  }

}
