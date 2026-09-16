import { GameChallenge } from "./game-challenge"
import { GameGuess } from "./game-guess"
import { Movie } from "./movie";
import { Track } from "./music-track";

export enum GameSessionStatus {
    IN_PROGRESS = "in_progress",
    WON = "won",
    LOST = "lost"
}

export interface GameSession {
    version: 1;
    challenge: GameChallenge;
    guesses: GameGuess[];
}

export interface GameResult {
    movie: Movie,
    track: Track
}