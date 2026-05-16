import { Client } from "colyseus.js";

export const gameClient = new Client(import.meta.env.VITE_COLYSEUS_URL);
