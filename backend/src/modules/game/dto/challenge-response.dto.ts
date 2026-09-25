interface ChallengeRules {
  revealStages: number[];
}

export interface DailyChallengeResponse {
  id: string;
  mode: 'daily';
  number: number;
  date: string;
  rules: ChallengeRules;
  audioUrl?: string;
}

export interface FreeChallengeResponse {
  id: string;
  mode: 'free';
  rules: ChallengeRules;
}

export interface ChallengeHistoryResponse {
  id: string;
  number: number;
  date: string;
}

export interface StudioChallengeResponse {
  id: string;
  number: number;
  date: string;
  track: {
    id: string;
    title: string;
    artist: string | null;
    movie: string;
  };
}
