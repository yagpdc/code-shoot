import type { PublicProblem } from "./problems.js";

export const MAX_ATTEMPTS = 3;
export const DUEL_ROOM = "duel";

export type RoomPhase = "waiting" | "playing" | "finished";

/** `solved`: someone passed. `exhausted`: both used 3 attempts. `abandoned`: opponent left. */
export type GameOverReason = "solved" | "exhausted" | "abandoned";

/** Client → server messages (Colyseus message names + payloads). */
export interface ClientMessages {
  submit: { code: string };
}

/** Server → client messages. */
export interface ServerMessages {
  problem: { problem: PublicProblem };
  judged: JudgeResult;
  /** Broadcast when the match ends. */
  gameover: { winnerId: string | null; reason: GameOverReason };
}

export interface JudgeFailure {
  input: unknown[];
  expected: unknown;
  got: unknown;
}

export interface JudgeResult {
  /** Echoed back so the client knows which of its submissions this answers. */
  playerId: string;
  accepted: boolean;
  attemptsLeft: number;
  passed: number;
  total: number;
  /** Human-readable note: runtime/compile error, timeout, or first failing case. */
  message: string;
  failure: JudgeFailure | null;
}
