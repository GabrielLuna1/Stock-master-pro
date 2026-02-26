<div align="center">

```
███████╗████████╗ ██████╗  ██████╗██╗  ██╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
███████╗   ██║   ██║   ██║██║     █████╔╝ ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                            PRO
```

<br/>

**Plataforma Web Full-Stack de Gestão de Estoque e Inventário**

*Controle operacional preciso · Rastreabilidade completa · Inteligência financeira*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

[🔗 **Demo ao Vivo**](https://stock-master-pro-app.vercel.app) &nbsp;·&nbsp; [📋 Documentação](#-documentação) &nbsp;·&nbsp; [🚀 Instalação](#-instalação) &nbsp;·&nbsp; [🏗️ Arquitetura](#%EF%B8%8F-arquitetura)

</div>

---

## O Projeto

O **StockMaster Pro** é uma solução completa de **Mini ERP logístico** que une a robustez operacional do setor de almoxarifado com a experiência de usuário fluida de aplicações SaaS modernas.

Nasceu da necessidade real de um sistema que centralizasse em uma única interface todas as operações de estoque — desde o cadastro de produtos com código de barras até a baixa via QR Code pelo celular — com múltiplos níveis de acesso, auditoria completa e relatórios exportáveis em PDF e Excel.

> **Não é apenas um CRUD de produtos.** É uma plataforma com controle de acesso granular (RBAC), trilha de auditoria total e inteligência financeira em tempo real sobre os ativos físicos do negócio.

---

## ✨ Funcionalidades Principais

### ⚡ Saída Expressa por QR Code
Operadores dão baixa no estoque apontando a câmera do celular para a etiqueta gerada pelo sistema — sem digitar nada. Modo de operação contínua para processar múltiplas saídas em sequência.

### 📊 Dashboard Duplo — Estoque + Financeiro
Dois painéis alternáveis com um clique. A visão operacional mostra SKUs ativos, alertas de reposição e fluxo de movimentações. A visão financeira exibe patrimônio imobilizado, faturamento do mês, custo de reposição e potencial de venda total do estoque.

### 🔐 Controle de Acesso RBAC em 3 Níveis
Sistema de permissões granular com Operador, Administrador e Master. O usuário Master é **inviolável** — não pode ser excluído por nenhuma conta do sistema e possui poderes exclusivos como reset total e exclusão fantasma.

### 🏷️ Etiquetas QR Code 60×40mm
Geração e impressão de etiquetas físicas com QR Code único vinculado ao SKU, nome do produto e preço de venda. Compatível com qualquer impressora de etiquetas conectada.

### 👻 Exclusão Fantasma
Privilégio exclusivo do Master. Apaga registros da auditoria **sem gerar novos logs** — projetada para limpeza de ambiente de desenvolvimento sem contaminar trilhas de auditoria.

### 📱 Design 100% Responsivo
Funciona nativamente em smartphones e tablets via browser, sem instalação de aplicativo — essencial para operadores em movimento no almoxarifado.

---

## 📐 Módulos do Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STOCKMASTER PRO                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│   PAINEL     │   ESTOQUE    │  CATEGORIAS  │ FORNECEDORES │  USUÁRIOS   │
│  Dashboard   │  Inventário  │  Taxonomia   │  Parceiros   │    RBAC     │
│  Financeiro  │  QR Labels   │ Safe Delete  │   API CEP    │   Master    │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────┤
│                         LOGS & AUDITORIA                                 │
├─────────────────────────────────┬───────────────────────────────────────┤
│     CENTRAL DE MOVIMENTAÇÕES    │         AUDITORIA GERAL               │
│  Entradas · Saídas · Cadastros  │  LOGIN · LOGOUT · CRIAÇÃO · EDIÇÃO   │
│      Exportação por período     │      Exclusão Fantasma (Master)       │
├─────────────────────────────────┴───────────────────────────────────────┤
│                        SAÍDA EXPRESSA ⚡                                  │
│            Leitura de QR Code · Mobile First · Modo Contínuo            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Hierarquia de Permissões

```
┌─────────────────────────────────────────────────────────────┐
│                    NÍVEIS DE ACESSO                          │
├─────────────────────────┬──────────┬─────────┬──────────────┤
│       PERMISSÃO         │OPERADOR  │  ADMIN  │    MASTER    │
├─────────────────────────┼──────────┼─────────┼──────────────┤
│ Cadastrar produtos      │    ✓     │    ✓    │      ✓       │
│ Editar produtos         │    ✓     │    ✓    │      ✓       │
│ Excluir produtos        │    ✗     │    ✓    │      ✓       │
│ Saída Expressa (QR)     │    ✓     │    ✓    │      ✓       │
│ Cadastrar fornecedores  │    ✓     │    ✓    │      ✓       │
│ Excluir fornecedores    │    ✗     │    ✓    │      ✓       │
│ Gerenciar categorias    │    ✗     │    ✓    │      ✓       │
│ Gerenciar usuários      │    ✗     │    ✓    │      ✓       │
│ Ver Auditoria Geral     │    ✗     │    ✓    │      ✓       │
│ Exclusão Fantasma       │    ✗     │    ✗    │      ✓       │
│ Reset do Sistema        │    ✗     │    ✗    │      ✓       │
│ Pode ser excluído       │    ✓     │    ✓    │      ✗       │
└─────────────────────────┴──────────┴─────────┴──────────────┘
```

---

## 🏗️ Arquitetura

Aplicação **Full-Stack unificada** — Front-end, Back-end e APIs no mesmo repositório. As rotas de API são **Serverless Functions** que rodam sob demanda na Vercel, sem servidor dedicado 24/7.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│           React 19 · Tailwind CSS · Recharts                │
│         html5-qrcode · qrcode.react · jsPDF                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / Server Actions
┌───────────────────────▼─────────────────────────────────────┐
│                    NEXT.JS 16 (Vercel)                       │
│          App Router · Server Components · Turbopack          │
│         API Routes → Serverless Functions on Demand          │
│              NextAuth.js · Middleware RBAC                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose ODM
┌───────────────────────▼─────────────────────────────────────┐
│                   MONGODB ATLAS (Cloud)                      │
│    Users · Products · Categories · Suppliers · MovLogs      │
│                    AuditLogs · Sessions                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Core
| Tecnologia | Versão | Função |
|---|---|---|
| **Next.js** | 16.1.1 | Framework Full-Stack — App Router, Server Components, Turbopack |
| **TypeScript** | 5.9.3 | Tipagem estática — segurança em dados financeiros e de estoque |
| **React** | 19.2.3 | Biblioteca de UI — componentes, modais, tabelas, formulários |
| **Tailwind CSS** | 4.1.18 | Design system responsivo — consistência visual em toda a plataforma |
| **MongoDB Atlas** | Cloud | Banco NoSQL — flexível para objetos complexos de movimentação |
| **Mongoose** | 9.1.3 | ODM — Schemas rígidos para Usuários, Produtos e Movimentações |

### Segurança & Auth
| Tecnologia | Versão | Função |
|---|---|---|
| **NextAuth.js** | 4.24.13 | Sessões criptografadas + RBAC via Middleware |
| **bcryptjs** | 3.0.3 | Hash de senhas — nenhuma senha em texto puro no banco |
| **Nodemailer** | 7.0.13 | E-mails transacionais — recuperação de senha via SMTP |

### Relatórios & Exportação
| Tecnologia | Versão | Função |
|---|---|---|
| **jsPDF + autotable** | 4.0.0 / 5.0.7 | PDFs client-side — Inventário Físico e Movimentações |
| **ExcelJS** | 4.4.0 | Arquivos `.xlsx` — Relatório Mensal com formatação corporativa |
| **file-saver** | 2.0.5 | Download direto pelo browser |
| **PapaParse** | 5.5.3 | Importação de CSV em massa |

### QR Code & Etiquetas
| Tecnologia | Versão | Função |
|---|---|---|
| **html5-qrcode** | 2.3.8 | Saída Expressa — leitura via câmera sem hardware externo |
| **qrcode.react** | 4.2.0 | Geração de QR Codes vinculados ao SKU |
| **react-to-print** | 3.3.0 | Impressão direta de etiquetas pelo browser |

### Interface & Utilitários
| Tecnologia | Versão | Função |
|---|---|---|
| **Recharts** | 3.6.0 | Gráficos do Dashboard — Fluxo de Movimentação e Fluxo de Caixa |
| **Lucide React** | 0.562.0 | Sistema de ícones vetoriais |
| **Sonner** | 2.0.7 | Notificações toast — feedbacks de operação |
| **date-fns** | 4.1.0 | Manipulação de datas — timestamps e filtros de período |

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Conta no [MongoDB Atlas](https://www.mongodb.com/atlas) (ou instância local)
- Conta na [Vercel](https://vercel.com/) (para deploy)

### 1. Clone e instale

```bash
git clone https://github.com/GabrielLuna1/Stock-master-pro.git
cd stock-master-pro
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster.mongodb.net/stockmaster

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui

# Nodemailer (para recuperação de senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu@email.com
EMAIL_PASS=sua_senha_de_app
```

### 3. Rode em desenvolvimento

```bash
npm run dev
# Turbopack ativo — build ultrarrápido
# Acesse: http://localhost:3000
```

### 4. Build de produção

```bash
npm run build
npm start
```

---

## ☁️ Deploy

O deploy é **totalmente automatizado** via GitHub → Vercel.

```
git push origin main
      │
      ▼
  GitHub Webhook
      │
      ▼
  Vercel Build (Turbopack)
      │
      ▼
  Serverless Functions + CDN Global
      │
      ▼
  stock-master-pro-app.vercel.app  ✓
```

Configure as mesmas variáveis de ambiente do `.env.local` no painel da Vercel em **Settings → Environment Variables**.

---

## 📊 Fluxo Operacional

```
  GESTOR                          OPERADOR
    │                                │
    ├── Cadastra produto          ┌──┘
    ├── Define estoque mínimo     │
    ├── Gera etiqueta QR Code ────┼──→ Etiqueta fixada no produto
    │                             │
    │                        Saída Expressa
    │                             │
    │                        Aponta câmera ──→ QR Code lido
    │                             │
    │                        Confirma qtd ──→ Baixa registrada
    │                             │
    └── Monitora Dashboard ←──────┘
         │
         ├── Alerta de Reposição (qtd < mínimo)
         ├── KPIs Financeiros em tempo real
         └── Exporta PDF / Excel
```

---

## 📁 Estrutura do Projeto

```
stock-master-pro/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Painel / Dashboard
│   │   ├── inventory/            # Gerência de Estoque
│   │   ├── categories/           # Gestão de Categorias
│   │   ├── suppliers/            # Fornecedores
│   │   ├── users/                # Gestão de Time
│   │   ├── express-exit/         # Saída Expressa
│   │   └── log/
│   │       ├── movements/        # Central de Movimentações
│   │       └── audit/            # Auditoria Geral
│   └── api/
│       ├── auth/                 # NextAuth handlers
│       ├── products/             # CRUD de produtos
│       ├── categories/           # CRUD de categorias
│       ├── suppliers/            # CRUD de fornecedores
│       ├── users/                # CRUD de usuários
│       ├── movements/            # Log de movimentações
│       ├── audit/                # Log de auditoria
│       └── reports/              # Geração de relatórios
├── components/
│   ├── ui/                       # Componentes base
│   ├── modals/                   # Modais (Cadastro, Edição, Exclusão)
│   ├── charts/                   # Gráficos Recharts
│   └── labels/                   # Geração de etiquetas QR
├── lib/
│   ├── mongodb.ts                # Conexão com Atlas
│   ├── auth.ts                   # Configuração NextAuth
│   └── utils.ts                  # Utilitários gerais
├── models/
│   ├── User.ts                   # Schema Mongoose — Usuários
│   ├── Product.ts                # Schema Mongoose — Produtos
│   ├── Category.ts               # Schema Mongoose — Categorias
│   ├── Supplier.ts               # Schema Mongoose — Fornecedores
│   ├── Movement.ts               # Schema Mongoose — Movimentações
│   └── AuditLog.ts               # Schema Mongoose — Auditoria
├── middleware.ts                 # Proteção de rotas via NextAuth
└── .env.local                    # Variáveis de ambiente (não commitado)
```

---

## 📈 Métricas do Sistema

```
┌─────────────────────────────────────────┐
│          STOCKMASTER PRO                │
│            EM NÚMEROS                   │
├─────────────────┬───────────────────────┤
│ Módulos         │ 8 módulos principais  │
│ Níveis de Acesso│ 3 (Op · Admin · Master│
│ Dependências    │ 21 pacotes npm        │
│ Formatos Export │ PDF · XLSX · CSV      │
│ Responsivo      │ Desktop · Tablet · Mobile│
│ Deploy          │ GitHub → Vercel (auto)│
│ Banco           │ MongoDB Atlas (cloud) │
│ Auth            │ JWT · bcrypt · RBAC   │
└─────────────────┴───────────────────────┘
```

---

## 🗺️ Roadmap

- [x] CRUD completo de produtos com SKU automático
- [x] Sistema RBAC com 3 níveis de acesso
- [x] Dashboard duplo (Estoque + Financeiro)
- [x] Saída Expressa por QR Code (mobile)
- [x] Geração de etiquetas 60×40mm
- [x] Auditoria Geral com Exclusão Fantasma
- [x] Exportação PDF (Inventário + Movimentações)
- [x] Exportação Excel com design corporativo
- [x] Importação em massa via CSV
- [x] API de CEP integrada (ViaCEP)
- [x] Reset do sistema com confirmação por digitação
- [ ] Notificações push para alertas de reposição
- [ ] Módulo de pedidos de compra automático
- [ ] Integração com NF-e para entrada automática
- [ ] App mobile nativo (React Native)
- [ ] Multi-empresa / Multi-almoxarifado

---

## 👨‍💻 Autor

**Gabriel Luna**

[![GitHub](https://img.shields.io/badge/GitHub-GabrielLuna1-181717?style=for-the-badge&logo=github)](https://github.com/GabrielLuna1)

---

<div align="center">

**StockMaster Pro** · Versão 1.0 · Fevereiro 2026

*Construído com Next.js, TypeScript e MongoDB Atlas*

[🔗 stock-master-pro-app.vercel.app](https://stock-master-pro-app.vercel.app)

</div>
