import { GameSession, GameSessionStatus } from "../../core/models/game-session";

export function getGameStatus(
    session: GameSession,
    maxGuesses: number
): GameSessionStatus {
    if(session.guesses.some(guess => guess.correct)) {
        return GameSessionStatus.WON;
    }

    if(session.guesses.length >= maxGuesses) {
        return GameSessionStatus.LOST;
    }

    return GameSessionStatus.IN_PROGRESS;
}