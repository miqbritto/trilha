import { Component, input, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-player-card',
  styleUrl: './player-card.scss',
  templateUrl: './player-card.html',
})
export class PlayerCard implements OnDestroy {
  readonly guessSlots = input.required<number[]>();
  readonly waveBars = Array.from({ length: 18 }, (_, index) => index);
  readonly isPressed = signal(false);
  private playbackTimeout?: ReturnType<typeof setTimeout>;

  pressButton() {
    clearTimeout(this.playbackTimeout);
    this.isPressed.set(true);

    this.playbackTimeout = setTimeout(() => {
      this.isPressed.set(false);
    }, 1000);
  }

  ngOnDestroy() {
    clearTimeout(this.playbackTimeout);
  }
}
