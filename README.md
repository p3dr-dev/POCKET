# POCKET - Gestão Financeira Premium

Ecossistema de gestão financeira focado em privacidade, inteligência local e interface de alta performance.

## 🚀 Como subir para Produção (Vercel)

O POCKET foi desenhado para rodar localmente, garantindo que seus dados nunca saiam da sua máquina. Para implantar na Vercel, siga estas diretrizes:

### 1. Banco de Dados (SQLite)
A Vercel possui um sistema de arquivos efêmero. Isso significa que **os dados salvos no SQLite serão perdidos** toda vez que o servidor reiniciar ou houver um novo deploy.
- **Recomendação:** Para uso web persistente, altere o `provider` no `schema.prisma` para `postgresql` e utilize um serviço como Supabase ou Neon.
- **Uso Local:** Continue usando `npm run dev` para manter seus dados salvos no arquivo `dev.db`.

### 2. Inteligência Artificial (Ollama)
A IA roda localmente. Para que a versão de produção funcione:
- Configure a variável de ambiente `OLLAMA_URL` na Vercel apontando para o IP/URL do seu servidor Ollama (se estiver acessível externamente).
- Por padrão, o app tentará se conectar em `http://localhost:11434`.

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