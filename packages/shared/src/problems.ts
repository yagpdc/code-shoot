export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  /** Positional arguments passed to the solution function. */
  input: unknown[];
  expected: unknown;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Markdown statement shown to the player. */
  prompt: string;
  /** Global function name the player's code must define. */
  functionName: string;
  /** Starter code prefilled in the editor. */
  starterCode: string;
  /** All cases. The first `sampleCount` are revealed to the player. */
  testCases: TestCase[];
  sampleCount: number;
}

/** Problem as exposed over the wire — hidden cases stripped. */
export interface PublicProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  prompt: string;
  functionName: string;
  starterCode: string;
  samples: TestCase[];
  totalCases: number;
}

export function toPublicProblem(p: Problem): PublicProblem {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    prompt: p.prompt,
    functionName: p.functionName,
    starterCode: p.starterCode,
    samples: p.testCases.slice(0, p.sampleCount),
    totalCases: p.testCases.length,
  };
}
