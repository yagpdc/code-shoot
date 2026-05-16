import { Outlet } from "react-router-dom";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">
          code<span className="brand-accent">·shoot</span>
        </span>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
