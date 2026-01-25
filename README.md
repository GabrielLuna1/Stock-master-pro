# 📦 StockMaster Pro | Enterprise Inventory Management

<div align="center">
  <img src="./assets/dashboard.png" alt="StockMaster Dashboard" width="100%" />
  
  <p align="center">
    <strong>Sistema de Gestão Logística e Controle de Estoque de Alta Performance.</strong>
    <br />
    Next.js 14 • TypeScript • MongoDB • NextAuth • Tailwind CSS
  </p>

  <p align="center">
    <a href="https://stock-master-pro.vercel.app">🔗 <strong>Ver Demo Online</strong></a>
    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-instalação">🚀 Instalação</a>
    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-arquitetura">🏗️ Arquitetura</a>
  </p>
</div>

---

## 🚀 Sobre o Projeto

O **StockMaster Pro** não é apenas um CRUD de produtos. É uma solução completa de **Mini ERP** focada na integridade de dados e auditoria operacional.

O projeto nasceu da necessidade de criar um sistema que unisse a estética robusta do setor logístico com a experiência de usuário (UX) fluida de aplicações modernas SaaS.

### ✨ Principais Funcionalidades

* **🛡️ Segurança Enterprise (RBAC):** Controle de Acesso Baseado em Função. Admins têm superpoderes; Operadores têm acesso restrito. Proteção via Middleware e validação Server-Side.
* **📊 Dashboard Inteligente:** KPIs calculados em tempo real (Month-to-Date), gráficos de fluxo de caixa e alertas visuais de estoque crítico.
* **📦 Gestão de Inventário:**
    * Status dinâmico (Estável, Baixo, Crítico).
    * **Safe Delete:** Sistema de integridade referencial que impede a exclusão de categorias em uso, evitando orfãos no banco de dados.
* **👁️ Auditoria (Logs):** Rastreabilidade total. O sistema registra *quem* fez *o que* e *quando* (Login, Logout, Movimentações e Alterações Críticas).
* **📑 Relatórios Financeiros:** Exportação profissional para Excel (.xlsx) utilizando `ExcelJS`, com design corporativo, formatação condicional automática e travas de segurança.

---

## 🛠️ Tech Stack & Decisões Arquiteturais

O projeto utiliza o que há de mais moderno no ecossistema JavaScript para garantir escalabilidade:

| Tecnologia | Função | Por que escolhi? |
| :--- | :--- | :--- |
| **Next.js 14** | Framework | Uso do **App Router** e **Server Actions** para reduzir a latência e eliminar a necessidade de uma API separada. |
| **TypeScript** | Linguagem | Tipagem estática para garantir segurança de código e manutenibilidade em escala. |
| **MongoDB** | Database | Flexibilidade de Schema ideal para produtos com atributos variáveis, gerenciado via **Mongoose**. |
| **NextAuth.js** | Auth | Autenticação robusta com gestão de sessão via JWT e callbacks para controle de Role (Admin/User). |
| **Tailwind CSS** | Estilização | Criação de um Design System consistente (StockMaster Red) e responsividade nativa. |
| **ExcelJS** | Reporting | Geração de arquivos binários reais (não apenas CSV), permitindo formatação visual e fórmulas. |
| **Zustand/Context** | State | Gerenciamento de estados globais (como a Sidebar e Alertas) sem prop-drilling. |

---

## 📸 Galeria



<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Gestão de Inventário</strong></td>
      <td align="center"><strong>Relatórios Excel Premium</strong></td>
    </tr>
    <tr>
      <td><img src="./assets/estoque.png" width="400" alt="Tela de Estoque" /></td>
      <td><img src="./assets/excel.png" width="400" alt="Relatório Excel" /></td>
    </tr>
    <tr>
      <td align="center"><strong>Controle de Categorias</strong></td>
      <td align="center"><strong>Gestão de Usuários e Logs</strong></td>
    </tr>
    <tr>
      <td><img src="./assets/categorias.png" width="400" alt="Tela de Categorias" /></td>
      <td><img src="./assets/usuarios.png" width="400" alt="Tela de Usuários" /></td>
    </tr>
  </table>
</div>

---

## 🚀 Instalação e Uso Local

Siga os passos abaixo para rodar o projeto na sua máquina:

### 1. Pré-requisitos
* Node.js 18+
* MongoDB (Local ou Atlas)

### 2. Clonagem e Instalação

```bash
# Clone este repositório
git clone [https://github.com/GabrielLuna1/Stock-master-pro.git](https://github.com/GabrielLuna1/Stock-master-pro.git)

# Entre na pasta
cd stock-master-pro

# Instale as dependências
npm install
