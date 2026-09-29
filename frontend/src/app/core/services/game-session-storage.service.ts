import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { GameSession } from '../models/game-session';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: "root" })
export class GameSessionStorage {

    private readonly storageKey = "session"
    private readonly platformId = inject(PLATFORM_ID);

    save(session: GameSession) {
        if (!isPlatformBrowser(this.platformId)) return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(session));
            sessionStorage.removeItem(this.storageKey);
        } catch { /* Keep the game playable when browser storage is unavailable. */ }
    }

    load(): GameSession | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        try {
            const session = localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);

            if(!session) {
                return null;
            }
            const parsedSession = JSON.parse(session);
            if (!parsedSession?.challenge || !Array.isArray(parsedSession.guesses)) return null;

            // Replace storage URLs persisted by earlier versions, including game-over reloads.
            if (parsedSession.challenge?.mode === 'daily' && parsedSession.challenge.id) {
                parsedSession.challenge.audioUrl = `${environment.apiUrl.replace(/\/+$/, '')}/games/daily/${encodeURIComponent(parsedSession.challenge.id)}/audio`;
            }

            this.save(parsedSession);
            return parsedSession;
        } catch {
            return null;
        }
    }

    clear() {
        if (!isPlatformBrowser(this.platformId)) return;
        try {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
        } catch { /* Storage can be disabled by the browser. */ }
    }
    
}

