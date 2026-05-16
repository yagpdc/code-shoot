import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authClient, signIn, signUp, useSession } from "../auth.js";

export function Login() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session?.user) return <Navigate to="/lobby" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === "in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: name || email });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Falhou. Confira os dados.");
      return;
    }
    navigate("/lobby", { replace: true });
  }

  return (
    <div className="card auth">
      <h1>{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <form onSubmit={onSubmit}>
        {mode === "up" && (
          <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input
          type="email"
          placeholder="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="senha"
          value={password}
          required
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "..." : mode === "in" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        type="button"
        className="ghost"
        onClick={() =>
          authClient.signIn.social({
            provider: "github",
            callbackURL: `${window.location.origin}/lobby`,
          })
        }
      >
        Entrar com GitHub
      </button>

      <button type="button" className="link" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
