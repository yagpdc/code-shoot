import type { Problem } from "@code-shoot/shared";

/** Marker the judge greps for in Piston stdout to find the result line. */
export const RESULT_MARKER = "__CODESHOOT_RESULT__";

export interface HarnessResult {
  ok: boolean;
  passed: number;
  total: number;
  error?: string;
  failure?: { input: unknown[]; expected: unknown; got: unknown };
}

/**
 * Builds the script sent to Piston: the player's code, plus a runner that
 * invokes their function against every test case and prints one JSON line
 * prefixed with RESULT_MARKER. Test cases are embedded so the sandbox needs
 * no stdin and no network.
 */
export function buildRunnerScript(problem: Problem, userCode: string): string {
  const cases = JSON.stringify(problem.testCases);
  const fn = JSON.stringify(problem.functionName);

  // The runner is appended AFTER user code so a top-level `function foo(){}`
  // declaration is in scope by name. Output goes to stderr-safe stdout line.
  return `${userCode}
;(function(){
  "use strict";
  function eq(a, b){
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === "object") {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      var ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (var i = 0; i < ka.length; i++) {
        var k = ka[i];
        if (!eq(a[k], b[k])) return false;
      }
      return true;
    }
    return false;
  }
  var TESTS = ${cases};
  var NAME = ${fn};
  var fn = null;
  try {
    fn = (typeof globalThis[NAME] === "function") ? globalThis[NAME] : eval(NAME);
  } catch (e) {
    fn = null;
  }
  var out = { ok: false, passed: 0, total: TESTS.length };
  if (typeof fn !== "function") {
    out.error = "Função '" + NAME + "' não foi definida.";
    console.log("${RESULT_MARKER}" + JSON.stringify(out));
    return;
  }
  for (var t = 0; t < TESTS.length; t++) {
    var tc = TESTS[t];
    var got;
    try {
      got = fn.apply(null, tc.input);
    } catch (e) {
      out.error = "Erro em runtime: " + (e && e.message ? e.message : String(e));
      out.failure = { input: tc.input, expected: tc.expected, got: null };
      console.log("${RESULT_MARKER}" + JSON.stringify(out));
      return;
    }
    if (eq(got, tc.expected)) {
      out.passed++;
    } else {
      out.failure = { input: tc.input, expected: tc.expected, got: got };
      console.log("${RESULT_MARKER}" + JSON.stringify(out));
      return;
    }
  }
  out.ok = true;
  console.log("${RESULT_MARKER}" + JSON.stringify(out));
})();
`;
}

/** Extracts the harness result from raw Piston stdout. */
export function parseHarnessOutput(stdout: string): HarnessResult | null {
  const idx = stdout.lastIndexOf(RESULT_MARKER);
  if (idx === -1) return null;
  const line = stdout
    .slice(idx + RESULT_MARKER.length)
    .split("\n")[0]
    ?.trim();
  if (!line) return null;
  try {
    return JSON.parse(line) as HarnessResult;
  } catch {
    return null;
  }
}
