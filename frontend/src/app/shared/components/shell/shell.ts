import { Component } from '@angular/core';
import { ɵEmptyOutletComponent, RouterLinkActive, RouterLink } from "@angular/router";

@Component({
  imports: [RouterLinkActive, RouterLink],
  selector: 'app-shell',
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {}
