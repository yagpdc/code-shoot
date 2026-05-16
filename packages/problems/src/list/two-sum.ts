import type { Problem } from "@code-shoot/shared";

export const twoSum: Problem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "easy",
  functionName: "twoSum",
  prompt: [
    "Dado um array de inteiros `nums` e um inteiro `target`, retorne os",
    "**índices** dos dois números que somam `target`.",
    "",
    "Existe exatamente uma solução e você não pode usar o mesmo elemento",
    "duas vezes. Retorne os índices em ordem crescente.",
  ].join("\n"),
  starterCode: "function twoSum(nums, target) {\n  // seu código aqui\n}\n",
  sampleCount: 2,
  testCases: [
    { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { input: [[3, 2, 4], 6], expected: [1, 2] },
    { input: [[3, 3], 6], expected: [0, 1] },
    { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
    { input: [[0, 4, 3, 0], 0], expected: [0, 3] },
  ],
};
