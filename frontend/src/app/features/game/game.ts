import { Component, signal } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';

@Component({
  selector: 'app-game',
  imports: [Shell],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {
   readonly bars = Array.from({ length: 6 }, (_, i) => i)
   readonly waves = Array.from({ length: 12 }, (_, i) => i)

   protected readonly isPressed = signal(false);

   pressButton() {
      this.isPressed.set(true);

      setTimeout(() => {
         this.isPressed.set(false);
      }, 1000);
   }

}
