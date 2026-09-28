import { afterNextRender, Component, input, viewChild } from '@angular/core';
import { HowToPlayDialog } from './components/how-to-play-dialog/how-to-play-dialog';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [HowToPlayDialog, RouterLink, RouterLinkActive],
  selector: 'app-shell',
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {
  readonly wide = input(false);
  readonly openInstructionsOnInit = input(false);
  private readonly instructions = viewChild.required(HowToPlayDialog);
  private readonly instructionsSeenKey = 'trilha.instructionsSeen';

  constructor() {
    afterNextRender(() => {
      if (this.openInstructionsOnInit()) {
        try {
          if (localStorage.getItem(this.instructionsSeenKey) === 'true') return;
        } catch { /* Instructions remain available when storage is disabled. */ }
        this.instructions().open();
        try {
          localStorage.setItem(this.instructionsSeenKey, 'true');
        } catch { /* A storage error must not block the page. */ }
      }
    });
  }
}
