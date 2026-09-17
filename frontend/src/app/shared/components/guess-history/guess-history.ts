import { Component, input } from "@angular/core";
import { GameGuess } from "../../../core/models/game-guess";

@Component({
    selector: "app-guess-history",
    styleUrl: './guess-history.scss',
    templateUrl: "./guess-history.html",

})
export class GuessHistory {
    readonly guesses = input.required<GameGuess[]>();
    readonly guessSlots = input.required<number[]>();
}