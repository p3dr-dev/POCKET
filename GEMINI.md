# GEMINI.MD: Guia de Desenvolvimento para o "POCKET"

Este documento serve como o mapa mestre e guia de diretrizes para o desenvolvimento da inteligência artificial no projeto POCKET. Ele consolida a arquitetura, as restrições técnicas e a visão de produto.

## 1. Visão Geral do Projeto

- **Nome do Projeto:** POCKET
- **Conceito:** Um ecossistema de gestão financeira premium, focado em consolidar Contas, Investimentos, Dívidas e Objetivos.
- **Princípio Fundamental:** **Soberania de Dados e Inteligência.** O processamento é otimizado para nuvem (Vercel + Supabase) mantendo a capacidade de integração com IA local ou remota via Ollama.

## 2. Stack de Tecnologias

- **Framework Principal:** **Next.js 15** (App Router).
- **Estilização:** **Tailwind CSS v4** (Design System Premium e Fluído).
- **Banco de Dados:** **PostgreSQL** hospedado no **Supabase**.
- **ORM:** **Prisma ORM**.
- **Inteligência Artificial:** **Ollama** (Modelo: `gemini-3-flash-preview`).
- **Processamento de PDF:** **pdfjs-dist** (via script isolado para extração robusta).

## 3. Arquitetura e Restrições Críticas

### 3.1. Banco de Dados (Regra de Ouro v2)
- **Preferência pelo Prisma Client:** Devido à migração para PostgreSQL (Supabase), o uso do **Prisma Client (`prisma.user.create`, etc.) é mandatório para operações de ESCRITA**. Isso garante compatibilidade de tipos, tratamento de datas e segurança nativa contra injeção.
- **Raw SQL para Consultas Complexas:** O uso de `prisma.$queryRaw` é permitido para consultas de leitura que exijam alta performance ou cálculos complexos (como balanços em tempo real), mas deve ser evitado para inserções simples.
- **Ambiente Vercel:** O projeto é otimizado para execução *serverless*. NUNCA dependa do sistema de arquivos local (`fs`) para persistência de dados.

### 3.2. Interface (UI/UX)
- **Layout "Single-View":** O dashboard deve ocupar `100vh` fixos, utilizando scroll interno para listas. O objetivo é evitar o scroll global da página e manter a densidade visual.
- **Design System:** Bordas extremamente arredondadas (`rounded-[2.5rem]`), tipografia fluída com `clamp()`, cores sóbrias (Preto, Branco, tons de Cinza) e micro-interações de hover.
- **Segurança Global:** Utilizar o wrapper `secureFetch` no frontend para garantir tratamento de erros 401/403 e feedback via `toast`.

### 3.3. Motor de Importação (PDF 3.0)
- **Isolamento:** A extração de texto de PDFs deve ser feita via processo externo (`scripts/extract-pdf.js`) para evitar falhas de módulos e workers no ambiente do Next.js.
- **Deduplicação:** Toda transação importada deve gerar um hash `externalId` único para impedir registros duplicados.

## 4. Integração com IA (Ollama)

- **Categorização Evolutiva:** A IA tem permissão para sugerir ou criar novas categorias no banco de dados se a transação importada não se encaixar nas existentes.
- **Insights Sob Demanda:** O módulo **Pocket AI Lab** deve fornecer análises financeiras apenas quando solicitado, respeitando a autonomia do usuário.
- **Parsing Resiliente:** As rotas de IA devem utilizar técnicas de limpeza de JSON e *smart-matching* para lidar com variações nas respostas do modelo.

## 5. Diretrizes de Código

- **Idioma:** Responda sempre em **Português do Brasil**.
- **Qualidade:** Código real, completo e funcional. Proibido o uso de placeholders ou simplificações que quebrem a lógica financeira.
- **Segurança:** Sempre validar a propriedade de IDs (`userId`, `accountId`) antes de qualquer mutação no banco de dados.

---
*Este documento deve ser atualizado sempre que uma nova decisão arquitetural de alto impacto for tomada.*
