import { Component } from '@angular/core';
import { HowToPlayDialog } from './components/how-to-play-dialog/how-to-play-dialog';

@Component({
  imports: [HowToPlayDialog],
  selector: 'app-shell',
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {}
