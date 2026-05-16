import type { Problem } from "@code-shoot/shared";

export const fizzBuzz: Problem = {
  id: "fizzbuzz",
  title: "Fizz Buzz",
  difficulty: "easy",
  functionName: "fizzBuzz",
  prompt: [
    "Retorne um array de strings `1..n` onde:",
    "",
    '- múltiplos de 3 viram `"Fizz"`',
    '- múltiplos de 5 viram `"Buzz"`',
    '- múltiplos de 3 e 5 viram `"FizzBuzz"`',
    "- os demais viram o próprio número como string",
  ].join("\n"),
  starterCode: "function fizzBuzz(n) {\n  // seu código aqui\n}\n",
  sampleCount: 1,
  testCases: [
    { input: [3], expected: ["1", "2", "Fizz"] },
    { input: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
    {
      input: [15],
      expected: [
        "1",
        "2",
        "Fizz",
        "4",
        "Buzz",
        "Fizz",
        "7",
        "8",
        "Fizz",
        "Buzz",
        "11",
        "Fizz",
        "13",
        "14",
        "FizzBuzz",
      ],
    },
  ],
};
