import { MAX_ATTEMPTS, type RoomPhase } from "@code-shoot/shared";
import { MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("number") attemptsLeft: number = MAX_ATTEMPTS;
  @type("boolean") solved = false;
  /** Last judge note, mirrored to clients so the opponent sees progress. */
  @type("string") status = "";
}

export class DuelState extends Schema {
  @type("string") phase: RoomPhase = "waiting";
  @type("string") problemId = "";
  @type("number") startedAt = 0;
  @type("string") winnerId = "";
  @type("string") reason = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
