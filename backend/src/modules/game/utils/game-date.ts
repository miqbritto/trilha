export const GAME_TIME_ZONE = "America/Sao_Paulo";

const gameDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: GAME_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export function getGameDate(now: Date = new Date()): string {
    const parts = gameDateFormatter.formatToParts(now);

    const year = parts.find( part => part.type === "year")!.value;
    const month = parts.find(part => part.type === 'month')!.value;
    const day = parts.find(part => part.type === 'day')!.value;

    return `${year}-${month}-${day}`
}