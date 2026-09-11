interface ChallengeRules {
  revealStages: number[];
}

export interface DailyChallengeResponse {
  id: string;
  mode: 'daily';
  date: string;
  rules: ChallengeRules;
}

export interface FreeChallengeResponse {
  id: string;
  mode: 'free';
  rules: ChallengeRules;
}