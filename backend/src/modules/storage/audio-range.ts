import { HttpException } from '@nestjs/common';

export class AudioRangeError extends HttpException {
  constructor(readonly size: number) {
    super('Intervalo de áudio inválido.', 416);
  }
}

export function audioRange(value: string, size: number): string {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size <= 0) throw new AudioRangeError(size);
  const first = match[1] ? Number(match[1]) : undefined;
  const last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first)) ||
      (last !== undefined && !Number.isSafeInteger(last))) throw new AudioRangeError(size);
  const start = first ?? Math.max(0, size - last!);
  const end = first === undefined ? size - 1 : Math.min(last ?? size - 1, size - 1);
  if (start >= size || end < start) throw new AudioRangeError(size);
  return `bytes=${start}-${end}`;
}
