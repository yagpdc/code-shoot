import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { buildRunnerScript, parseHarnessOutput } from "./harness.js";
import { twoSum } from "./list/two-sum.js";

/**
 * Runs the generated runner script in a fresh isolated VM context and
 * captures its stdout — mirrors Piston's one-process-per-submission so
 * globals never leak between cases.
 */
function runLocally(code: string): string {
  const lines: string[] = [];
  const sandbox: Record<string, unknown> = {
    console: { log: (...args: unknown[]) => lines.push(args.join(" ")) },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 2000 });
  return lines.join("\n");
}

describe("judge harness", () => {
  it("accepts a correct solution", () => {
    const solution =
      "function twoSum(nums, target){const m={};for(let i=0;i<nums.length;i++){const n=target-nums[i];if(m[n]!==undefined)return [m[n],i];m[nums[i]]=i;}}";
    const result = parseHarnessOutput(runLocally(buildRunnerScript(twoSum, solution)));
    expect(result?.ok).toBe(true);
    expect(result?.passed).toBe(twoSum.testCases.length);
  });

  it("reports the first failing case", () => {
    const wrong = "function twoSum(){ return [9,9]; }";
    const result = parseHarnessOutput(runLocally(buildRunnerScript(twoSum, wrong)));
    expect(result?.ok).toBe(false);
    expect(result?.failure).toBeTruthy();
  });

  it("reports a missing function", () => {
    const result = parseHarnessOutput(runLocally(buildRunnerScript(twoSum, "const x = 1;")));
    expect(result?.ok).toBe(false);
    expect(result?.error).toContain("twoSum");
  });

  it("captures runtime errors", () => {
    const boom = "function twoSum(){ throw new Error('boom'); }";
    const result = parseHarnessOutput(runLocally(buildRunnerScript(twoSum, boom)));
    expect(result?.ok).toBe(false);
    expect(result?.error).toContain("boom");
  });
});
