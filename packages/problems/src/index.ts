import { type Problem, type PublicProblem, toPublicProblem } from "@code-shoot/shared";
import { fizzBuzz } from "./list/fizzbuzz.js";
import { twoSum } from "./list/two-sum.js";
import { validParentheses } from "./list/valid-parentheses.js";

export { buildRunnerScript, parseHarnessOutput, RESULT_MARKER } from "./harness.js";
export type { HarnessResult } from "./harness.js";

const REGISTRY: Problem[] = [twoSum, fizzBuzz, validParentheses];

const BY_ID = new Map(REGISTRY.map((p) => [p.id, p]));

export function getProblem(id: string): Problem | undefined {
  return BY_ID.get(id);
}

export function listPublicProblems(): PublicProblem[] {
  return REGISTRY.map(toPublicProblem);
}

export function randomProblem(difficulty?: Problem["difficulty"]): Problem {
  const pool = difficulty ? REGISTRY.filter((p) => p.difficulty === difficulty) : REGISTRY;
  const list = pool.length > 0 ? pool : REGISTRY;
  return list[Math.floor(Math.random() * list.length)]!;
}
