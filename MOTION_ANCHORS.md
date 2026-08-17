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

Usado pelo script **Ícone de Prancheta para Macro**
(`scripts/motion-prancheta-macro.user.js`).

### 🎯 Elementos de Ancoragem (DOM)

| Função | Seletor CSS / RegEx | Descrição / Observações |
|---|---|---|
| **Verificar se é página de RMACRO** | `div.tituloTesteNome` | Deve ter o texto `.textContent.trim() === 'RMACRO'`. Indica a 1ª página de casos HE. |
| **Campo do Laudo / Macro** | `textarea.areaResultadoOriginalText` | Textarea onde a descrição macroscópica está digitada. É o seletor que o script usa em produção. |
| **Botão da prancheta** | `#motion-copy-btn` | Inserido como irmão seguinte do `div.tituloTesteNome` do RMACRO. |
| **Captura de Cassetes / Blocos** | RegEx: `/^[A-Z]+\)/` ou `/^[A-Z]\d+:/` | Identifica blocos de cassetes no texto (ex: `A)`, `B)`, `A1:`, `A1 a A5:`). |
| **Título de topografia** | RegEx: `/^[A-Z]+\)[^:]*:/` | Pega `A) Mama direita:` de dentro da linha inteira do frasco. |

### ⚠️ Armadilha: a frase de abertura da macro

A macro costuma (mas não sempre) começar com uma frase de apresentação do
material — ex.: `Recebido para exame dois frascos, com o material a seguir:`.
Ela **também** termina em `:` e começa com maiúscula, então qualquer heurística
do tipo "primeira linha terminada em dois-pontos é o título" a captura junto com
os títulos verdadeiros.

A extração é feita em duas passadas:

1. **Títulos por frasco** (`A) …:`, `AB) …:`). Se existir ao menos um, a frase de
   abertura é ignorada por construção — ela nunca tem letra de frasco.
2. **Frasco único, sem letra**: só então vale a primeira linha terminada em `:`,
   e ainda assim depois de descartar as frases de abertura conhecidas
   (`Recebido…`, `Recebemos…`, `Enviados…`, qualquer linha com `para exame`,
   `frasco(s)`, `recipiente(s)`, ou terminada em `a seguir:` / `abaixo:` /
   `assim discriminados:` / `identificados como:`).

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

## 7. 👆 Visualizador de Lâminas Philips PathologySuite (GO / Telepatologia)

Usado pelo script **Philips GO · Navegação por Toque**
(`scripts/philips-go-navegacao-toque.user.js`). Mesmos domínios da seção 6.

**URL do visualizador**: `https://patologia-{uf}{nn}.dasa.com.br/pathologysuite/#/viewer?images=<UID>&server=<host>`
App **Angular** (`[ng-version]`), render em **WebGL**, overlays em **Fabric.js**.
Sem OpenSeadragon, sem Hammer.js.

### 🧅 Camadas de canvas (todas do mesmo tamanho, empilhadas)

Confirmado por diagnóstico em produção — 8 canvas na tela:

| Camada | Seletor | Papel |
|---|---|---|
| Render da lâmina | `app-viewport-renderer.viewport-renderer-layer.e2e-mouse-element ... canvas.webgl` | Canvas WebGL, com `id` **UUID gerado a cada sessão** — não serve de âncora. |
| Grade | `app-fabric-grid.fabric-grid > canvas.grid-canvas.lower-canvas` | Fabric. |
| Ferramenta de pan | `app-fabric-pan.fabric-canvas.pan-tool > canvas.pan-view-canvas.lower-canvas` | Fabric. |
| Anotação (fundo) | `app-fabric-annotation ... canvas.annotation-canvas.lower-canvas` | Fabric. |
| **Anotação (topo)** | `app-fabric-annotation ... canvas.upper-canvas.annotation-canvas` | **É esta que recebe todos os eventos** (`touchstart`, `pointerdown`, `mousedown`, `wheel`). Já nasce com `touch-action: none`. |
| Janela de navegação | `app-renderer-navigation-window > canvas.layer.e2e-navigation-window-slide` + `app-crosshair` (2 canvas) | Miniatura, ~304×105px. |

> ⚠️ O `canvas.upper-canvas` fica numa **subárvore diferente** da do
> `canvas.webgl`: `div.viewer-container` tem como filhos tanto o
> `app-viewport-renderer` quanto o `app-annotation-overlay`. Ancorar no
> `canvas.webgl.parentElement` **não** alcança a camada que recebe os eventos.

### 🎧 Onde o app escuta (via `getEventListeners`)

| Alvo | Eventos |
|---|---|
| `document` | `mousedown, mousemove, mouseup, mouseenter, pointerdown, pointermove, wheel, DOMMouseScroll, mousewheel, touchstart, touchmove` |
| 3º ancestral do `canvas.webgl` | `mousedown, wheel` |

O pan/zoom é dirigido por **mouse/pointer no `document`** — por isso eventos
sintéticos disparados em qualquer elemento da área do visualizador chegam ao
app por bubbling. Os `touchstart`/`touchmove` no `document` são do Fabric, não
da navegação.

### 🎯 Ancoragem do visualizador

O `id` do canvas é um UUID por sessão, então a ancoragem é **geométrica**: o
maior `<canvas>` da página com pelo menos `200×200 px`.

| Função | Seletor / Heurística | Observações |
|---|---|---|
| **Canvas da lâmina** | maior `canvas` com lado ≥ 200px | Marcado com a classe `.pgt-alvo`. Pode ser sobrescrito por um seletor manual no painel. |
| **Raiz da área de toque** | sobe do canvas enquanto o ancestral tiver ≤ 2× a área dele (máx. 10 níveis, parando antes de `body`) | Chega ao contêiner do viewport, que abriga **todas** as camadas — inclusive o overlay do Fabric. |
| **Rede de segurança** | qualquer `canvas` com lado ≥ 80px | Neste domínio todo canvas pertence ao visualizador; cobre também a janela de navegação. |
| **Elementos a ignorar** | `button, a, input, select, textarea, label, [role="button"], [role="slider"], .pgt-widget` | Toques nesses elementos seguem o fluxo nativo, sem interceptação. |

### 🎨 Elementos do widget de toque
- **Botão Flutuante**: `#pgt-btn` (`bottom: 20px; left: 20px; z-index: 2147483646`) — à esquerda para não colidir com o `#tp-opcoes-btn` do Telepato.
- **Painel de Ajustes**: `#pgt-painel` (`bottom: 76px; left: 20px`).
- **Classe de Escopo**: `.pgt-widget`.
- **Configuração**: `localStorage["pgt:config:v1"]`.

### ⚠️ Armadilhas desta tela

1. **O Fabric mata o toque.** O `canvas.upper-canvas` dá `preventDefault()` no
   `touchstart`, então o navegador **não gera os eventos de mouse de
   compatibilidade** — e o pan do app, que depende de `mousedown`/`mousemove`,
   nunca dispara com o dedo. Daí o script **traduzir** o toque em eventos
   sintéticos de mouse **e** de ponteiro (nessa ordem, como o navegador real
   faz), em vez de tentar tratar o toque.
2. **O `pointerdown` de toque chega ao app** (`pointerType: "touch"`) e mesmo
   assim não navega — confirmando que a navegação é dirigida por mouse. Os
   eventos sintéticos usam `pointerType: 'mouse'`.
3. **`setPointerCapture()` com `pointerId` sintético lança `InvalidPointerId`**
   e quebraria o handler do visualizador. `Element.prototype.setPointerCapture`
   e `releasePointerCapture` são envolvidos em `try/catch` para engolir o erro.
4. **O `deltaY` nativo aqui é 2, não 100.** Uma rolagem real nesta tela chega
   com `deltaY: 2` / `deltaMode: 0`. Emitir os 100 de um mouse clássico jogaria
   o zoom pro fim da escala numa pinçada só. O script **calibra**: mede o
   `|deltaY|` de rolagens reais (`isTrusted`) e usa a mediana como passo.
5. **É preciso "mover o cursor" antes de pressionar.** Um `mousemove`/
   `pointermove` com `buttons: 0` no ponto do toque precede o `mousedown` — sem
   isso, um app que calcula o deslocamento a partir da última posição conhecida
   dá um salto na primeira movimentação. O mesmo vale antes do `wheel`, porque o
   zoom é ancorado no cursor.
6. **`touch-action: none` é obrigatório** no canvas e no contêiner, senão o
   navegador rouba o gesto para rolar/dar zoom na página.
7. **A lâmina pode estar dentro de um `iframe`**: o script roda em todos os
   frames, mas o botão flutuante só é criado no frame que realmente tem o
   canvas — evita botão duplicado sobreposto. (No PathologySuite atual não há
   iframe: `window.top === window`.)
8. **O canvas só existe depois que a lâmina carrega**: a detecção é feita por
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

### 🎮 Controle por gamepad

`scripts/philips-go-gamepad.user.js` reaproveita a mesma camada de emissão de
eventos — ela é agnóstica à origem, então trocar dedo por analógico não exige
nada do lado do visualizador.

| Controle | Ação |
|---|---|
| Analógico esquerdo | Move a lâmina, velocidade proporcional à inclinação |
| RT / LT | Aproxima / afasta, gradual (gatilhos são analógicos) |
| Analógico direito | Move o cursor de ancoragem do zoom |
| RB / LB | Passo fixo de zoom |
| Direcional | Deslocamento fixo (varredura sistemática) |
| A / R3 | Clica no cursor / recentra o cursor |

Particularidades da **Gamepad API**:

1. **Não há evento de eixo** — os analógicos só existem por sondagem. O laço
   roda em `requestAnimationFrame` (que pausa sozinho com a aba oculta).
2. **O controle só aparece após um gesto**: por antifingerprinting, o Chrome só
   expõe o gamepad depois de um botão pressionado com a aba em foco. Sem isso,
   `navigator.getGamepads()` devolve entradas vazias.
3. **A aba precisa estar em foco** (`document.hasFocus()`), senão o estado
   congela.
4. **Zona morta obrigatória** (~0.15): analógico gasto tem deriva constante, que
   sem filtro vira um `mousedown` eterno.
5. **O arrasto precisa reancorar**: pan é `mousedown` segurado + `mousemove`, e
   num deslocamento longo o ponto sairia da tela. Ao chegar perto da borda,
   solta, volta ao centro e pressiona de novo — como o pan é relativo ao ponto
   do `mousedown`, a imagem não salta.
6. **Zoom em vários passos = vários eventos.** Não se sabe se o visualizador
   escala pelo valor do delta ou só conta eventos; emitir N eventos de um passo
   funciona nos dois casos, e é o que uma roda real faz.
7. **Coordenadas inteiras**: `MouseEvent` trunca `clientX`/`clientY`, então
   sobra de ponto flutuante vira erro de 1px no destino.

### 🔍 Diagnóstico

`scripts/philips-go-diagnostico-console.js` — cole no console do DevTools com a
lâmina aberta, faça os gestos e rode `pgtRelatorio()` para descobrir quais
eventos o visualizador realmente escuta (usa `getEventListeners`, só disponível
no console do Chrome/Edge).
