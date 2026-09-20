export type GameMode = "free" | "daily";

interface GameRules {
    revealStages: number[];
}

interface BaseGameChallenge {
    id: string;
    audioUrl?: string;
    rules: GameRules;
    number: number;
}

export interface DailyGameChallenge extends BaseGameChallenge {
    mode: "daily";
    date: string;
    expiresAt: string;
}

export interface FreeGameChallenge extends BaseGameChallenge {
    mode: "free";
}

export type GameChallenge = DailyGameChallenge | FreeGameChallenge;

export interface GameChallengeHistory {
    id: string;
    number: number;
    date: string;
}