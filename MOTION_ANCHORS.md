# 📌 Guia de Ancoragens DOM e Referência de Páginas (Motion / Telepatologia)

Este documento é um guia de referência técnica com os **seletores DOM**, **URLs** e **condições de reconhecimento de tela** utilizados pelos scripts do **MotionTampermonkey**.

---

## 1. 🟢 Página de Liberação de Laudos (`https://motionap.dasa.com.br/*`)

Usado por scripts como **Motion To Chopperverso** e **Botão de Liberação**.

### 🎯 Elementos de Ancoragem (DOM)

| Função | Seletor CSS / RegEx | Descrição / Observações |
|---|---|---|
| **Verificar se está na página de Liberação** | `td.col-acao.acao-liberacao` | Se este elemento existir na página, a tela atual é a tela de liberação de laudo. |
| **Seletor de Ação (Gatilho)** | `td.col-acao.acao-liberacao .seletor-grupo` | Elemento interno da coluna de ação de liberação. |
| **Botão / Div de Liberação** | `td.col-acao.acao-liberacao div.btn-seletor.seletor-opcao` | Elemento clicável que dispara o fluxo de liberação no Motion. |
| **Número da Requisição** | `td.col-requisicao` | Contém o número do caso. RegEx para extrair: `/(\d{4}\.\d{4}\.\d{4})/` |
| **Campo de Senha / Assinatura** | `#senhaLiberarResultado` ou `input[name="senhaLiberarResultado"]` | Input onde o usuário digita a senha de liberação. |
| **Botão de Confirmar Liberação** | `.btn.btn-primary.btn-sm` | Botão que possui o texto `"Confirmar"` ou `"Liberar"`. |
| **Detecção de HEAP** | `p.teste-codigo-alfa.info-destaque` | Verifica se o texto retornado é exatamente `"HEAP"`. |
| **Quantidade de Lâminas** | `span.info-destaque.correcao-resultado-texto` | RegEx para extrair o número de lâminas: `/\d+/` |

### 💻 Exemplo de Código para Detecção da Página de Liberação
```javascript
function ehPaginaLiberacao() {
    return document.querySelector('td.col-acao.acao-liberacao') !== null;
}
```

---

## 2. 📑 Primeira Página de Casos HE (`RMACRO`) (`https://motionap.dasa.com.br/*`)

Usado por scripts como **Ícone de Prancheta para Macro**.

### 🎯 Elementos de Ancoragem (DOM)

| Função | Seletor CSS / RegEx | Descrição / Observações |
|---|---|---|
| **Verificar se é página de RMACRO** | `div.tituloTesteNome` | Deve ter o texto `.textContent.trim() === 'RMACRO'`. Indica a 1ª página de casos HE. |
| **Campo do Laudo / Macro** | `textarea#laudoFormatado` ou `textarea.laudo-texto` | Textarea onde a descrição macroscópica está digitada. |
| **Captura de Cassetes / Blocos** | RegEx: `/^[A-Z]+\)/` ou `/^[A-Z]\d+:/` | Identifica blocos de cassetes no texto (ex: `A)`, `B)`, `A1:`, `A1 a A5:`). |

### 💻 Exemplo de Código para Detecção de RMACRO
```javascript
function ehPaginaRMACRO() {
    const elementos = document.querySelectorAll('div.tituloTesteNome');
    return Array.from(elementos).some(el => el.textContent.trim() === 'RMACRO');
}
```

---

## 3. 🖼️ Popup de Lâminas / Imagens (`https://motionap.dasa.com.br/PopupImagens*`)

Usado por scripts como **Popup de Lâminas**.

### 🎯 Elementos de Ancoragem (DOM)

| Função | URL / Seletor | Descrição |
|---|---|---|
| **Página Alvo** | `https://motionap.dasa.com.br/PopupImagens*` | Janela popup de visualização de lâminas digitais/escaneadas. |

---

## 4. 🔍 Buscador / Lista de Casos (`https://motionap.dasa.com.br/dashu/list.action*`)

Usado por scripts como **Buscador Rápido de Casos**.

### 🎯 Elementos de Ancoragem (DOM)

| Função | URL / Seletor | Descrição |
|---|---|---|
| **Página Alvo** | `https://motionap.dasa.com.br/dashu/list.action*` | Tabela principal com a lista e busca de casos no Motion. |

---

## 5. 📊 Monitor de Pendências (`https://motionap.dasa.com.br/velab-monitores/MonitorPendencias.action`)

Usado pelo script **Motion · Extrator de Casos**.

### 🎯 Elementos de Ancoragem (DOM)

A grade não tem `<th>` com títulos (o cabeçalho fica fora da tabela), então a
ancoragem é feita pelo atributo do seletor de linha, não por índice de coluna.

| Função | Seletor CSS / RegEx | Descrição / Observações |
|---|---|---|
| **Linha de caso** | `[data-pendencia]` → `.closest('tr')` | O valor é o ID interno da pendência. Aparece em `td` nas linhas de dados. |
| **Linha a descartar** | `tr.header` | Linha oculta que **também** tem `data-pendencia` (em `th`) e texto vazio. Filtrar por texto vazio. |
| **Prazo (timer)** | `.listaTimer` | Tempo restante, formato `2d04h` / `14h30m`. Atualizado por JS. |
| **FAP** | célula com `/^\d{12}$/` | É o número de 12 dígitos — a mesma chave usada pelo Organizador de Casos. |
| **Nome + código** | última célula de texto | Nome e código interno (`CL-26-1495`) ficam grudados; separar por `/([A-Z]{2,4}-\d{2}-\d+)\s*$/`. |
| **Tipo de pendência** | `td.preventRowSelection span` | Só existe como tooltip dos ícones: `Preparo Pendente: Liberação Médica`, `Preparo Pendente: Digitalização`, `Pedidos Medicos Escaneados`, `Imagens da requisição`, `Consultar Requisição`, `Acompanhamento de Processos de Amostras`. |

### 🚩 Flags de estado (classes de ícone)

| Flag | Classe |
|---|---|
| Urgente | `tcolor-urgent` |
| Alerta | `ticon-alerta` |
| Bloqueado | `ticon-cadeado-fechado` / `tcolor-locked` |
| Tem imagens | `ticon-arquivo-imagem` |
| Pedido escaneado | `ticon-prancheta-lista` |

### ⚠️ Armadilhas desta página

1. **A página carrega o Prototype.js**, que substitui `Array.prototype.filter`
   por uma versão que chama o callback só com `(valor, índice)`. Qualquer
   callback que use o 3º argumento (o array) recebe `undefined` e lança
   `TypeError`. Use laços explícitos ou `Set` para deduplicar.
2. **Não use `MutationObserver` sobre o `body` para manter um botão.** Criar ou
   atualizar o próprio botão dispara o observador, que reage e altera de novo —
   laço infinito que trava a aba. Uma sondagem (`setInterval`) idempotente
   resolve sem risco.
3. **A grade nasce vazia**: os casos só aparecem depois de aplicar o filtro, e
   a lista se recarrega sozinha a cada 60s (`filtroBusca.intervaloAtualizacao`).
4. `filtroBusca.itensPorPagina` vale 30 por padrão; acima disso há paginação.

### 💻 Detecção da tela

```javascript
function temCasosNoMonitor() {
    return document.querySelector('[data-pendencia]') !== null;
}
```

---

## 6. 🔬 Domínios da Telepatologia (`Telepato`)

Usado pelo script **Telepato · Contador (Patologia)**.

### 🌐 Domínios Válidos (`@match`)
- `https://patologia-rj01.dasa.com.br/*`
- `https://patologia-go01.dasa.com.br/*`
- `https://patologia-sp01.dasa.com.br/*`
- `https://patologia-rj02.dasa.com.br/*`

### 🎯 Elementos e Recursos do Widget Telepato
- **Botão Flutuante**: `#tp-opcoes-btn` (fixado em `bottom: 20px; right: 20px; z-index: 2147483646`).
- **Container do Widget**: `#tp-widget-container` (`bottom: 72px; right: 20px;`).
- **Classes de Escopo**: `.tp-widget` para isolar CSS.

---

## 7. 👆 Visualizador de Lâminas Philips (GO / Telepatologia)

Usado pelo script **Philips GO · Navegação por Toque**
(`scripts/philips-go-navegacao-toque.user.js`). Mesmos domínios da seção 6.

### 🎯 Ancoragem do visualizador

Não há um `id`/classe estável para o visualizador, então a ancoragem é
**geométrica**: o maior `<canvas>` da página com pelo menos `200×200 px`.

| Função | Seletor / Heurística | Observações |
|---|---|---|
| **Canvas da lâmina** | maior `canvas` com lado ≥ 200px | Marcado com a classe `.pgt-alvo`. Pode ser sobrescrito por um seletor manual no painel. |
| **Raiz da área de toque** | `canvas.parentElement` | O visualizador sobrepõe `div`s transparentes ao canvas; se o pai for `body`/`html`, usa-se o próprio canvas. |
| **Elementos a ignorar** | `button, a, input, select, textarea, label, [role="button"], [role="slider"], .pgt-widget` | Toques nesses elementos seguem o fluxo nativo, sem interceptação. |

### 🎨 Elementos do widget de toque
- **Botão Flutuante**: `#pgt-btn` (`bottom: 20px; left: 20px; z-index: 2147483646`) — à esquerda para não colidir com o `#tp-opcoes-btn` do Telepato.
- **Painel de Ajustes**: `#pgt-painel` (`bottom: 76px; left: 20px`).
- **Classe de Escopo**: `.pgt-widget`.
- **Configuração**: `localStorage["pgt:config:v1"]`.

### ⚠️ Armadilhas desta tela

1. **O visualizador ignora eventos de toque.** Ele escuta `mouse*` e/ou
   `pointer*` — neste último caso filtrando `pointerType === 'mouse'`. Por isso
   o script **traduz** o toque em eventos sintéticos de mouse **e** de ponteiro
   (nessa ordem, como o navegador real faz), em vez de tentar tratar o toque.
2. **`setPointerCapture()` com `pointerId` sintético lança `InvalidPointerId`**
   e quebraria o handler do visualizador. `Element.prototype.setPointerCapture`
   e `releasePointerCapture` são envolvidos em `try/catch` para engolir o erro.
3. **O zoom é feito por `wheel`**, não por API própria: a pinça vira passos
   discretos de roda (`deltaY = ±100`, `deltaMode: 0`) disparados no ponto médio
   entre os dedos. `deltaY` negativo = aproximar.
4. **`touch-action: none` é obrigatório** no canvas e no contêiner, senão o
   navegador rouba o gesto para rolar/dar zoom na página.
5. **A lâmina pode estar dentro de um `iframe`**: o script roda em todos os
   frames, mas o botão flutuante só é criado no frame que realmente tem o
   canvas — evita botão duplicado sobreposto.
6. **O canvas só existe depois que a lâmina carrega**: a detecção é feita por
   sondagem (`setInterval` de 1,2s), não por `MutationObserver` (ver armadilha 2
   da seção 5).

### 💻 Detecção da tela

```javascript
function acharVisualizador() {
    let melhor = null, maiorArea = 0;
    for (const c of document.querySelectorAll('canvas')) {
        const r = c.getBoundingClientRect();
        if (r.width < 200 || r.height < 200) continue;
        const area = r.width * r.height;
        if (area > maiorArea) { maiorArea = area; melhor = c; }
    }
    return melhor;
}
```

### 🔍 Diagnóstico

`scripts/philips-go-diagnostico-console.js` — cole no console do DevTools com a
lâmina aberta, faça os gestos e rode `pgtRelatorio()` para descobrir quais
eventos o visualizador realmente escuta (usa `getEventListeners`, só disponível
no console do Chrome/Edge).
