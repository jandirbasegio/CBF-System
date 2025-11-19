# CBF Antidoping System
Projeto completo (frontend simples + backend serverless para Vercel + schema SQL) pronto para deploy.

## Estrutura
- /api - rotas serverless (Node.js ESM)
- /public - frontend (HTML/CSS/JS)
- schema.sql - criação de tabelas para Neon/Postgres
- package.json - dependências (para desenvolvimento local / testes)

## Variáveis de ambiente (defina no Vercel)
- DATABASE_URL - string de conexão Postgres (Neon)
- JWT_SECRET - segredo JWT

## Deploy Rápido no Vercel
1. Conecte este repositório ao Vercel.
2. Defina as variáveis de ambiente `DATABASE_URL` e `JWT_SECRET`.
3. Faça deploy — Vercel tratará `/api/*` como serverless functions.
4. Coloque o frontend em `/public` (Vercel serve arquivos estáticos).

## Como usar localmente (opcional)
- Para testar localmente com Node, instale dependências:
  ```
  npm install
  ```
- Use uma ferramenta para servir funções serverless ou adapte `server.js` (não incluído).
- Rode as queries do arquivo `schema.sql` no seu banco Postgres/Neon para criar tabelas.

