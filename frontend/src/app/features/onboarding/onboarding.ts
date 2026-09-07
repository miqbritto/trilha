import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Shell } from '../../shared/components/shell/shell';

@Component({
  selector: 'app-onboarding',
  imports: [Shell, RouterLink],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {

}
