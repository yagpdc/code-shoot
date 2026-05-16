import { resolve } from "node:path";
import { config } from "dotenv";

// pnpm runs scripts with cwd = apps/server, but the .env lives at the
// monorepo root. Load that first; real process env still wins (dotenv
// never overrides already-set vars), so prod/docker is unaffected.
config({ path: resolve(process.cwd(), "../../.env") });
config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 2567),
  DATABASE_URL: required("DATABASE_URL"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:2567",
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? "",
  PISTON_URL: process.env.PISTON_URL ?? "http://localhost:2000/api/v2",
  PISTON_NODE_VERSION: process.env.PISTON_NODE_VERSION ?? "20.11.1",
  // DEV-ONLY: run submissions in a local child process instead of Piston.
  // Must never be "true" in production.
  JUDGE_LOCAL_FALLBACK: process.env.JUDGE_LOCAL_FALLBACK === "true",
};
