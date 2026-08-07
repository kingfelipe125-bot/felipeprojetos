# Gerenciador de Versões de Projetos (CAD/BIM)

Aplicação web para controle de revisões de plantas de arquitetura e engenharia, com validação em campo via QR Code. Garante que equipes de canteiro de obras sempre acessem a versão mais recente e aprovada de cada folha, evitando retrabalho por uso de revisões obsoletas.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, componentes estilo shadcn/ui, ícones Lucide React
- **Backend:** Next.js API Routes + Prisma ORM
- **Banco de dados:** SQLite (dev local). Para produção, troque `provider` para `postgresql` em `prisma/schema.prisma` e ajuste `DATABASE_URL`
- **Armazenamento de arquivos:** simulado em `public/uploads` (`src/lib/storage.ts`) — troque por Supabase Storage/S3 em produção mantendo a mesma assinatura de retorno
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

```bash
npm install
cp .env.example .env          # ajuste se necessário
npx prisma migrate dev         # cria o banco SQLite e as tabelas
npm run db:seed                # popula dados de demonstração
npm run dev
```

Acesse http://localhost:3000.

### Dados de demonstração

O seed (`prisma/seed.ts`) cria 2 projetos, 4 usuários e documentos em diferentes estágios do workflow — incluindo um documento com uma revisão obsoleta e outra aprovada, para testar o fluxo de QR Code imediatamente. Os códigos de verificação gerados são exibidos no terminal ao final do seed (`/v/<code>`).

## Estrutura principal

```
prisma/schema.prisma        Modelo de dados (User, Project, Document, DocumentVersion, AuditLog)
prisma/seed.ts               Dados de demonstração
src/app/                     Páginas (dashboard, projeto, documento, /v/[code]) e API routes
src/components/              Componentes de UI e formulários
src/lib/                     Prisma client, constantes de workflow, storage, QR code, verificação
```
