import { buildRunnerScript, parseHarnessOutput } from "@code-shoot/problems";
import type { JudgeResult, Problem } from "@code-shoot/shared";
import { MAX_ATTEMPTS } from "@code-shoot/shared";
import { env } from "../env.js";
import { type RawRun, runLocal } from "./local.js";

interface PistonResponse {
  run?: { stdout: string; stderr: string; code: number | null; signal: string | null };
  message?: string;
}

async function runPiston(script: string): Promise<RawRun | { error: string }> {
  try {
    const r = await fetch(`${env.PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "javascript",
        version: env.PISTON_NODE_VERSION,
        files: [{ name: "main.js", content: script }],
        run_timeout: 5000,
        compile_timeout: 5000,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return { error: `Sandbox indisponível (HTTP ${r.status}).` };
    const res = (await r.json()) as PistonResponse;
    if (!res.run) return { error: res.message ?? "Sandbox não executou o código." };
    return {
      stdout: res.run.stdout,
      stderr: res.run.stderr,
      timedOut: res.run.signal === "SIGKILL" || res.run.code === null,
    };
  } catch {
    return { error: "Sandbox indisponível (timeout/conexão)." };
  }
}

/**
 * Runs untrusted player code against the problem's test cases. Never throws
 * — any failure becomes a non-accepted result so a flaky sandbox can't crash
 * the room. Backend is Piston (prod); the local runner is a DEV-ONLY escape
 * hatch behind JUDGE_LOCAL_FALLBACK and never engages in production.
 */
export async function judge(
  problem: Problem,
  code: string,
  playerId: string,
  attemptsLeft: number,
): Promise<JudgeResult> {
  const base = (n: Partial<JudgeResult>): JudgeResult => ({
    playerId,
    accepted: false,
    attemptsLeft,
    passed: 0,
    total: problem.testCases.length,
    message: "",
    failure: null,
    ...n,
  });

  const script = buildRunnerScript(problem, code);
  const run = env.JUDGE_LOCAL_FALLBACK ? await runLocal(script) : await runPiston(script);

  if ("error" in run) return base({ message: run.error });

  const parsed = parseHarnessOutput(run.stdout);
  if (!parsed) {
    const stderr = run.stderr?.trim();
    return base({
      message: run.timedOut
        ? "Tempo limite excedido."
        : stderr
          ? `Erro: ${stderr.slice(0, 300)}`
          : "Não foi possível avaliar a submissão.",
    });
  }

  if (parsed.error) {
    return base({ message: parsed.error, passed: parsed.passed, failure: parsed.failure ?? null });
  }

  return base({
    accepted: parsed.ok,
    passed: parsed.passed,
    failure: parsed.failure ?? null,
    message: parsed.ok ? "Aceito ✅" : `Falhou em ${parsed.passed}/${parsed.total} casos.`,
  });
}

export { MAX_ATTEMPTS };
