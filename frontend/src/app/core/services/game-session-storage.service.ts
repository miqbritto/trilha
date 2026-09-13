import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { GameSession } from '../models/game-session';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: "root" })
export class GameSessionStorage {

    private readonly storageKey = "session"
    private readonly platformId = inject(PLATFORM_ID);

    save(session: GameSession) {
        if (!isPlatformBrowser(this.platformId)) return;
        sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    }

    load(): GameSession | null {
         if (!isPlatformBrowser(this.platformId)) return null;
       const session = sessionStorage.getItem(this.storageKey);

       if(!session) {
            return null;
       }
       const parsedSession = JSON.parse(session);

       return parsedSession;
    }

    clear() {
        if (!isPlatformBrowser(this.platformId)) return;
        sessionStorage.removeItem(this.storageKey);
    }
    
}

