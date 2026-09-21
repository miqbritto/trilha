import { Component, input } from '@angular/core';

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
}
