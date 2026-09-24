import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http"
import { DailyGameChallenge, GameChallengeHistory } from "../models/game-challenge";
import { ValidateGuessResponse } from "../models/game-guess";
import { Movie } from "../models/movie";
import { GameResult } from "../models/game-session";
import { environment } from '../../../environments/environment.development';



@Injectable({ providedIn: 'root'})
export class GameService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/games`;

    getDailyChallenge() {
        return this.http.get<DailyGameChallenge>(
            `${this.apiUrl}/daily`
        )
    }

    getChallenge(challengeId: string) {
        return this.http.get<DailyGameChallenge>(
            `${this.apiUrl}/daily/${challengeId}`
        )
    }

    sendGuess(challengeId: string, tmdbId: number) {
        return this.http.post<ValidateGuessResponse>(`${this.apiUrl}/guesses`, {
            challengeId,
            tmdbId
        })
    }

    getDailyResult(challengeId: string) {
        return this.http.get<GameResult>(
            `${this.apiUrl}/daily/${challengeId}/result`
        )
    }

    getAllChallenges() {
        return this.http.get<GameChallengeHistory[]>(
            `${this.apiUrl}/history`
        )
    }
}
