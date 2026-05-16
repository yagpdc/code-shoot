import type { Problem } from "@code-shoot/shared";

export const validParentheses: Problem = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "medium",
  functionName: "isValid",
  prompt: [
    "Dada uma string `s` contendo apenas `()[]{}`, retorne `true` se",
    "todos os parênteses estiverem corretamente fechados e na ordem",
    "certa, e `false` caso contrário.",
  ].join("\n"),
  starterCode: "function isValid(s) {\n  // seu código aqui\n}\n",
  sampleCount: 2,
  testCases: [
    { input: ["()"], expected: true },
    { input: ["()[]{}"], expected: true },
    { input: ["(]"], expected: false },
    { input: ["([)]"], expected: false },
    { input: ["{[]}"], expected: true },
    { input: [""], expected: true },
  ],
};
