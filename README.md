# code-shoot

Duelo de programação competitivo em tempo real. Dois jogadores entram numa
sala, recebem o mesmo problema (estilo LeetCode), têm **3 tentativas** cada.
O servidor é autoritativo: ele roda o juiz num sandbox isolado, conta as
tentativas e decide o vencedor. Quem acerta primeiro "atira" no outro e
encerra a partida. Caminho previsto: 2 jogadores → battle royale (até ~20).

## Stack

| Camada | Tech |
|---|---|
| Multiplayer | Colyseus (salas autoritativas, matchmaking, reconexão) |
| Sandbox de código | Piston self-hosted (Docker, isolado) |
| Front | React + Vite + TypeScript + Monaco |
| Auth | Better Auth (email/senha + GitHub OAuth opcional) |
| Banco | Postgres + Drizzle ORM |
| Monorepo | pnpm workspaces + Biome + Vitest |

```
apps/web        React + Vite + Monaco (login → lobby → sala → tiro)
apps/server     Colyseus + REST (problemas) + Better Auth + juiz Piston
packages/shared contrato cliente↔servidor + tipos de problema
packages/problems  banco de problemas (seed) + harness do juiz
```

## Rodar local

Pré-requisito: **Docker Desktop aberto** (Postgres + Piston), Node 22, pnpm.

```bash
pnpm install
cp .env.example .env          # ajuste o BETTER_AUTH_SECRET
docker compose up -d          # postgres + piston

# Piston começa VAZIO — instale o pacote node UMA vez (ver abaixo)
pnpm db:push                  # cria as tabelas (Drizzle)
pnpm dev                      # server (2567) + web (5173) em paralelo
```

### Piston

`PISTON_URL` é a **base da API, incluindo o segmento de versão**, e o juiz
chama `${PISTON_URL}/execute`.

**Prod / Linux (self-hosted via docker-compose):** o container sobe sem
nenhuma linguagem — instale o Node uma vez:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H 'Content-Type: application/json' \
  -d '{"language":"node","version":"20.11.1"}'
```

Aí `PISTON_URL=http://localhost:2000/api/v2` e `PISTON_NODE_VERSION=20.11.1`.
Confirme com `curl http://localhost:2000/api/v2/runtimes`.

**Dev no Windows:** o Docker Desktop não roda o Piston (precisa de cgroup v2
com controllers delegados). Use a instância pública — sem mudança de código:

```
PISTON_URL=https://emkc.org/api/v2/piston
PISTON_NODE_VERSION=18.15.0
```

(É um artefato só do Docker Desktop/Windows; no host Linux do deploy o
Piston self-hosted roda nativo.)

## Estado (Fase 0)

- [x] Monorepo + tooling + CI
- [x] Sala autoritativa de duelo 2 jogadores (relógio, 3 tentativas, vencedor)
- [x] Juiz JS/TS via Piston contra casos de teste
- [x] Contas (Better Auth) — login amarrado na entrada da sala
- [x] Lobby com matchmaking simples + animação do tiro
- [ ] Ranking / histórico (schema já contempla `match`)
- [ ] Battle royale (N jogadores) — sala já é genérica em N
- [ ] Problemas de CSS (pipeline de juiz separado) — fase 2
