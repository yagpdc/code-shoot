import type { IncomingMessage } from "node:http";
import { getProblem, randomProblem } from "@code-shoot/problems";
import {
  type GameOverReason,
  MAX_ATTEMPTS,
  type Problem,
  toPublicProblem,
} from "@code-shoot/shared";
import type { Client } from "colyseus";
// colyseus 0.15 is CJS; Node ESM can't see its named exports — default-import.
import colyseus from "colyseus";

const { Room } = colyseus;
import { auth } from "../auth.js";
import { db, schema } from "../db/index.js";
import { judge } from "../judge/piston.js";
import { DuelState, PlayerState } from "./state.js";

interface JoinAuth {
  userId: string;
  name: string;
}

export class DuelRoom extends Room<DuelState> {
  override maxClients = 2;
  private problem: Problem | null = null;
  private persisted = false;

  override onCreate(): void {
    this.setState(new DuelState());
    this.onMessage("submit", (client, message: { code?: unknown }) => {
      const code = typeof message?.code === "string" ? message.code : "";
      void this.handleSubmit(client, code);
    });
  }

  override async onAuth(
    _client: Client,
    _options: unknown,
    request?: IncomingMessage,
  ): Promise<JoinAuth> {
    const headers = new Headers();
    const cookie = request?.headers.cookie;
    if (cookie) headers.set("cookie", cookie);

    const result = await auth.api.getSession({ headers });
    if (!result?.user) throw new Error("unauthorized");

    return { userId: result.user.id, name: result.user.name || "Jogador" };
  }

  override onJoin(client: Client, _options?: unknown, joinAuth?: JoinAuth): void {
    if (!joinAuth) {
      client.leave();
      return;
    }
    const player = new PlayerState();
    player.id = joinAuth.userId;
    player.name = joinAuth.name;
    player.attemptsLeft = MAX_ATTEMPTS;
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size === this.maxClients && this.state.phase === "waiting") {
      this.startMatch();
    }
  }

  override onLeave(client: Client, _consented: boolean): void {
    this.state.players.delete(client.sessionId);
    if (this.state.phase === "playing") {
      const remaining = [...this.state.players.values()][0];
      this.endMatch(remaining ? remaining.id : null, "abandoned");
    }
  }

  private startMatch(): void {
    this.problem = randomProblem();
    this.state.problemId = this.problem.id;
    this.state.phase = "playing";
    this.state.startedAt = Date.now();
    const payload = { problem: toPublicProblem(this.problem) };
    this.broadcast("problem", payload);
  }

  private async handleSubmit(client: Client, code: string): Promise<void> {
    const player = this.state.players.get(client.sessionId);
    if (!player || this.state.phase !== "playing") return;
    if (player.attemptsLeft <= 0 || player.solved) return;

    const problem = this.problem ?? getProblem(this.state.problemId) ?? null;
    if (!problem) return;

    player.attemptsLeft -= 1;
    const result = await judge(problem, code, player.id, player.attemptsLeft);

    // Room may have ended while the sandbox was running.
    if (this.state.phase !== "playing") return;

    player.status = result.message;
    client.send("judged", result);

    if (result.accepted) {
      player.solved = true;
      this.endMatch(player.id, "solved");
      return;
    }

    const allOut = [...this.state.players.values()].every((p) => p.attemptsLeft <= 0);
    if (allOut) this.endMatch(null, "exhausted");
  }

  private endMatch(winnerId: string | null, reason: GameOverReason): void {
    if (this.state.phase === "finished") return;
    this.state.phase = "finished";
    this.state.winnerId = winnerId ?? "";
    this.state.reason = reason;
    this.broadcast("gameover", { winnerId, reason });
    this.lock();
    void this.persistMatch(winnerId, reason);
  }

  private async persistMatch(winnerId: string | null, reason: string): Promise<void> {
    if (this.persisted) return;
    this.persisted = true;
    try {
      await db.insert(schema.match).values({
        id: crypto.randomUUID(),
        problemId: this.state.problemId,
        winnerId,
        reason,
        players: [...this.state.players.values()].map((p) => p.id),
      });
    } catch (err) {
      console.error("[DuelRoom] failed to persist match:", err);
    }
  }
}
