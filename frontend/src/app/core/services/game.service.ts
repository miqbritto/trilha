import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http"
import { DailyGameChallenge } from "../models/game-challenge";
import { ValidateGuessResponse } from "../models/game-guess";



@Injectable({ providedIn: 'root'})
export class GameService {
    private hhtp = inject(HttpClient);
    private readonly apiUrl = "http://localhost:3000/games"

    getDailyChallenge() {
        return this.hhtp.get<DailyGameChallenge>(
            `${this.apiUrl}/daily`
        )
    }

    sendGuess(challengeId: string, tmdbId: number) {
        return this.hhtp.post<ValidateGuessResponse>(`${this.apiUrl}/guesses`, {
            challengeId,
            tmdbId
        })
    }
}