# GEMINI.MD: Guia de Desenvolvimento para o "POCKET"

Este documento serve como o mapa mestre e guia de diretrizes para o desenvolvimento da inteligência artificial no projeto POCKET. Ele consolida a arquitetura, as restrições técnicas e a visão de produto.

## 1. Visão Geral do Projeto

- **Nome do Projeto:** POCKET
- **Conceito:** Um ecossistema de gestão financeira premium, focado em consolidar Contas, Investimentos, Dívidas e Objetivos.
- **Arquitetura:** Cloud-First com inteligência artificial integrada via API.

## 2. Stack de Tecnologias

- **Framework Principal:** **Next.js 15** (App Router).
- **Estilização:** **Tailwind CSS v4** (Design System Premium e Fluído).
- **Banco de Dados:** **SQLite** com **Prisma ORM**.
- **Inteligência Artificial:** **Ollama** (Modelo: `gemini-3-flash-preview` ou similar rodando localmente).
- **Processamento de PDF:** **pdfjs-dist** (via script isolado para evitar erros de worker).

## 3. Arquitetura e Restrições Críticas

### 3.1. Banco de Dados (Regra de Ouro)
- **Fallback para Raw SQL:** Devido a restrições de permissão de arquivo no Windows (`EPERM`), o cliente Prisma pode ficar fora de sincronia. **Sempre utilize `prisma.$queryRaw` e `prisma.$executeRaw`** para operações de escrita e leitura nas rotas de API.
- **Nomes Reservados:** A tabela `"Transaction"` deve sempre ser referenciada entre aspas duplas em consultas SQL puras por ser uma palavra reservada no SQLite.
- **Sintaxe:** NUNCA utilize syntax de PostgreSQL (ex: `::timestamp`). Utilize apenas parâmetros puros compatíveis com SQLite.

### 3.2. Interface (UI/UX)
- **Layout "Single-View":** O dashboard deve ocupar `100vh` fixos, utilizando scroll interno para listas. O objetivo é evitar o scroll global da página e a sensação de "zoom".
- **Design System:** Bordas extremamente arredondadas (`rounded-[2.5rem]`), tipografia fluída com `clamp()`, cores sóbrias (Preto, Branco, tons de Cinza) e micro-interações de hover.
- **Responsividade Desktop:** Foco total em adaptatividade para diferentes resoluções de monitor, priorizando a densidade de informação sem espremer os elementos.

### 3.3. Motor de Importação (PDF 3.0)
- **Isolamento:** A extração de texto de PDFs deve ser feita via processo externo (`scripts/extract-pdf.js`) para evitar falhas de módulos e workers no ambiente do Next.js.
- **Deduplicação:** Toda transação importada deve gerar um hash `externalId` (Data + Descrição + Valor + Conta) para impedir registros duplicados.

## 4. Integração com IA (Ollama)

- **Princípio Fundamental:** **Privacidade e Inteligência Local.** O processamento de dados sensíveis e a inteligência artificial (IA) devem ocorrer localmente usando o Ollama, garantindo que os dados financeiros do usuário nunca saiam de sua máquina.
- **Categorização Evolutiva:** A IA tem permissão para criar novas categorias no banco de dados se a transação importada não se encaixar nas existentes.
- **Insights Sob Demanda:** O módulo **Pocket AI Lab** deve fornecer análises financeiras apenas quando solicitado pelo usuário, respeitando sua autonomia.

## 5. Diretrizes de Código

- **Idioma:** Responda sempre em **Português do Brasil**.
- **Qualidade:** Código real, completo e funcional. Proibido o uso de placeholders ou simplificações.
- **IDs Únicos:** Utilizar geradores robustos (`crypto.randomUUID()`) para todas as chaves primárias.

---
*Este documento deve ser atualizado sempre que uma nova decisão arquitetural de alto impacto for tomada.*