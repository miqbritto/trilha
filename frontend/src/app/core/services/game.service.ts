import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http"
import { DailyGameChallenge, GameChallengeHistory, NewChallenge, StudioChallengeResponse } from "../models/game-challenge";
import { ValidateGuessResponse } from "../models/game-guess";
import { Movie } from "../models/movie";
import { GameResult } from "../models/game-session";
import { environment } from '../../../environments/environment.development';
import { map } from 'rxjs';



@Injectable({ providedIn: 'root'})
export class GameService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/games`;

    getDailyChallenge() {
        return this.http.get<DailyGameChallenge>(
            `${this.apiUrl}/daily`
        ).pipe(map(challenge => this.withAudioUrl(challenge)));
    }

    getChallenge(challengeId: string) {
        return this.http.get<DailyGameChallenge>(
            `${this.apiUrl}/daily/${challengeId}`
        ).pipe(map(challenge => this.withAudioUrl(challenge)));
    }

    private withAudioUrl(challenge: DailyGameChallenge): DailyGameChallenge {
        return { ...challenge, audioUrl: `${this.apiUrl}/daily/${encodeURIComponent(challenge.id)}/audio` };
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

    getChallengeHistory() {
        return this.http.get<GameChallengeHistory[]>(
            `${this.apiUrl}/history`
        )
    }

    getStudioChallenges(adminKey: string) {
        return this.http.get<StudioChallengeResponse[]>(
            `${this.apiUrl}/admin/challenges`,
            { headers: { 'x-admin-key': adminKey } },
        );
    }

    createDailyChallenge( musicTrackId: string, date: string, adminKey: string ) {
        const body: NewChallenge = {
            musicTrackId,
            date
        };
        return this.http.post<GameChallengeHistory>(`${this.apiUrl}/daily`, body, {
            headers: { 'x-admin-key': adminKey }
        })
    }
}
