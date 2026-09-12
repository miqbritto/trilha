import { Injectable } from '@angular/core';
import { GameSession } from '../models/game-session';

@Injectable({ providedIn: "root" })
export class GameSessionStorage {

    private readonly storageKey = "session"

    save(session: GameSession) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    }

    load(): GameSession | null {
       const session = sessionStorage.getItem(this.storageKey);

       if(!session) {
            return null;
       }
       const parsedSession = JSON.parse(session);

       return parsedSession;
    }

    clear() {
        sessionStorage.removeItem(this.storageKey);
    }
    
}

