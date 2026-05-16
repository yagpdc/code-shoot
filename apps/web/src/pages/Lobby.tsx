import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../auth.js";

export function Lobby() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  if (isPending) return <div className="card">Carregando…</div>;
  if (!session) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="card lobby">
      <p className="who">
        Logado como <strong>{session.user.name}</strong>
      </p>
      <h1>Pronto pra duelar?</h1>
      <p className="muted">
        Você e mais um jogador recebem o mesmo problema. 3 tentativas cada. Quem acertar primeiro
        atira no outro.
      </p>
      <button type="button" className="primary big" onClick={() => navigate("/duel")}>
        Procurar duelo
      </button>
      <button type="button" className="link" onClick={() => signOut()}>
        Sair
      </button>
    </div>
  );
}
