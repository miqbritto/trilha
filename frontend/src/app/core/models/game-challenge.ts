export type GameMode = "free" | "daily";

interface GameRules {
    reavealedStages: number[];
}

interface BaseGameChallenge {
    id: string;
    audioUrl: string;
    rules: GameRules;
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