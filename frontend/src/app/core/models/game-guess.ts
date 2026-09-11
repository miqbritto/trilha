import { Movie } from "./movie";

export interface GameGuess {
    movie: Movie;
    correct: boolean;
}

export interface ValidateGuessRequest {
    challengeId: string;
    movieId: string;
}

export interface ValidateGuessResponse {
    correct: boolean;
}