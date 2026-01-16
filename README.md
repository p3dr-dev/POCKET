# POCKET - Gestão Financeira Premium

Ecossistema de gestão financeira focado em privacidade, inteligência local e interface de alta performance.

## 🚀 Como subir para Produção (Vercel)

O POCKET foi desenhado para rodar localmente, garantindo que seus dados nunca saiam da sua máquina. Para implantar na Vercel, siga estas diretrizes:

### 1. Banco de Dados (Produção)
Para manter seus dados persistentes na Vercel, recomendamos o uso do **Turso** (SQLite na borda) ou **Vercel Postgres**.
- **Turso (Recomendado):** Mantém a compatibilidade com o motor SQLite mas oferece persistência em nuvem. 
  1. Crie um banco no Turso.
  2. Altere o provider para `libsql` (requer `@prisma/adapter-libsql`).
  3. Configure a `DATABASE_URL` na Vercel.
- **Vercel Postgres:** Altere o provider no `schema.prisma` para `postgresql`.

### 2. Inteligência Artificial (Ollama)
A IA roda localmente por padrão. Para produção:
- Configure a variável de ambiente `OLLAMA_URL` na Vercel.
- Você pode utilizar um túnel (como Cloudflare Tunnel ou Ngrok) para expor seu Ollama local de forma segura para o app na Vercel.

### 3. Backup e Segurança
Utilize a aba de **Configurações** no app para exportar backups periódicos em JSON. Isso garante que você tenha seus dados mesmo em caso de falha no banco de dados de nuvem.

### 3. Variáveis de Ambiente
Configure as seguintes variáveis na Vercel:
- `DATABASE_URL`: `file:./dev.db` (para SQLite) ou sua string de conexão Postgres.
- `OLLAMA_URL`: URL do seu motor de IA.

## 🛠️ Instalação Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Sincronize o banco: `npx prisma db push`
4. Inicie o app: `npm run dev`

---
Desenvolvido com foco em UX Premium e Soberania de Dados.