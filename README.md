# Gerenciador de Versões de Projetos (CAD/BIM)

Aplicação web para controle de revisões de plantas de arquitetura e engenharia, com validação em campo via QR Code. Garante que equipes de canteiro de obras sempre acessem a versão mais recente e aprovada de cada folha, evitando retrabalho por uso de revisões obsoletas.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, componentes estilo shadcn/ui, ícones Lucide React
- **Backend:** Next.js API Routes + Prisma ORM
- **Banco de dados:** PostgreSQL (compatível com qualquer provedor — Neon, Supabase, RDS, etc.)
- **Armazenamento de arquivos:** Vercel Blob em produção (quando `BLOB_READ_WRITE_TOKEN` está definido); fallback para disco local (`public/uploads`) em desenvolvimento — ver `src/lib/storage.ts`
- **QR Code:** geração via `qrcode`, verificação pública em `/v/[code]`

## Funcionalidades

- Projetos organizados por disciplina (Arquitetura, Estruturas, Elétrica, Hidráulica)
- Upload de revisões com numeração incremental automática (R00, R01, R02...)
- Workflow de aprovação: `Rascunho` → `Em Revisão` → `Aprovado para Obra` → `Obsoleto`
- Marcação automática da versão ativa; ao aprovar uma nova revisão, a anterior é marcada como obsoleta automaticamente
- QR Code exclusivo por versão, com página pública mobile-first (`/v/[code]`):
  - 🟢 Verde: versão mais recente aprovada
  - 🟡 Âmbar: documento ainda não aprovado para obra
  - 🔴 Vermelho: revisão obsoleta, indicando qual é a atual
- Log de auditoria (changelog) por documento: autor, data e motivo de cada alteração

## Como rodar localmente

Requer um banco PostgreSQL acessível (local, Docker, ou já um Neon/Supabase gratuito — pode ser o mesmo que você vai usar em produção).

```bash
npm install
cp .env.example .env            # edite DATABASE_URL com sua conexão Postgres
npm run db:push                  # cria as tabelas a partir do schema Prisma
npm run db:seed                  # popula dados de demonstração
npm run dev
```

Acesse http://localhost:3000.

### Dados de demonstração

O seed (`prisma/seed.ts`) cria 2 projetos, 4 usuários e documentos em diferentes estágios do workflow — incluindo um documento com uma revisão obsoleta e outra aprovada, para testar o fluxo de QR Code imediatamente. Os códigos de verificação gerados são exibidos no terminal ao final do seed (`/v/<code>`).

## Deploy público (Render — automático, um clique)

Este é o caminho mais simples: o repositório já inclui um `render.yaml` que cria o site **e** o banco de dados juntos, já conectados, e popula os dados de demonstração automaticamente — sem precisar copiar nenhuma connection string.

1. Crie uma conta em [render.com](https://render.com) (pode entrar direto com o GitHub).
2. No painel, clique em **New → Blueprint**.
3. Selecione o repositório `felipeprojetos`.
4. O Render lê o `render.yaml` e mostra o que vai criar (o app + um banco Postgres grátis). Clique em **Apply** (ou "Create New Resources").
5. Aguarde o build terminar (a barra de progresso mostra "Live" quando termina).

Pronto — a URL pública aparece no topo da página do serviço (algo como `https://cad-bim-version-manager.onrender.com`), já com os dados de demonstração carregados.

> **Nota:** o banco Postgres grátis do Render expira após 90 dias (o Render avisa por e-mail antes). Uploads de novas revisões funcionam, mas o plano grátis não tem disco persistente — arquivos enviados por usuários podem se perder se o serviço reiniciar. Para persistência total, seria necessário um plano pago com "Disk" ou trocar para um storage externo (mesma ideia do Vercel Blob, ver seção abaixo).

## Alternativa: Vercel + Neon

Este caminho dá mais controle (domínio, storage de arquivos com Vercel Blob), mas exige configurar 2-3 serviços separadamente.

### 1. Banco de dados (Neon — grátis)

1. Crie uma conta em [neon.tech](https://neon.tech) e um novo projeto/banco.
2. Copie a **connection string** (formato `postgresql://usuario:senha@host/banco?sslmode=require`).

### 2. Deploy do app (Vercel — grátis)

1. Crie uma conta em [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **Add New → Project** e selecione o repositório `felipeprojetos`.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → a connection string do Neon (passo anterior)
   - `NEXT_PUBLIC_APP_URL` → deixe em branco na primeira vez (a Vercel te dará o domínio depois do primeiro deploy); depois volte aqui e preencha com a URL final (ex: `https://seu-app.vercel.app`) e redeploy
4. Clique em **Deploy**. O comando de build já executa `prisma db push`, então as tabelas são criadas automaticamente — não precisa rodar migração manual.

### 3. Upload de arquivos em produção (Vercel Blob — grátis)

Sem isso, os uploads de novas revisões falham em produção (o disco da Vercel não é persistente).

1. No projeto na Vercel, vá em **Storage → Create Database → Blob**.
2. Conecte o Blob store ao projeto — a Vercel injeta `BLOB_READ_WRITE_TOKEN` automaticamente nas variáveis de ambiente.
3. Redeploy o projeto para a variável ser aplicada.

### 4. Popular dados de demonstração em produção (opcional)

Rode o seed localmente uma vez, apontando para o mesmo banco/blob de produção:

```bash
DATABASE_URL="<connection string do Neon>" BLOB_READ_WRITE_TOKEN="<token do Vercel Blob>" npm run db:seed
```

Depois disso, o link público (`https://seu-app.vercel.app`) já mostra os dados de exemplo para quem você enviar.

> **Nota:** o comando de build (`prisma db push --accept-data-loss`) sincroniza o schema automaticamente a cada deploy — ótimo para manter isso simples, mas se um dia remover uma coluna/tabela do schema, os dados dela são perdidos no próximo deploy. Para um projeto com mais gente usando de verdade, migre para `prisma migrate deploy` com migrations versionadas.

## Estrutura principal

```
prisma/schema.prisma        Modelo de dados (User, Project, Document, DocumentVersion, AuditLog)
prisma/seed.ts               Dados de demonstração
src/app/                     Páginas (dashboard, projeto, documento, /v/[code]) e API routes
src/components/              Componentes de UI e formulários
src/lib/                     Prisma client, constantes de workflow, storage, QR code, verificação
```
