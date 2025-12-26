# Backend Node + Prisma

API em Node/Express para o schema Prisma existente (`schema.prisma`), usando PostgreSQL.

## Requisitos
- Node 18+
- PostgreSQL acessível (ajuste `DATABASE_URL` em `.env`)

## Primeiros passos
1. `cp .env.example .env` e ajuste `DATABASE_URL`/`SHADOW_DATABASE_URL`/`JWT_SECRET`/`PORT`.
2. `npm install`
3. `npm run prisma:generate` (gera o cliente Prisma a partir de `schema.prisma`)
4. Opcional: `npm run prisma:migrate` (cria/atualiza o banco) ou importe `dump.sql`.
5. Desenvolvimento: `npm run dev`
6. Produção: `npm run build && npm start`

## Rotas
Rotas REST genéricas montadas em `/api/:model`. Use o nome do modelo Prisma em camelCase (singular), exemplos:
- `user`, `agency`, `proposal`, `proposalService`, `task`, `agencyEmail`, `agencySubscription`, `agencyWhatsappConfig`, `proposalTag` etc.

### Operações suportadas
- `GET /api/:model` — lista. Query params opcionais:  
  - `where`, `orderBy`, `select`, `include` como JSON (ex.: `?where={"agencyId":"<uuid>"}`)  
  - `take`, `skip` (números)  
  - `withCount=true` para incluir `total`
- `GET /api/:model/:id` — busca por chave primária (modelos com `id`).  
  - `include`/`select` via query JSON.
- `POST /api/:model` — cria (corpo JSON com campos do modelo).
- `PUT /api/:model/:id?` — atualiza por chave primária (aceita `id` na rota ou `where` no corpo).
- `DELETE /api/:model/:id?` — remove por chave primária.

### Chaves compostas
`proposalTag` usa chave primária composta (`proposalId`, `tagId`). Informe ambos via query (`?proposalId=...&tagId=...`) ou no corpo (`where: { proposalId, tagId }`) para `GET`/`PUT`/`DELETE`.

## Autenticação
- `POST /auth/login` — body `{ email, password }`. Retorna `{ token, user, profile, agency }`.
- `GET /auth/me` — requer `Authorization: Bearer <token>` e devolve os mesmos dados do login.
- `JWT_SECRET` define a chave usada no token (default de dev caso não informado).

## Scripts úteis
- `npm run prisma:studio` — abre o Prisma Studio usando o schema atual.
- `npm run prisma:migrate` — roda migrations com `schema.prisma` na raiz do backend.

## Estrutura
- `src/app.ts` — instancia do Express + middlewares básicos.
- `src/server.ts` — inicialização do servidor.
- `src/routes/modelRouter.ts` — CRUD genérico para todos os modelos do schema.
- `src/prisma/client.ts` — cliente Prisma configurado (com logs em dev).
- `src/middleware/errorHandler.ts` — tratamento de erros/Prisma.
- `src/config/env.ts` — carga de variáveis de ambiente.
