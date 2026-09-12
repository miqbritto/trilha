import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http"
import { DailyGameChallenge } from "../models/game-challenge";



@Injectable({ providedIn: 'root'})
export class GameService {
    private hhtp = inject(HttpClient);
    private readonly apiUrl = "http://localhost:3000/games"

    getDailyChallenge() {
        return this.hhtp.get<DailyGameChallenge>(
            `${this.apiUrl}/daily`
        )
    }
}