import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-challenge-card',
  styleUrl: './challenge-card.scss',
  templateUrl: './challenge-card.html',
})
export class ChallengeCard {
  readonly number = input.required<number>();
  readonly dateLabel = input.required<string>();
  readonly highlighted = input(false);

  readonly formattedDate = computed(() => {
    const [year, month, day] = this.dateLabel().split('-').map(Number)
    
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      month: 'short'
    })
      .format(new Date(year, month - 1, day))
      .replace('.', '')
      .replace('de', '')
      .toUpperCase();

    return `${String(day).padStart(2, '0')} ${formatted}`
  })
}
