import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface RawRun {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/**
 * DEV-ONLY judge backend. Runs the runner script in a throwaway `node`
 * child process with a hard timeout and a small heap cap. This is NOT a
 * real sandbox (no syscall/network isolation) — prod always uses Piston.
 * Gated behind JUDGE_LOCAL_FALLBACK so it can never run in production.
 */
export async function runLocal(script: string): Promise<RawRun> {
  const dir = await mkdtemp(join(tmpdir(), "codeshoot-"));
  const file = join(dir, "main.js");
  try {
    await writeFile(file, script, "utf8");
    const { stdout, stderr } = await run("node", ["--max-old-space-size=128", file], {
      cwd: dir,
      timeout: 6000,
      killSignal: "SIGKILL",
      maxBuffer: 1024 * 1024,
      env: { PATH: process.env.PATH ?? "" },
    });
    return { stdout, stderr, timedOut: false };
  } catch (e) {
    const err = e as { killed?: boolean; signal?: string; stdout?: string; stderr?: string };
    const timedOut = err.killed === true || err.signal === "SIGKILL";
    return { stdout: err.stdout ?? "", stderr: err.stderr ?? "", timedOut };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
