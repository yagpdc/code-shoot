import { getProblem, listPublicProblems } from "@code-shoot/problems";
import { toPublicProblem } from "@code-shoot/shared";
import { Router } from "express";

export const problemsRouter: Router = Router();

problemsRouter.get("/problems", (_req, res) => {
  res.json(listPublicProblems());
});

problemsRouter.get("/problems/:id", (req, res) => {
  const problem = getProblem(req.params.id);
  if (!problem) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(toPublicProblem(problem));
});
