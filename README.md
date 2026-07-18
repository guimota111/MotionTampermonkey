# 🐵 Meus Scripts Tampermonkey

Página estática para organizar, num único lugar, os vários scripts que você cria
no **Tampermonkey** — agrupados por **categorias**, com **lista de versões** e
**changelog** de cada mudança.

Feita para ser hospedada no **GitHub Pages** e usar o **Firebase Firestore**
como banco de dados.

## ✨ Funcionalidades

- 📁 **Categorias** — crie, renomeie e exclua grupos para organizar os scripts.
- 📜 **Scripts** — cada script tem nome, descrição e pertence a uma categoria.
- 🏷️ **Versões** — cada script guarda um histórico de versões, com o código de cada uma.
- 📝 **Changelog** — cada versão tem uma descrição do que mudou.
- 🔍 **Busca** — filtre scripts pelo nome ou descrição.
- 📋 **Copiar código** — copie o código de qualquer versão com um clique.
- ⚡ **Tempo real** — tudo é sincronizado automaticamente via Firestore.

## 🗂️ Estrutura dos dados (Firestore)

```
categories/{id}
  ├─ name: string
  └─ createdAt: timestamp

scripts/{id}
  ├─ name: string
  ├─ description: string
  ├─ categoryId: string        (id da categoria, ou "__none__" se sem categoria)
  ├─ createdAt: timestamp
  └─ versions: array [
        { id, version, changelog, code, createdAt }
     ]
```

## 🚀 Como colocar no ar

### 1. Ative o Firestore
1. Abra o [Console do Firebase](https://console.firebase.google.com/) →
   projeto **scriptstampermonkey-e3570**.
2. Menu **Build → Firestore Database → Criar banco de dados**.
3. Escolha a localização e crie.

### 2. Configure as regras de segurança
A configuração do Firebase (`apiKey`, etc.) fica **pública** no código do site —
isso é normal e esperado para apps web do Firebase. A proteção real vem das
**regras do Firestore**. Escolha uma das opções abaixo em
**Firestore → Regras**:

**Opção A — Uso pessoal simples (aberto).** Qualquer pessoa com o link do site
pode ler e escrever. Prático, mas sem proteção:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Opção B — Recomendado (somente com login).** Exige autenticação. Ative
**Authentication → Sign-in method** (ex.: Google) e restrinja ao seu e-mail:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email == "SEU_EMAIL@gmail.com";
    }
  }
}
```

> Se usar a Opção B, será necessário adicionar o fluxo de login no `app.js`.
> Por padrão o projeto usa a **Opção A** (sem login).

### 3. Autorize o domínio do GitHub Pages
Em **Authentication → Settings → Authorized domains**, adicione
`SEU_USUARIO.github.io` (necessário se for usar login).

### 4. Publique no GitHub Pages
1. Faça o commit destes arquivos na raiz do repositório.
2. No GitHub: **Settings → Pages**.
3. Em **Source**, escolha a branch (ex.: `main`) e a pasta `/ (root)`.
4. Salve. Em alguns instantes o site estará em
   `https://SEU_USUARIO.github.io/MotionTampermonkey/`.

## 🧪 Rodar localmente

Os módulos ES exigem um servidor HTTP (não funciona abrindo o arquivo direto):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## 📁 Arquivos

| Arquivo       | Função                                   |
|---------------|------------------------------------------|
| `index.html`  | Estrutura da página e modais             |
| `styles.css`  | Estilo (tema escuro)                     |
| `app.js`      | Lógica + integração com o Firestore      |
