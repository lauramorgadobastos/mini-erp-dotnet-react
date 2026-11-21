#  StockFlow Front-end — Interface Web

Interface web do Mini-ERP **StockFlow**, construída com **React**, **TypeScript** e **Vite**, com estilização via **Bootstrap** e **Bootstrap Icons** para consumir a **StockFlow.Api**.

---

##  Tecnologias e Bibliotecas

- **Biblioteca UI:** React
- **Linguagem:** TypeScript
- **Build & Dev Server:** Vite
- **Estilização e Ícones:** `bootstrap` e `bootstrap-icons`
- **Qualidade de Código:** ESLint

---

## Estrutura do Front-end

A aplicação fica organizada em `src/front/`:

```text
src/front/
├── public/               # Arquivos estáticos públicos
├── src/
│   ├── assets/           # Estilos globais e tokens visuais
│   ├── components/       # Componentes reutilizáveis (layout, modais, tabelas)
│   ├── pages/            # Telas principais (Dashboard, Produtos, Movimentações, Financeiro)
│   ├── services/         # Cliente HTTP e serviços de comunicação com a API
│   ├── types/            # Interfaces e tipos TypeScript
│   ├── App.tsx           # Estrutura principal e navegação entre módulos
│   └── main.tsx          # Ponto de entrada e importação de estilos globais
├── .env.example          # Modelo de variáveis de ambiente do front-end
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
### Como Executar Localmente
#### Pré-requisitos

* Node.js (versão LTS recomendada) e npm.
* StockFlow.Api em execução (por padrão em http://localhost:5000, conforme configurado no back-end).

### Configuração Local (.env.example → .env)

1. Copie .env.example para .env dentro de src/front/:

```bash
cd src/front
Copy-Item .env.example .env
```

2. Garanta que VITE_API_URL no .env aponta para a URL da API (ex.: VITE_API_URL=http://localhost:5000). O arquivo .env deve permanecer ignorado pelo .gitignore.

### Instalação, Desenvolvimento, Build e Lint

Dentro de src/front:

```bash
npm install
npm run dev
```

Para validar a compilação TypeScript/Vite e as regras de lint:

```bash
npm run build
npm run lint
```