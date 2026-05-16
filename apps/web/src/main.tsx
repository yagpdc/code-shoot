import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App.js";
import { Duel } from "./pages/Duel.js";
import { Lobby } from "./pages/Lobby.js";
import { Login } from "./pages/Login.js";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Navigate to="/lobby" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/duel" element={<Duel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
