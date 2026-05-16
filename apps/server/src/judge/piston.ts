import { buildRunnerScript, parseHarnessOutput } from "@code-shoot/problems";
import type { JudgeResult, Problem } from "@code-shoot/shared";
import { MAX_ATTEMPTS } from "@code-shoot/shared";
import { env } from "../env.js";

interface PistonResponse {
  run?: { stdout: string; stderr: string; code: number | null; signal: string | null };
  message?: string;
}

/**
 * Runs untrusted player code in the Piston sandbox against the problem's
 * test cases. Never throws — any failure becomes a non-accepted result so
 * a flaky sandbox can't crash the room.
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

  let res: PistonResponse;
  try {
    const r = await fetch(`${env.PISTON_URL}/api/v2/execute`, {
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
    if (!r.ok) {
      return base({ message: `Sandbox indisponível (HTTP ${r.status}).` });
    }
    res = (await r.json()) as PistonResponse;
  } catch {
    return base({ message: "Sandbox indisponível (timeout/conexão)." });
  }

  if (!res.run) {
    return base({ message: res.message ?? "Sandbox não executou o código." });
  }

  const parsed = parseHarnessOutput(res.run.stdout);
  if (!parsed) {
    const stderr = res.run.stderr?.trim();
    const timedOut = res.run.signal === "SIGKILL" || res.run.code === null;
    return base({
      message: timedOut
        ? "Tempo limite excedido."
        : stderr
          ? `Erro: ${stderr.slice(0, 300)}`
          : "Não foi possível avaliar a submissão.",
    });
  }

  if (parsed.error) {
    return base({
      message: parsed.error,
      passed: parsed.passed,
      failure: parsed.failure ?? null,
    });
  }

  return base({
    accepted: parsed.ok,
    passed: parsed.passed,
    failure: parsed.failure ?? null,
    message: parsed.ok ? "Aceito ✅" : `Falhou em ${parsed.passed}/${parsed.total} casos.`,
  });
}

export { MAX_ATTEMPTS };
