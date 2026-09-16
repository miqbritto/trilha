import { Component } from '@angular/core';
import { Shell } from '../../shared/components/shell/shell';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-game-over',
  imports: [Shell, DatePipe],
  templateUrl: './game-over.html',
  styleUrl: './game-over.scss',
})
export class GameOver {

  readonly today = new Date()

}
