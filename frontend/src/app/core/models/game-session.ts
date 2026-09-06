export enum GameSessionStatus {
    IN_PROGRESS = "in_progress",
    WON = "won",
    LOST = "lost"
}

export interface GameSession {
    id: string,
    status: GameSessionStatus,
    score: number,
    musicTrackId: string
}