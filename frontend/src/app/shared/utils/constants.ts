export const MAX_GUESSES = 5;

export const guessSlots = Array.from(
      { length: MAX_GUESSES },
      (_, index) => index + 1,
   )