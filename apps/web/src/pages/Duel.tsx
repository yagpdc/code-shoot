import {
  DUEL_ROOM,
  type GameOverReason,
  type JudgeResult,
  type PublicProblem,
} from "@code-shoot/shared";
import Editor from "@monaco-editor/react";
import type { Room } from "colyseus.js";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth.js";
import { gameClient } from "../lib/colyseus.js";

interface PlayerView {
  id: string;
  name: string;
  attemptsLeft: number;
  solved: boolean;
  status: string;
}

interface StateView {
  phase: "waiting" | "playing" | "finished";
  startedAt: number;
  players: PlayerView[];
}

function snapshot(state: unknown): StateView {
  // colyseus.js decodes to a schema instance; read it structurally.
  const s = state as {
    phase: StateView["phase"];
    startedAt: number;
    players?: { values: () => Iterable<PlayerView> };
  };
  const players: PlayerView[] = [];
  if (s.players) {
    for (const p of s.players.values()) {
      players.push({
        id: p.id,
        name: p.name,
        attemptsLeft: p.attemptsLeft,
        solved: p.solved,
        status: p.status,
      });
    }
  }
  return { phase: s.phase, startedAt: s.startedAt, players };
}

export function Duel() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const roomRef = useRef<Room | null>(null);
  const joinedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<StateView>({ phase: "waiting", startedAt: 0, players: [] });
  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [code, setCode] = useState("");
  const [judged, setJudged] = useState<JudgeResult | null>(null);
  const [gameover, setGameover] = useState<{
    winnerId: string | null;
    reason: GameOverReason;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const myId = session?.user?.id;

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      navigate("/login", { replace: true });
      return;
    }
    if (joinedRef.current) return;
    joinedRef.current = true;

    let disposed = false;
    gameClient
      .joinOrCreate(DUEL_ROOM)
      .then((room) => {
        if (disposed) {
          room.leave();
          return;
        }
        roomRef.current = room;
        room.onStateChange((state) => setView(snapshot(state)));
        room.onMessage("problem", (msg: { problem: PublicProblem }) => {
          setProblem(msg.problem);
          setCode(msg.problem.starterCode);
          setJudged(null);
        });
        room.onMessage("judged", (r: JudgeResult) => setJudged(r));
        room.onMessage("gameover", (g: { winnerId: string | null; reason: GameOverReason }) =>
          setGameover(g),
        );
        room.onError((_c, m) => setError(m ?? "Erro na sala."));
        room.onLeave(() => {
          roomRef.current = null;
        });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível entrar."));

    return () => {
      disposed = true;
      roomRef.current?.leave();
      roomRef.current = null;
    };
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (view.phase !== "playing" || !view.startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - view.startedAt) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [view.phase, view.startedAt]);

  const me = view.players.find((p) => p.id === myId);
  const opponent = view.players.find((p) => p.id !== myId);
  const canSubmit =
    view.phase === "playing" && !!me && me.attemptsLeft > 0 && !me.solved && !gameover;

  function submit() {
    if (!canSubmit) return;
    roomRef.current?.send("submit", { code });
  }

  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <button type="button" className="link" onClick={() => navigate("/lobby")}>
          Voltar ao lobby
        </button>
      </div>
    );
  }

  if (view.phase === "waiting" || view.players.length < 2 || !problem) {
    return (
      <div className="card center">
        <div className="spinner" />
        <p>Procurando oponente…</p>
      </div>
    );
  }

  const won = gameover ? gameover.winnerId === myId : false;

  return (
    <div className="duel">
      <aside className="panel">
        <div className="scorebar">
          <PlayerBadge player={me} you />
          <span className="timer">⏱ {elapsed}s</span>
          <PlayerBadge player={opponent} />
        </div>
        <h2>{problem.title}</h2>
        <span className={`pill ${problem.difficulty}`}>{problem.difficulty}</span>
        <pre className="prompt">{problem.prompt}</pre>
        <div className="samples">
          <strong>Exemplos</strong>
          {problem.samples.map((s) => (
            <code key={JSON.stringify(s.input)}>
              {problem.functionName}({JSON.stringify(s.input).slice(1, -1)}) →{" "}
              {JSON.stringify(s.expected)}
            </code>
          ))}
        </div>
      </aside>

      <section className="editor">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 14 }}
        />
        <div className="actions">
          {judged && (
            <span className={`verdict ${judged.accepted ? "ok" : "bad"}`}>
              {judged.message}
              {judged.failure && !judged.accepted && (
                <em>
                  {" "}
                  entrada {JSON.stringify(judged.failure.input)} → esperado{" "}
                  {JSON.stringify(judged.failure.expected)}, obteve{" "}
                  {JSON.stringify(judged.failure.got)}
                </em>
              )}
            </span>
          )}
          <button type="button" className="primary" disabled={!canSubmit} onClick={submit}>
            {me && me.attemptsLeft > 0
              ? `Submeter (${me.attemptsLeft} ${me.attemptsLeft === 1 ? "tentativa" : "tentativas"})`
              : "Sem tentativas"}
          </button>
        </div>
      </section>

      {gameover && (
        <div className={`gameover ${won ? "win" : "lose"}`}>
          <div className="shot" />
          <h1>
            {gameover.reason === "exhausted"
              ? "Empate — ninguém acertou"
              : gameover.reason === "abandoned"
                ? won
                  ? "Oponente saiu — você venceu"
                  : "Partida encerrada"
                : won
                  ? "🎯 Você atirou primeiro!"
                  : "💥 Você foi atingido"}
          </h1>
          <button type="button" className="primary" onClick={() => navigate("/lobby")}>
            Voltar ao lobby
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerBadge({ player, you }: { player?: PlayerView; you?: boolean }) {
  if (!player) return <span className="badge empty">—</span>;
  return (
    <span className={`badge ${player.solved ? "solved" : ""}`}>
      {you ? "Você" : player.name} · {player.attemptsLeft}❤
    </span>
  );
}
