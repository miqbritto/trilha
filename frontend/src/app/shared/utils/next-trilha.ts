const gameClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function nextTrilhaCountdown(now: Date): string {
  const parts = gameClock.formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  const remainingSeconds = 86400 - (value('hour') * 3600 + value('minute') * 60 + value('second'));
  const minutes = Math.ceil(remainingSeconds / 60);
  return `${Math.floor(minutes / 60)}H ${String(minutes % 60).padStart(2, '0')}M`;
}
