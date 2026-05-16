import { createServer } from "node:http";
import { DUEL_ROOM } from "@code-shoot/shared";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { toNodeHandler } from "better-auth/node";
import { Server } from "colyseus";
import cors from "cors";
import express from "express";
import { problemsRouter } from "./api/problems.js";
import { auth } from "./auth.js";
import { env } from "./env.js";
import { DuelRoom } from "./rooms/DuelRoom.js";

const app = express();

app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

// Better Auth must be mounted BEFORE express.json(): it parses the request
// body itself and a prior json() middleware would consume the stream.
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", problemsRouter);

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});
gameServer.define(DUEL_ROOM, DuelRoom);

httpServer.listen(env.PORT, () => {
  console.log(`[code-shoot] server on http://localhost:${env.PORT}`);
});
