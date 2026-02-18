import type { Timestamp } from 'firebase/firestore';

export type GameStatus =
  | 'LOBBY'
  | 'WHISPERING'
  | 'ANSWERING'
  | 'CHALLENGE_DECISION' // Player decides to challenge an answer
  | 'RPS_CHALLENGE' // Player vs Player RPS
  | 'LEADER_DECISION' // Leader decides to reveal question or not
  | 'REVEAL_QUESTION' // The question is shown to all players
  | 'DARE'
  | 'DARE_REVEALED'
  | 'ENDED';

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export interface Player {
  uid: string;
  displayName: string;
  isOnline: boolean;
  orderIndex: number;
}

export interface Game {
  id: string;
  gameCode: string;
  status: GameStatus;
  leaderId: string;
  playerCount: number;
  activeTurnUid?: string;
  targetPlayerUid?: string;
  namedPlayerUid?: string;
  lastUpdated: Timestamp;
  dareTargetName?: string;
  dareInitiatorUid?: string;
  rpsWinnerUid?: string;
  rpsScores?: { [key: string]: number };
  rpsChoices?: { [key: string]: RPSChoice };
}

export interface PrivateData {
  currentQuestion?: string;
  currentDare?: string;
  rpsChoices?: { [key: string]: RPSChoice };
  rpsScores?: { [key: string]: number };
}
