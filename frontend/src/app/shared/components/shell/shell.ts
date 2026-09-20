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
  readonly openInstructionsOnInit = input(false);
  private readonly instructions = viewChild.required(HowToPlayDialog);

  constructor() {
    afterNextRender(() => {
      if (this.openInstructionsOnInit()) {
        this.instructions().open();
      }
    });
  }
}
