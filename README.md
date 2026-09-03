
<p align="center">
  <img src="Icons/logoempresa.png" alt="M. Oliveira Segurança do Trabalho" width="180">
</p>

<h1 align="center">M. Oliveira | Segurança do Trabalho</h1>

<p align="center">
  Site institucional + Painel Administrativo para empresa especializada em Segurança do Trabalho, Saúde Ocupacional e Treinamentos NR.
  <br>
  <a href="https://moliveiraseguranca.com.br"><strong>🌐 moliveiraseguranca.com.br</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black" alt="Render">
</p>

---

## 📋 Sobre o Projeto

Site institucional completo para a **M. Oliveira – Segurança do Trabalho**, com painel administrativo integrado para gerenciamento de conteúdo em tempo real. O site apresenta os serviços da empresa, treinamentos, clientes e parceiros, além de formulário de orçamento e contato direto via WhatsApp.

### 🎯 Funcionalidades

- **Site institucional** com design moderno e responsivo
- **Painel administrativo privado** para gestão de conteúdo
- **Gerenciamento de serviços** (CRUD completo)
- **Galeria de fotos** de treinamentos com upload
- **Logotipos de clientes e parceiros**
- **Diferenciais** da empresa (gerenciáveis)
- **Formulário de orçamento** com envio de e-mail
- **Autenticação JWT** no painel administrativo
- **Rate limiting** e proteção contra ataques de força bruta
- **Responsivo** para todos os dispositivos
- **SEO** otimizado (Open Graph, Schema.org, sitemap.xml)
- **Modo de manutenção** ativável via painel
- **Integração com Web3Forms** para formulários
- **WhatsApp flutuante** com link direto

---

## 🛠️ Tecnologias Utilizadas

### Front-end
- **HTML5** + **CSS3** (animações, variáveis, grid/flexbox)
- **JavaScript** vanilla (acessibilidade, navegação, formulários)
- **Fonts:** Bebas Neue + Barlow (Google Fonts)

### Back-end (admin-server)
- **Node.js** + **Express**
- **SQLite** (via `sql.js`) — banco de dados embarcado
- **JWT** (`jsonwebtoken`) — autenticação do painel
- **bcryptjs** — hash de senhas
- **Multer** — upload de imagens
- **Supabase Storage** — armazenamento gratuito para fotos/logos (1GB)- **Nodemailer** — envio de e-mails
- **Helmet** — segurança HTTP
- **express-rate-limit** — proteção contra brute force
- **Greenlock** — SSL automático (Let's Encrypt)

### Deploy
- **Render** — hospedagem do admin-server
- **Supabase Storage** — armazenamento de imagens (gratuito, sem cartão)
- **GitHub Pages** / hospedagem estática — site front-end
- **Domínio próprio** com SSL

---

## 🚀 Estrutura do Projeto

```
moliveira-seguranca.html   # Site institucional (single-page)
Icons/                     # Logotipos e favicons
fotos-servicos/            # Imagens dos serviços
clientes-parceiros/        # Imagens de clientes
robots.txt                 # Configuração de crawlers
sitemap.xml                # Sitemap para SEO
admin-server/              # Painel administrativo
├── server.js              # Servidor Express
├── db.js                  # Conexão SQLite
├── storage.js             # Armazenamento (Supabase ou local)
├── mailer.js              # Configuração de e-mail
├── routes/                # Rotas da API
│   ├── auth.js            # Autenticação
│   ├── content.js         # Gerenciamento de conteúdo
│   ├── services.js        # Serviços
│   ├── photos.js          # Galeria de fotos
│   ├── logos.js           # Logotipos de clientes
│   ├── diferenciais.js    # Diferenciais
│   └── submissions.js     # Formulários recebidos
├── public/                # Interface do painel
└── uploads/               # Imagens enviadas (local fallback)
```

---

## ⚙️ Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- NPM

### Passos

```bash
# Clone o repositório
git clone https://github.com/GuiDouradoDev/site-m-oliveira.git
cd site-m-oliveira

# Configure as variáveis de ambiente
cp admin-server/.env.example admin-server/.env
# Edite o .env com suas credenciais

# Instale as dependências do painel
cd admin-server
npm install

# Inicie o servidor
npm start
```

O servidor será iniciado em `http://localhost:3001`. O site institucional pode ser aberto diretamente (`moliveira-seguranca.html`) ou servido por qualquer servidor estático.

---

## 🔐 Painel Administrativo

Acesse `/admin/` para fazer login no painel de administração.

### Funcionalidades do painel:
- **Dashboard** com visão geral
- **Serviços** — adicionar, editar, reordenar e remover
- **Conteúdo** — editar textos do site em tempo real
- **Fotos** — upload e gerenciamento da galeria de treinamentos
- **Logos** — gerenciar logotipos de clientes e parceiros
- **Diferenciais** — gerenciar os diferenciais da empresa
- **Orçamentos** — visualizar formulários recebidos
- **Modo de manutenção** — ativar/desativar

---

## 🌐 Deploy

- **Front-end:** Hospedagem estática (GitHub Pages, Vercel, ou similar)
- **Admin-server:** Hospedado no Render com deploy automático via GitHub
- **Domínio:** [`moliveiraseguranca.com.br`](https://moliveiraseguranca.com.br)

---

## ☁️ Configuração do Supabase Storage (Armazenamento Gratuito)

As fotos e logos são armazenadas no **Supabase Storage** — 1GB grátis, **sem cartão de crédito**.

### Passo 1: Criar conta e projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita (sem cartão)
2. Clique em **New project**
3. Escolha um nome (ex: `moliveira`), uma senha de banco e a região mais próxima (`South America`)
4. Aguarde o projeto ser criado (alguns minutos)

### Passo 2: Criar o bucket público
1. No menu lateral, vá em **Storage**
2. Clique em **New bucket**
3. Nome do bucket: `uploads`
4. Marque a opção **Public bucket** (obrigatório!)
5. Clique em **Create bucket**

### Passo 3: Obter as credenciais
1. No menu lateral, vá em **Settings** (engrenagem) → **API Keys**
2. Anote os valores:
   - **Project URL** → `SUPABASE_URL`
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY`
   - (Se o seu projeto tiver a chave legada **Service Role Key** `eyJ...`, use-a também em `SUPABASE_SERVICE_KEY`)

### Passo 4: Configurar no Render
No painel do Render, adicione estas variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `SUPABASE_URL` | Project URL do seu projeto Supabase |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) |
| `SUPABASE_BUCKET` | `uploads` |

### Passo 5: Deploy
Faça push das alterações para o GitHub. O Render fará deploy automaticamente.

> **Importante:** Fotos adicionadas antes da configuração do Supabase ficam salvas localmente. Novas fotos serão salvas no Supabase e persistirão entre deploys.

---

## 📞 Contato

- **Site:** [moliveiraseguranca.com.br](https://moliveiraseguranca.com.br)
- **Instagram:** [@moliveira.segtrabalho](https://instagram.com/moliveira.segtrabalho)
- **E-mail:** Comercial@moliveiraseguranca.com.br
- **WhatsApp:** (11) 96440-7743

---

<p align="center">
  Desenvolvido por <a href="https://github.com/GuiDouradoDev">@GuiDouradoDev</a>
  <br>
  © 2026 M. Oliveira Segurança do Trabalho
</p>
