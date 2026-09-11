# Perfil dos projetos

Mapa do que existe nos 33 repositórios de [`guimota111`](https://github.com/guimota111),
o que cada um resolve, e o padrão que atravessa todos eles.

> Levantamento feito lendo os 33 repositórios. Os clones foram rasos (`--depth 1`), então
> este documento não afirma nada sobre histórico de commits — só sobre o código como está hoje.

---

## Quem escreve, e para quê

Um médico patologista que trabalha na DASA e programa para resolver o próprio atrito.
Não são projetos de portfólio: quase todo repositório aqui nasceu de uma tarefa concreta
que incomodava — contar mitoses na ocular, achar um caso numa lista de trinta, montar a
escala de plantão do mês, lembrar qual é a sigla de "invasão perineural", lançar produção
no fim do dia.

O acervo se organiza em quatro eixos:

| Eixo | O que é | Repositórios |
|---|---|---|
| **Trabalho / patologia** | Ferramentas de laudo, estadiamento, macroscopia, acervo de textos | Patholytics, Estadiador, ArquivosLaudos, Assistente-trabalho, OrganizadorCasos, BrainPath, SiglasLorennaJH, tma, Butcherduck, GuilisHUOL, FastPath, GuilisAHK, Remora |
| **Automação do LIS Motion** | Userscripts que injetam funcionalidade no sistema da DASA | MotionTampermonkey, Chopperverso |
| **Escala e gestão** | Organização coletiva do serviço | EscalaDasaCongTeste2, EscalaCongDasa |
| **Vida pessoal e finanças** | Hábitos, saúde, dinheiro, estudo | novo-life-hub, new-money-hub, ChopperMoney, guilis-stats, roadmaps, TamagochiSystem |
| **Para outras pessoas** | Coisas feitas para a namorada, amigos, clube do livro | crushgames, clubedolivro, aposta, MRV, belinha |

---

## Mapa rápido

| Repositório | O que é | Stack | Onde roda | Estado |
|---|---|---|---|---|
| **Patholytics** | Plataforma que consolida quase todas as ferramentas de patologia | Vite 7 · React 19 · TS · Tailwind v4 · Firebase | Firebase Hosting | Ativo, em construção |
| **novo-life-hub** | Tracker de hábitos, saúde, estudo e leitura | Next.js 14 · TS · Tailwind · Firebase | Firebase App Hosting | Ativo |
| **OrganizadorCasos** | Fila de casos por status, com leitura de print por IA | Vanilla JS · Firebase | GitHub Pages | Ativo |
| **Assistente-trabalho** | Descritor de congelação e cirurgia de Mohs | Vanilla JS · Firebase · PWA | GitHub Pages | Ativo |
| **new-money-hub** | Organizador financeiro do casal, com consultor de alocação por IA | Next.js 16 · React 19 · Supabase | Vercel (`gru1`) | Ativo |
| **GuilisAHK** | App desktop de máscaras de laudo | Python · CustomTkinter · pywin32 | Windows (`.exe`) | Ativo, uso diário |
| **Chopperverso** | Contabilidade de produção: casos, lâminas, pontos | Vanilla JS · Firebase · Chart.js · jsPDF | Firebase Hosting | Ativo |
| **MotionTampermonkey** | Os 14 userscripts do Motion + catálogo que os organiza | Userscripts · Firebase | GitHub Pages | Ativo (este repo) |
| **EscalaDasaCongTeste2** | Escala de congelação da DASA Brasília | React · Vite · Tailwind · Firebase | GitHub Pages | Ativo |
| **ArquivosLaudos** | Acervo em árvore de modelos de laudo, compartilhado | React · Vite · Firebase | Firebase Hosting | Estável |
| **clubedolivro** | "Patoteca" — clube do livro com corrida de progresso | React · Vite · Firebase · PWA | Firebase Hosting | Estável |
| **crushgames** | Quatro apps para resolver disputas do casal | Vanilla JS · Firebase | GitHub Pages | Estável |
| **MRV** | Consolidação de atas de briefing de obra com IA | Next.js 16 · Firebase Functions · API Claude | Firebase | Protótipo entregue |
| **roadmaps** | Trilhas de estudo em fluxograma navegável | Vanilla JS · Firebase opcional | GitHub Pages | Estável |
| **GuilisHUOL** | Onze mini-apps da época da residência | HTML monolítico · localStorage | GitHub Pages | Congelado, por afeto |
| **GuilisHub** | Cartão de visita com links de tudo | Vanilla JS | GitHub Pages | Estável |
| **aposta** | Competição de hábitos com garrafinhas de água como moeda | Vanilla JS · Realtime Database | GitHub Pages | Sazonal |
| **BrainPath** | Patologia como infográfico interativo | React 19 · Vite · Tailwind | GitHub Pages | Um tema pronto |
| **FastPath** | Máscaras de laudo como app desktop, com plano de assinatura | Tauri 2 (Rust) · React · TS · Firebase | Desktop | Fundação pronta |
| **Estadiador** | Calculadoras TNM/AJCC que devolvem texto pronto | Vanilla JS, sem build | GitHub Pages | Estável, sendo absorvido |
| **ChopperMoney** | Patrimônio do casal, tema Chopper | React 19 · Vite · TS · Firebase | Firebase Hosting | Sucedido pelo new-money-hub |
| **SiglasLorennaJH** | 278 siglas de patologia geniturinária, busca bilíngue | Vanilla JS, sem dependências | GitHub Pages | Estável |
| **tma** | Mapeador de Tissue Microarray, core a core | Vanilla JS, sem dependências | GitHub Pages | Absorvido pelo Patholytics |
| **Butcherduck** | Manual de macroscopia com área administrativa | Express 5 · SQLite | GitHub Pages (parcial) | Ver ressalva |
| **EscalaCongDasa** | Segunda tentativa de escala, em outra stack | Next.js 14 · Supabase | Vercel | Parado |
| **Remora** | Dashboard desktop com ponte para AutoHotkey | Python · Flet · AHK 2.0 | Desktop | Protótipo parado |
| **guilis-stats** | Primeira tentativa de analytics pessoal | FastAPI · SQLite · Streamlit | Local | Parado |
| **TamagochiSystem** | Mockup de visualização de passos com mascote | React via CDN, sem build | Nenhum | Protótipo |
| **belinha** | Registro de passeios da cachorra | Vanilla JS · Firebase | Firebase Hosting | Demonstração |
| **Sistema-Guilis-Huol** | Mesmo commit do GuilisAHK, em outro repositório | — | — | Duplicata |
| **BookRat** | Nome reservado | — | — | Vazio |
| **OrganizadorCasos2** | Nome reservado | — | — | Vazio |
| **Fastpath2** | Nome reservado | — | — | Só README |

---

# Trabalho e patologia

## Patholytics

A plataforma para onde tudo está convergindo. Reúne, como produto bilíngue com login e
planos, as ferramentas que antes eram sites soltos.

**Stack.** Vite 7, React 19, TypeScript, Tailwind v4 com tokens CSS-first, React Router 7,
i18next (`en` / `pt-BR`), Lucide, `three`, `html2canvas`. Firebase Auth (e-mail/senha e
Google) e Firestore no cliente. Firebase Hosting como SPA estática — o README explica a
escolha: toda tela resolve depois do `onAuthStateChanged`, então não há renderização de
servidor a ganhar, e um `dist/` estático com um rewrite é o deploy mais barato e rápido.

**Dados.** `users/{uid}` com perfil; `users/{uid}/caseLists/{listId}` com estágios
configuráveis (nome, cor, emoji) e `.../cases/{caseId}` com prazo, tags, pendência, log e
ordem em passos de 1000; `users/{uid}/archive/{nodeId}` como árvore de laudos e notas. As
regras do Firestore só deixam o cliente escrever quatro campos do perfil, para ninguém se
auto-promover de plano.

**As nove ferramentas.** Gleason e mapeamento de próstata; mama com RCB, cassetes, tintas e
macro; **Stager com 54 calculadoras** de estadiamento AJCC; TMA Mapper; conversor de campos
(converte contagem de mitoses para /mm² a partir do field number da ocular); arquivo de
laudos e notas; faturamento CBHPM 2019; manual de macroscopia; congelação e Mohs. Cada rota
é `lazy()` com `Suspense` e um `ToolErrorBoundary` próprio.

**Design.** Escuro por padrão, tokens no `src/index.css`: fundo `#0A0E14`, acento violeta
`#7C5CFF`, Inter para prosa e **JetBrains Mono para todo número** — há um utilitário
`.tabular` só para isso. Numa ferramenta onde o número é o conteúdo, alinhar dígito com
dígito é decisão de conteúdo, não de estética.

## GuilisAHK (e Sistema-Guilis-Huol)

O app de mesa que roda no seu dia. Migração do legado AutoHotkey para Python — os 128
arquivos `.ahk` originais continuam no repositório como fonte da portabilidade.

> `Sistema-Guilis-Huol` é o **mesmo commit** em outro repositório. São o mesmo projeto.

**Stack.** Python com CustomTkinter, empacotado por PyInstaller num `Guilis.exe`.
Dependências Windows: `win32gui`, `pyperclip`, `pyautogui`.

**O truque central** está em `core/window_manager.py`. Uma thread daemon consulta a janela
em primeiro plano a cada 150 ms e memoriza a última que **não** seja do próprio Guilis.
Quando a máscara abre e rouba o foco, o alvo já está guardado; `paste_text()` então salva o
clipboard antigo, copia o texto, devolve o foco à janela alvo e manda `Ctrl+V`. É o que
permite uma ferramenta flutuante escrever dentro do Motion sem integração nenhuma.

**Contrato das máscaras.** `ui/base_mask.py` é a classe-mãe; toda máscara é um arquivo em
`masks/<categoria>/` que implementa `_setup_ui()` e `_build_text()` e expõe
`open(root, wm, on_collect=None)`. Esse `on_collect` é o que permite a mesma máscara servir
como laudo, como nota dentro do compositor ou como atalho de texto — um parâmetro que
compra três usos.

**Funcionalidades.** Hotkeys globais (`Ctrl+F9` barra lateral, `Ctrl+F10` Smartcomplete,
`Ctrl+1..9` especialidade), spotlight de busca sobre todas as máscaras indexadas, expansor
de texto global com gatilhos digitados em qualquer aplicativo, e um compositor de notas que
acumula, reordena e formata. Catorze categorias migradas, de Gastro a Imuno-histoquímica.

**Acervo.** `guilis_py/cappprotocols/` guarda 86 PDFs oficiais dos CAP Cancer
Protocols. É a fonte de verdade que também alimenta o Estadiador e o Stager do Patholytics.

## Chopperverso

Onde a produção vira número. Cada caso laudado vira uma entrada com FAP, data, tipo de
exame, lâminas e **pontos** — a métrica de produtividade. Tema do Chopper, com dezesseis
artes do personagem em situações diferentes.

**Stack.** JavaScript puro, Firebase compat por CDN, Chart.js com treemap, jsPDF com
autotable. Firebase Hosting servindo a raiz do repositório.

**Dados.** `users/{uid}/entries` e `users/{uid}/congelacoes`, mais um `directory/index`.
Dezesseis tipos de exame, cada um com cor própria.

**O elo com o Motion.** `js/motion-script.js` não é um userscript — é o **gerador** de um.
O app monta, para cada usuário, um loader pessoal contendo só a configuração (endpoint com
token, senha de assinatura, lista de tipos) e o entrega como download. A lógica genérica
fica num motor buscado ao vivo do raw do GitHub. O fluxo completo é
**Motion → userscript → Cloud Function → `users/{uid}/entries` → site, PDF e widget**.

**Widget de iPhone.** `scriptable/ChopperVerso-Widget.js` mostra casos, lâminas e pontos do
dia. Não usa o SDK do Firebase: fala a API REST direto, faz login uma vez e guarda **só o
refresh token no Keychain** do iOS. Tem uma janela de horas ativas das 8h às 22h — fora
dela nem pede renovação, para não gastar o orçamento de atualização do iOS de madrugada
enquanto ninguém está lançando caso.

## OrganizadorCasos

A fila do que está em andamento: cada caso com um status (não visto, visto não laudado,
laudado, parcialmente montado, pendência, liberado) e uma ordem de impressão.

**Stack.** JavaScript vanilla em módulos ES, Firebase v9 modular, SheetJS vendorizado para
exportar Excel. GitHub Pages.

**Dados.** `users/{uid}/organizadores/{orgId}/casos`. Vários organizadores independentes
(por hospital, por rotina), com o ativo na URL — então dá para deixar dois abertos em abas
diferentes. A migração do formato antigo acontece no primeiro acesso e **não apaga a
origem**: os documentos velhos ficam como backup.

**A peça única do acervo.** É o único app web que chama a API da Anthropic: você fotografa
a tela do Motion, o print vai por um Cloudflare Worker que serve de proxy, e o Claude devolve
a lista de nomes e FAPs. Tem fallback por expressão regular para quando a resposta vem
truncada, com aviso na tela. A chave fica no `localStorage` do navegador.

## Assistente-trabalho

Monta o texto da macroscopia, o mapeamento de cassetes e o resultado de **exame de
congelação** e de **cirurgia de Mohs**, pronto para colar no laudo.

**Stack.** HTML, CSS e JavaScript puros, sem build. Firebase compat por CDN com login
Google. GitHub Pages, instalável como PWA.

**Como funciona.** Um registro `MASCARAS` despacha, por tipo de peça, as funções que
constroem macro, nome da peça, cassetes e resultado. Tireoide, mama, **linfonodo sentinela**
(com bolinhas numeradas clicáveis, cassetes por linfonodo, e a frase final montada sozinha:
*"Macrometástase de carcinoma em 01 de 03 linfonodos avaliados (01/03)"*) e fragmentos.
O módulo de Mohs tem nove tintas nomeadas e desenha o esquema em SVG por quadrantes, com
cronômetro de estádio. A exportação gera o laudo em HTML com fonte serifada para impressão,
imagem, e os diagramas em versão papel.

> **Ressalva.** O `CONTEXTO.md` do repositório descreve outro aplicativo — um controle de
> produção com sessões, casos e cronômetro. Essa funcionalidade migrou para o Chopperverso.
> Sobraram cerca de dez arquivos de view no repositório (`today`, `history`, `records`,
> `stats`, `calendario`, `pendencias`, `charts`, `timer`, `actions`, `events`) que o
> `index.html` não carrega mais.

## ArquivosLaudos

Biblioteca hierárquica de textos de laudo, sem limite de profundidade
(`LAUDOS → Gastro → Estômago → Gastrite → Erosiva`), **compartilhada** entre os usuários
autenticados — quem cria fica creditado.

**Stack.** React 18 com Vite, `reactflow`, Firebase Auth e Firestore, Firebase Hosting com
deploy por GitHub Actions.

**Dados.** Uma única coleção plana `nodes`, com `parentId`, `type` (`category` ou `laudo`),
rótulo e conteúdo. As raízes são virtuais — `root` e `root_notas` não existem no banco. A
árvore inteira é assinada de uma vez e montada no cliente, o que funciona porque o acervo é
pequeno. O Patholytics repete exatamente esse desenho na coleção `archive`, e documenta o
import por JSON como caminho de migração.

## Estadiador

Você abre a calculadora do caso, informa os parâmetros e recebe o **texto do estadiamento
pronto para copiar**.

Site estático em módulos ES, sem build nenhum. A arquitetura é a que se repete no acervo
inteiro: um motor genérico (`js/engine.js`) que renderiza o formulário, calcula e copia; um
módulo por tumor descrevendo campos e regras; e um registro central. Adicionar uma
calculadora nova é criar um arquivo e somar uma linha — e o README diz isso em três passos.
Treze calculadoras aqui; o Stager do Patholytics é o port direto e ampliado para 54, com os
mesmos nomes de arquivo.

O aviso no rodapé é do próprio autor: é ferramenta de apoio, a conferência do laudo é
sempre do profissional.

## BrainPath

Consulta de patologia em que a informação chega como arte clicável, não como parágrafo.
O README abre com cinco regras que valem para toda peça do site — e são regras de verdade,
não intenção:

1. Nada de parágrafo na primeira tela: o estado inicial é geometria, cor e rótulo curto.
2. Profundidade em três níveis fixos — `glance`, `brief`, `detail` — iguais no site inteiro.
3. Sem moldura: nenhum card, nenhuma borda de widget.
4. Recuperação antes da revelação: com o modo treino ligado, todo elemento pergunta antes de contar.
5. Estado na URL: hotspot aberto e camada ativa viram query params, e o botão voltar desfaz passo a passo.

**Stack.** React 19, Vite, Tailwind v4, Framer Motion, oxlint. GitHub Pages por Actions.
Sem banco: conteúdo é código. Um tema por diretório, artes SVG registradas por nome, e
temas ainda não revisados por um patologista ficam marcados `draft: true` — **e o site
mostra isso ao leitor**. Hoje há um tema pronto, linfomas B de pequenas células.

## FastPath

O mesmo problema do GuilisAHK, resolvido como produto: máscaras que digitam o laudo por
você, com marketplace e assinatura no plano.

**Stack.** Tauri 2 com backend em Rust, React 18, TypeScript, Tailwind, Zustand persistido
(local-first), Firebase Auth e Firestore com trial automático de quinze dias e o campo
`plan` protegido pelas regras.

**O que o torna interessante.** São **duas janelas** declaradas no `tauri.conf.json`: a
principal, e um painel de 404×800 sem decoração, transparente, sempre no topo e fora da
barra de tarefas — invisível até a hotkey global chamar. Os comandos em Rust cobrem
clipboard, colagem simulada e digitação tecla a tecla. O motor de máscaras
(`src/lib/maskExecutor.ts`) faz interpolação, blocos condicionais aninhados e validação,
**com testes unitários** — o único motor do acervo que tem.

Pendente: ditado por voz de verdade (a interface é stub), sincronização das máscaras e o
marketplace.

## SiglasLorennaJH

278 siglas de patologia geniturinária em seis categorias, extraídas de um `.docx` oficial.
Busca por código (`336`, `ATYP`, `PNI`) ou por termo clínico, um clique copia o código já
no formato que o sistema de laudos espera (`\336`). Interface em português e inglês, mas as
descrições clínicas ficam **em inglês de propósito**, exatamente como no documento original,
para preservar a precisão técnica. Atalhos `/` e `Esc`. Funciona offline, sem dependência
nenhuma.

## tma

Informa quantas linhas e colunas de cores tem o Tissue Microarray, o site monta o mapa
numerado e te leva core a core, destacando o atual. `Ctrl+Enter` salva e avança. No fim,
"copiar resultados" empilha tudo na ordem do mapa, **e cores vazios viram linha em branco**
— para que cada linha continue casando com sua posição quando você colar numa coluna de
planilha. Autosave local, nenhum dado sai do navegador. Já reimplementado dentro do Patholytics.

## Butcherduck

Manual de macroscopia com protocolos navegáveis por sistema, e uma área administrativa para
editá-los.

É o **único projeto com servidor próprio**: Express 5 com SQLite, tabelas `sistemas` e
`protocolos`, semeadas de um arquivo de dados na primeira execução.

> **Duas ressalvas.** O GuilisHub aponta para o GitHub Pages, que não roda Express — no ar
> está apenas a página estática com os dados embutidos, sem a administração. E a senha de
> administrador tem um valor padrão embutido no código (`server.js:11`), usado quando a
> variável de ambiente não está definida.

## GuilisHUOL

Onze mini-aplicativos da época da residência no HUOL, cada um um `index.html` monolítico
com CSS e JavaScript embutidos, tudo em `localStorage`, sem backend. Escalas de residentes,
dermatologia, biópsias e citologia, PICQ; solicitação e tabela de imuno-histoquímica;
máscara e calculadora de próstata; citologia cervical; sorteador.

É a primeira geração — e o GuilisHub o guarda numa seção própria chamada
"Onde tudo começou 💙". Vale como marco: a distância entre este repositório e o Patholytics
é a história técnica inteira.

## Remora

Dashboard de mesa em Python com Flet, com vistas de TNM, protocolos CAP e códigos. O que
interessa é `src/bridge/ahk_bridge.py`: uma ponte que dispara scripts AutoHotkey 2.0 por
subprocesso para escrever na janela do Motion. É uma segunda tentativa da ideia do
GuilisAHK, com arquitetura diferente, parada no estágio de protótipo.

---

# Automação do LIS Motion

## MotionTampermonkey — este repositório

Catorze userscripts que injetam funcionalidade em dois sistemas fechados: o **Motion**
(`motionap.dasa.com.br`, o LIS de anatomia patológica, em stack legada com Prototype.js) e
o **Philips PathologySuite** (`patologia-*.dasa.com.br`, o visualizador de lâminas, em
Angular com WebGL e Fabric.js). Mais um catálogo em GitHub Pages que os organiza no
Firestore por categoria, versão e changelog, com botão de instalação direta no Tampermonkey.

**Os scripts, por tela.**

| Script | Onde roda | O que faz |
|---|---|---|
| Buscador de Casos | Lista de casos | Caixa de busca ancorada à última aba; filtra por nome ou FAP ignorando acento e espaço, e `Enter` abre o caso |
| Extrator de Casos | Monitor de Pendências | Lê a grade inteira, exporta TSV, CSV e JSON, e manda os FAPs para o OrganizadorCasos |
| Extrator de Links de Lâminas | Popup de imagens | Agrupa as lâminas por servidor e mostra a data mais recente |
| Prancheta Macro | Primeira página do caso | Copia os títulos dos frascos da macroscopia |
| Motion → Chopperverso | Liberação | Coleta FAP, lâminas, pontos e tipo, e envia para o webhook |
| Botão de Liberação | Liberação | Preenche a assinatura e confirma |
| Som de Erro | Todo o Motion | Troca o som de erro do sistema |
| Telepato Contador | Telepatologia | Contador de mitoses, linfonodos e cassetes |
| Navegação por Toque | Visualizador Philips | Arrasto, pinça e toque duplo na lâmina |
| Gamepad | Visualizador Philips | Navega a lâmina com controle de Xbox |

**Onde está a engenharia de verdade.**

*Ancoragem geométrica, não por identificador.* No visualizador Philips o canvas tem
identificador gerado por sessão, então não dá para procurá-lo pelo nome. O script acha o
**maior canvas com pelo menos 200 px de lado** e sobe pela árvore enquanto o ancestral tiver
até o dobro da área do canvas — é assim que chega ao contêiner que abriga todas as camadas.
A caixa de busca do outro script faz o mesmo tipo de coisa: em vez de um seletor frágil,
copia a geometria da última aba e se posiciona ao lado.

*Calibração em vez de suposição.* O visualizador não usa o passo de roda padrão. O script
escuta os eventos de roda reais, guarda as últimas 21 amostras e usa a **mediana** como
passo — descobriu assim que ali o valor nativo é 2, e não 100. Há dois scripts de console
no repositório que foram os instrumentos dessa descoberta: um espiona quinze tipos de evento
e detecta quais bibliotecas a página carrega, o outro dispara oito variantes de evento de
roda e registra qual delas a aplicação aceita.

*As armadilhas estão documentadas.* O `MOTION_ANCHORS.md` tem 315 linhas mapeando sete
telas — seletores, regras de reconhecimento e, o mais valioso, as armadilhas. Que o
Prototype.js substitui `Array.prototype.filter` por uma versão que não passa o terceiro
argumento, e por isso há um laço `for` explícito com o motivo escrito ao lado. Que usar um
observador de mutação no `body` para manter um botão vivo cria laço infinito, e por isso
aquele script usa sondagem idempotente. Que a grade recarrega a cada 60 segundos. Que o
Fabric.js cancela o `touchstart` e mata os eventos de compatibilidade, e por isso os eventos
sintéticos precisam se declarar como mouse.

*O padrão motor separado.* Dois scripts têm um problema: o arquivo instalado carrega a
senha de assinatura e o endpoint pessoal, então atualizá-lo automaticamente apagaria esses
dados. A solução separa as duas coisas — o arquivo instalado tem **só a configuração** e
busca a lógica ao vivo do raw do GitHub, guardando uma cópia em cache que funciona offline.
Todos os seletores moram no motor, que pode ser corrigido sem ninguém reinstalar nada. É o
mesmo padrão "motor genérico + dados por caso" do Estadiador e do GuilisAHK, aplicado ao
problema de distribuição.

*Os apps conversam.* O Extrator de Casos serializa os FAPs em base64 e abre o
OrganizadorCasos com eles na URL, copiando o JSON como plano B se o navegador bloquear o
pop-up. O Chopperverso gera o userscript que alimenta o próprio Chopperverso. Não são
ferramentas isoladas: é um circuito.

> **Ressalvas.** O `MOTION_ANCHORS.md` diverge do código em dois pontos — descreve o campo
> de senha e o botão de confirmar com seletores que os motores não usam mais. E o Firestore
> do catálogo está com regras abertas: quem tiver o link lê e escreve.

---

# Escala e gestão

## EscalaDasaCongTeste2

A escala de congelação dos patologistas da DASA Brasília, e a que está no ar.

React 18 com Vite, Tailwind, `date-fns`, recharts e `html-to-image`, sobre Firebase Auth e
Firestore, publicada no GitHub Pages. Tem cadastro de patologistas com regimes distintos
(normal, final de semana, plantão fixo), férias e desligamentos; geração da escala com
regras de restrição; feriados cadastrados à mão; balanço acumulado por patologista com
gráficos; histórico de escalas publicadas; exportação da escala como imagem; e um sorteador
para resolver disputa, que de propósito não salva nada.

## EscalaCongDasa

A mesma escala, tentada antes em outra stack: Next.js 14 com App Router, TypeScript,
Tailwind, Supabase e Vercel. O README descreve regras de negócio bem específicas — rodízio
independente por hospital e por dia, auxiliar de fim de semana, e até uma regra nominal
para uma colega que fica nas quartas num hospital determinado.

Está parado, e a implementação que venceu foi a outra. É o **único projeto de patologia em
Supabase** do acervo inteiro.

---

# Vida pessoal e finanças

## novo-life-hub

O tracker de hábitos, e um dos dois repositórios mais elaborados. O nome interno ainda é
"Tamagochi Me".

**Stack.** Next.js 14 com App Router, TypeScript, Tailwind. Firebase Auth e Firestore no
cliente, Admin SDK nas rotas de API. Publicado em **Firebase App Hosting** (Cloud Run), com
GitHub Actions que primeiro verifica tipos e build e só então cria o rollout.

**Dados.** Tudo gira em torno de `users/{uid}/daily_logs/{YYYY-MM-DD}` — água, passos,
distância, páginas lidas, academia, creatina, minutos de estudo e de meditação, um documento
por dia. Datas sempre no fuso de São Paulo. Ao lado, coleções para livros, sessões de
leitura, filmes, áreas de estudo, sessões de meditação, aeróbicos, treinos e recordes.

**Treze módulos**: hidratação, passos, creatina, exercícios, estudo, leitura, filmes,
meditação, expediente, calendário, metas, recordes e o dashboard.

O mais conceitual é o **expediente**: fatia o dia de trabalho em blocos de cinquenta minutos
com pausas, encaixando uma janela de estudo no meio. Os blocos guardam timestamps absolutos
no Firestore — então fechar a aba ou o computador dormir não perde nada. O de **recordes**
computa streaks, dias perfeitos e troféus em funções puras, e dispara notificação quando
você bate um recorde.

**Como os dados entram.** Aqui está a ideia que se repete no acervo: coleções `nfc_tokens` e
`health_tokens` guardando `{token, userId}`, e o token viajando na query string. São nove
endpoints desenhados para caber numa URL de Atalho do iPhone ou num firmware — encostar o
telefone num adesivo NFC marca a creatina; o Health Auto Export despeja passos e distância;
o cronômetro de estudo responde com a mensagem **já formatada para a notificação do Atalho**.

**E dois firmwares ESP32.** Um M5StickC Plus2 que escreve direto no Realtime Database com
botões físicos, e um display de 3,2 polegadas somente-leitura que percorre hoje, semana, mês
e ano, com cache na memória não volátil para continuar mostrando algo sem WiFi. O endpoint
que alimenta esse display devolve os rótulos **sem acento**, porque a fonte do display é
ASCII puro.

## new-money-hub

O organizador financeiro do casal, e o projeto mais "pensado como produto" do acervo.

**Stack.** Next.js 16 com React 19 e Server Actions, TypeScript, Tailwind v4, **Supabase**
com Postgres e Row Level Security, SDK da Anthropic. Vercel na região de São Paulo.

**O princípio que organiza o modelo de dados**, escrito no CLAUDE.md: ativos **nunca** são
compartilhados. Cada pessoa tem suas próprias posições, mesmo quando o papel é o mesmo, e a
visão de casal é soma na camada de visualização — nunca registro conjunto. O preço de
mercado vive separado, em `market_instruments`, para não duplicar cotação entre duas pessoas
que têm o mesmo papel. São 23 tabelas, num schema base mais dez migrations versionadas.

**Dois cron jobs**, e o limite explica o desenho: o plano Hobby da Vercel permite dois, então
o job de preços também atualiza os fundamentos. Um sincroniza o banco por Open Finance; o
outro busca cotações da B3, dos Estados Unidos, de cripto, o dólar do Banco Central e os
títulos do Tesouro.

**O Consultor** é o módulo mais ambicioso, com uma especificação própria de 338 linhas.
Dado um valor de aporte, roda seis etapas: monta o universo de candidatos, pré-filtra por
código para uns cinquenta nomes, pede ao **Opus 5** a ordenação e os pesos, classifica
notícias com **Sonnet 5**, converte pesos em quantidades, e gera o relatório narrativo com
os avisos tributários. A divisão está declarada na especificação: *filtros e contas
determinísticos em código, IA só para julgamento*. E o custo é contabilizado por chamada,
com tabela de preços no código e um orçamento declarado por rodada.

Há scraping de fundamentos, com o motivo documentado — o plano gratuito da API devolve nulo
em quase tudo — e o reconhecimento honesto da fragilidade: se o site mudar, o módulo degrada
para "só alocação".

## ChopperMoney

O antecessor do new-money-hub: patrimônio do casal com tema do Chopper. React 19 com Vite e
TypeScript, Firebase completo com Cloud Functions, recharts. Cobre renda fixa com marcação
por curva, renda variável no Brasil e nos Estados Unidos, cripto, dividendos, reserva de
emergência e projeções. Tem um snapshot diário agendado que só roda em dia útil. Cada
posição é carimbada com o dono, e a visão combinada do casal é a soma.

Foi sucedido pelo new-money-hub — que trocou Firebase por Supabase, e foi a primeira vez que
isso aconteceu no acervo.

## roadmaps

Trilhas de estudo como fluxograma navegável: fases avançam da esquerda para a direita,
trilhas correm em paralelo, e cada bloco abre um painel com recursos, estado, anotações e
histórico. Cinco roadmaps de patologia.

A estrutura é a de sempre — um motor e um arquivo de dados por tema, com a receita de três
passos no README. O progresso é local-first: vive no `localStorage`, e **com** login Google
sobe para o Firestore e sincroniza entre aparelhos. O site funciona inteiro sem login e sem
internet; a nuvem é opcional, não requisito.

## guilis-stats

A primeira tentativa de analytics pessoal, e o ancestral direto do novo-life-hub. FastAPI com
SQLAlchemy e SQLite, painel em Streamlit com Plotly, arquivos `.bat` para subir cada parte —
roda na máquina, sem hospedagem.

Uma tabela só, uma linha por dia, misturando métricas automáticas do Apple Health com
manuais de patologia (lâminas vistas, casos analisados). O conceito que sobreviveu é o
**DQS**, um índice diário de 0 a 1 com pesos que somam exatamente um — há um `assert`
garantindo isso.

> A autenticação é uma chave estática com valor padrão no código e CORS aberto
> (`backend/main.py:19` e `:29`). Como roda só na rede local, é consistente com o uso — mas
> vale saber antes de expor.

## TamagochiSystem

Mockup de visualização de passos com um mascote que muda de humor conforme a meta. React por
CDN, sem build. Os dados são sintéticos, gerados por um RNG com semente fixa para a série
ficar estável entre recarregamentos — detalhe cuidadoso para um protótipo.

Nunca foi hospedado, mas o conceito está vivo dentro do novo-life-hub, cujo nome interno
ainda é "tamagochi-me".

---

# Feito para outras pessoas

## clubedolivro — "Patoteca"

Clube do livro entre amigos, onde todo mundo lê o mesmo livro e compete visualmente por
progresso. Estética de biblioteca vintage: madeira escura, papel envelhecido, serifa e
dourado.

**Stack.** React 18 com Vite, Firestore em tempo real, Storage para avatares e capas,
Firebase Hosting. **Sem Firebase Auth** — a identidade é um UUID no `localStorage`, e as
regras validam formato em vez de identidade.

**As boas ideias.** A estante onde cada pessoa é um livro-termômetro que se enche de baixo
para cima e reordena ao vivo. A cor escolhida por cada leitor pintando a barra — e o trecho
avançado nas **últimas 24 horas** saindo em dourado, para dar de relance quem devorou o livro
de ontem para hoje. Séries com vários volumes abertos ao mesmo tempo, porque uma série não se
lê em fila indiana. E o vencedor apurado por **quem chegou primeiro**, não por maior
percentual.

**Push.** Web Push com VAPID, entregue por um Cloudflare Worker — a chave privada precisava
morar em algum lugar, e não havia servidor. O Worker lê as inscrições pela API REST do
Firestore, então basta a chave pública. O service worker **de propósito não faz cache**, com
a justificativa escrita: um service worker que serve arquivo velho é a forma mais fácil de
deixar metade do clube presa numa versão antiga.

**Widget de iPhone** que mostra o livro atual e a corrida, lendo o Firestore por REST sem
login, adaptando-se a três tamanhos.

> **Ressalva.** O gatilho do workflow de publicação ainda aponta para uma branch de
> funcionalidade (`.github/workflows/publicar.yml:14`), não para a principal.

## crushgames

Quatro aplicativos para resolver disputas do casal sem briga: uma roleta de onde comer
(com as opções honestas "Lara escolhe", "Guilherme escolhe" e "se virar em casa"); notas de
comida com foto; um comparador de imóveis com status de visita, mapa e distância; e uma lista
de compras em tempo real.

JavaScript puro, sem build, Firestore por CDN, GitHub Pages. Sem autenticação, com a decisão
assumida nas regras: é um app privado do casal. O mapa usa só serviço gratuito e sem chave —
Nominatim para geocodificação, OSRM para rota, Leaflet com tiles do OpenStreetMap.

**O coletor de anúncios** (`tools/moving-out-scraper.user.js`) é o userscript mais sofisticado
fora deste repositório. Roda em oito portais de imóveis e extrai os dados numa **cascata de
três fontes por campo**: dados estruturados da página, o estado embutido do framework, e por
último heurística de texto. Essa terceira camada tem expressões regulares de exclusão com o
motivo escrito — sem elas, "Valor R$/m²: 57" virava a área do imóvel. As fotos são
redimensionadas e comprimidas com orçamento total de 800 KB, margem calculada contra o limite
de 1 MiB por documento do Firestore. E entrega o resultado por dois caminhos conforme o
tamanho, limpando a URL depois para que um F5 não duplique o registro.

## aposta

Competição de hábitos entre duas pessoas, com moeda própria: **garrafinhas de água**. Oito
hábitos, metas diferentes por pessoa, bônus por dia perfeito, streak escalonado a cada três
dias úteis, e temporadas que zeram o placar. Realtime Database, quatro páginas estáticas, e
todas as regras concentradas num arquivo de configuração declarado como única fonte da
verdade.

Tem um detalhe de engenharia que merece nota: há um contorno comentado longamente para abas
antigas em cache — a temporada nova mora numa chave diferente e a antiga ficou congelada,
porque a versão velha do site zerava o dia toda vez que via uma temporada nova.

## MRV

O único projeto que não é pessoal nem de patologia. Ferramenta interna que lê atas de reunião
de briefing de instalações de obra, extrai os temas de forma estruturada com o Claude, e
acumula um histórico que aponta quando **o mesmo assunto reaparece em outra obra** — inclusive
quando a redação é diferente.

**Stack.** Next.js 16, Firebase com Functions em São Paulo, API da Anthropic. Testes com o
runner nativo do Node e testes de regras com emulador.

**Decisões visíveis no código.** O upload vai direto do navegador para o Storage, e não em
base64 dentro da chamada, porque atas em DOCX com capturas de tela embutidas estouram o
limite de payload. A extração usa **tool use com JSON Schema**, com enums fechados — nada de
interpretar texto livre. O cliente da Anthropic é construído preguiçosamente, para o módulo
não falhar no deploy quando a secret ainda não foi resolvida. E a chave vive só no Secret
Manager: nunca chega ao navegador.

A escolha de modelo tem justificativa escrita ao lado: ata de engenharia é texto denso com
tabela e croqui, então vale o modelo mais capaz.

## belinha

Registro dos passeios da cachorra: cronômetro ao vivo, a pergunta inevitável ao encerrar,
adição retroativa e uma página de estatísticas. Vanilla com Firestore, Firebase Hosting.
**É uma demonstração** — está aqui por completude, não como projeto em uso.

---

# GuilisHub

Não é bem um projeto: é o índice de todos os outros. Um cartão de visita onde cada card leva
a um site, com legenda explicando a função. Todo o conteúdo mora num único arquivo de dados —
a mesma ideia de sempre, aplicada até ao portfólio.

É a fonte de verdade mais confiável sobre **o que está de fato em produção**, e organiza
tudo em três seções: Otimização de Trabalho, "Onde tudo começou 💙" (o GuilisHUOL) e Pessoal.

---

# O padrão

Trinta e três repositórios, e há um jeito de fazer que atravessa todos.

## A ferramenta nasce de uma dor própria e específica

Nenhum projeto aqui é genérico. Não existe "app de produtividade" — existe *contar mitoses
com o dedo enquanto olha na ocular*, *achar o caso da paciente numa lista de trinta*, *não
esquecer de tomar creatina*, *saber quem do clube leu mais desde ontem*. O escopo é sempre
o tamanho exato do atrito, e isso é o que faz as ferramentas serem realmente usadas.

O corolário: quase tudo tem **um usuário conhecido**. O Patholytics tem planos e trial, o
FastPath tem preço definido, mas o primeiro usuário é sempre você — e os outros são a
namorada, os amigos do clube, os colegas do serviço. É software feito para gente que você
consegue nomear.

## Três gerações de stack, escolhidas pelo tamanho do problema

Elas convivem hoje no acervo, e a escolha não é modismo — é proporção:

1. **HTML monolítico** com CSS e JavaScript embutidos e `localStorage`, sem backend.
   GuilisHUOL, tma, SiglasLorennaJH. Para o que é pequeno, offline e pessoal.
2. **Vanilla multi-arquivo com Firebase por CDN, sem build.** Chopperverso,
   OrganizadorCasos, Assistente-trabalho, crushgames, roadmaps, este repositório.
   Ganha sincronização e tempo real sem pagar o preço de um bundler.
3. **React ou Next com TypeScript e Tailwind, com build.** Patholytics, BrainPath,
   FastPath, novo-life-hub, new-money-hub, clubedolivro.

A escada é subida quando precisa, não por hábito. E a descida também acontece: o
Estadiador, que é do eixo de trabalho e poderia ser React, é módulo ES puro sem build —
porque não precisava.

## Registry data-driven: "adicionar um item novo é uma linha"

Esse é o padrão dominante do acervo, e aparece em praticamente todo projeto que cresce:

| Projeto | O registro | Adicionar um item |
|---|---|---|
| Estadiador | `js/registry.js` | Criar o módulo do tumor, somar uma linha |
| Patholytics | `src/data/tools.ts` | Registrar a ferramenta |
| BrainPath | `src/content/registry.ts` | Criar o diretório do tema, registrar |
| roadmaps | `Roadmaps.registrar({...})` | Criar `data/tema.js`, somar um `<script>` |
| GuilisHub | `sites.js` | Somar um objeto |
| GuilisAHK | `SECTIONS` por categoria | Criar o arquivo da máscara, registrar |
| Assistente-trabalho | `MASCARAS` | Registrar as funções do tipo de peça |

E em todos os casos o README traz a receita em três ou quatro passos. Isso é documentação
escrita para o próprio autor daqui a seis meses — e é o que faz esses projetos continuarem
crescendo sem virarem bolo.

## Motor genérico, dados por caso

A outra metade do mesmo pensamento. O motor sabe renderizar, calcular e copiar; os dados
descrevem o que é verdade sobre aquele caso específico. `Estadiador/js/engine.js`,
`FastPath/src/lib/maskExecutor.ts`, `GuilisAHK/ui/base_mask.py`, os artifacts do BrainPath.

E o padrão reaparece num lugar inesperado: no Motion, o arquivo instalado no Tampermonkey é
só configuração e o motor vem de fora. A mesma separação, resolvendo um problema de
distribuição em vez de um problema de conteúdo.

## Firebase é o default; a exceção é recente e deliberada

Doze dos catorze projetos com backend usam Firebase. O `new-money-hub` é a única exceção —
e é simultaneamente o único em Supabase, o único na Vercel, o único com migrations SQL
versionadas e o único com Row Level Security de verdade. Não parece acidente: é o projeto
mais novo, o mais pensado como produto, e o único com uma especificação de produto completa
escrita antes do código.

O modelo de dados é quase sempre `users/{uid}/<coleção>` com regras do tipo "só o dono", em
duas variantes: um documento único com array quando o volume é pequeno, subcoleção quando
cresce.

## O documento por dia

`daily_logs/{YYYY-MM-DD}` no novo-life-hub, uma linha por dia no guilis-stats, estado por
data no aposta. As mesmas métricas atravessam três gerações — água, passos, estudo, leitura,
academia, meditação — com metas quase idênticas. É a mesma pergunta sendo respondida com
ferramentas cada vez melhores.

## Árvores como coleção plana

Sempre `parentId` numa coleção única, com raízes virtuais que não existem no banco, e a
hierarquia montada no cliente depois de assinar a coleção inteira. `ArquivosLaudos.nodes`
com `root` e `root_notas`; `Patholytics.archive` com `root_reports` e `root_notes`. Funciona
porque o acervo é pequeno, e é uma escolha consciente de simplicidade sobre escalabilidade
que não vai fazer falta.

## "Sem login" é decisão escrita, não desleixo

crushgames, belinha e clubedolivro rodam com regras abertas — e nos três há um comentário
assumindo o trade-off. Um diz "app privado do casal"; outro diz, com todas as letras, que
aquilo é segurança por obscuridade e não uma barreira real. O clubedolivro vai além:
identidade por UUID no navegador, e regras que validam **formato** em vez de identidade.

Onde há dinheiro ou trabalho — ChopperMoney, Chopperverso, novo-life-hub, Patholytics — aí
tem autenticação. O critério é o risco, e está aplicado com coerência.

## O par "token + query string" como API de automação

`nfc_tokens` e `health_tokens` no novo-life-hub, `webhook?token=` no Chopperverso. É
autenticação desenhada para **caber onde não cabe um OAuth**: numa URL de Atalho do iPhone,
num firmware ESP32, num userscript. Nove endpoints usam esse padrão, e vários respondem com
a mensagem já formatada para a notificação do Atalho — a API foi escrita pensando em quem a
consome.

## O iPhone é a interface primária

Aparece em quase tudo: widgets Scriptable que falam REST direto com o Firestore sem SDK,
guardam só o refresh token no Keychain e têm janela de horas ativas para não gastar o
orçamento de atualização do iOS; Atalhos e adesivos NFC; Health Auto Export; PWA instalável.
O computador é onde se lauda; o telefone é onde se registra e se consulta.

Push é sempre Web Push com VAPID — nunca FCM, e nunca ntfy, apesar do nome de uma branch
sugerir o contrário.

## Gamificação obrigatória, isolada em função pura

Streaks, recordes, troféus, dia perfeito, coroa para o primeiro lugar, mascote com humor,
garrafinha de água como moeda, personagem de anime como tema. Nenhum desses apps é CRUD
seco. E a lógica de jogo tende a ficar em funções puras e testáveis, separada da interface.

## IA só onde há julgamento, e sempre no servidor

Três usos, e os três com a mesma disciplina. No MRV, extração estruturada com tool use e
JSON Schema — nada de interpretar texto livre. No new-money-hub, a especificação diz
explicitamente: *filtros e contas determinísticos em código, IA para julgamento*, com
modelo mais capaz para ranquear e mais barato para narrar, e o custo contabilizado por
chamada. No OrganizadorCasos, leitura de print — o único caso em que a chave fica no
cliente, e mesmo assim passando por um proxy.

Nenhum projeto usa IA para fazer o que uma conta resolve.

## Custo é restrição de design de primeira classe

Nominatim, OSRM, OpenStreetMap, CoinGecko, o Banco Central, Google News RSS, o CSV do
Tesouro — serviço gratuito e sem chave sempre que possível. E as decisões de arquitetura
saem disso: o plano Hobby da Vercel permite dois cron jobs, então os fundamentos rodam
dentro do job de preços; a API paga devolvia nulo no plano grátis, então há scraping, com o
risco anotado. Não é sovinice: é o motivo pelo qual trinta e três projetos conseguem existir
ao mesmo tempo.

## O produto final é texto pronto para colar

É o denominador comum de quase todas as ferramentas de trabalho. O Estadiador devolve o
texto do estadiamento; as siglas copiam no formato que o sistema espera; o TMA empilha os
resultados para colar numa coluna; o GuilisAHK e o FastPath existem literalmente para isso.

E quando não é clipboard, são três rotas bem definidas: PDF com jsPDF, imagem com
html-to-image ou html2canvas, e HTML para impressão com fonte serifada de laudo.

## Migração inline, e nunca apagando a origem

Não existe script de migração separado no acervo. A conversão de formato mora no código que
lê o dado, executa no primeiro acesso, e deixa os documentos antigos onde estavam — o
OrganizadorCasos diz isso com todas as letras: *ficam como backup*.

## A documentação registra decisão, não comportamento

Esse talvez seja o traço mais distintivo. Os comentários e READMEs raramente dizem o que o
código faz — dizem **por que ele é assim**. Por que o service worker não faz cache. Por que
existe um laço `for` em vez de `filter`. Por que a temporada velha ficou congelada numa
chave. Por que o cliente da Anthropic é preguiçoso. Por que o upload vai direto para o
Storage. Por que aquela expressão regular precisa excluir "R$/m²". Por que Vite e não Next.

O `docs/consultor-alocacao.md` e o `CLAUDE.md` do new-money-hub são especificações de
produto completas, com seção de "o que NÃO fazer nesta primeira versão". O
`MOTION_ANCHORS.md` deste repositório é um mapa de armadilhas. Esse hábito é o que faz o
acervo ser retomável.

## O contraponto honesto

O mesmo rigor não se aplica ao código compartilhado. `toast()` está reescrito do zero em
pelo menos quatro projetos, com assinaturas diferentes. `todayISO()` e `weekBounds()`
existem idênticos em três lugares. Os chips de período `semana | mês | ano | tudo` aparecem
com o mesmo vocabulário em dois projetos que não se falam. Dentro deste repositório há cinco
implementações do mesmo laço de manutenção de botão, cinco jeitos de copiar para o
clipboard, e cerca de 180 linhas de camada de eventos duplicadas entre os dois scripts do
visualizador Philips.

Nada disso quebrou nada — mas é o custo recorrente do acervo, e é o lugar mais barato de
melhorar.

---

# Para onde o acervo está indo

Há duas consolidações em curso, e elas explicam quase todo o resto.

**O Patholytics está absorvendo o lado web.** Não é coincidência nem retrabalho: é migração
deliberada, e dá para ver pelos nomes de arquivo, que batem um a um com os originais.

| Veio de | Virou | Situação |
|---|---|---|
| Estadiador (13 calculadoras) | `/tools/stager` (54 calculadoras) | Port ampliado, mesma arquitetura |
| tma | `/tools/tma` | Reimplementado |
| ArquivosLaudos | `/tools/archive` | Import por JSON documentado como caminho |
| Assistente-trabalho | `/tools/congelacao` | Port em andamento, nomes de máscara batendo |
| Butcherduck | `/tools/macroscopia` | Reimplementado como conteúdo em código |
| OrganizadorCasos | `caseLists` / `cases` | Modelo mais rico, mas falta a leitura por IA |
| GuilisHUOL (próstata) | `/tools/prostate` | Terceira geração do mesmo |

**O FastPath está absorvendo o lado desktop** — GuilisAHK, Remora e os 128 arquivos `.ahk`
legados, virando um produto com autenticação, planos e marketplace.

**O que ainda não migrou**, e por bons motivos:

- **A escala de plantão.** É a única ferramenta *coletiva* do acervo — serve o serviço, não
  você. Não cabe numa plataforma pessoal com login individual, e por isso continua como
  aplicativo próprio.
- **A leitura de print por IA** do OrganizadorCasos. Enquanto isso não for portado, o
  OrganizadorCasos não pode ser aposentado, mesmo com o modelo de dados do Patholytics
  sendo estritamente superior.

## O ciclo "v1 vivo, v2 reservado"

Um hábito visível: o nome do sucessor é registrado cedo, às vezes anos antes.

| v1 | v2 | O que aconteceu |
|---|---|---|
| ChopperMoney | new-money-hub | Nasceu, e trocou Firebase por Supabase |
| guilis-stats → TamagochiSystem | novo-life-hub | Nasceu, terceira geração |
| OrganizadorCasos | OrganizadorCasos2 | **Vazio** |
| FastPath | Fastpath2 | **Só um README com o título** |
| clubedolivro | BookRat | **Vazio** |

Três nomes reservados e não usados. Vale saber que estão lá — ou para começar, ou para
apagar e parar de contar como projeto.

---

# Sobreposições

Dez funções aparecem em mais de um lugar. Nem toda duplicação é problema — algumas são
gerações sucessivas, que é saudável. Outras são duas implementações vivas do mesmo
problema, que é caro.

| Função | Onde está | Recomendação |
|---|---|---|
| **Escala de plantão** | EscalaDasaCongTeste2 (no ar), EscalaCongDasa (parado), 4 escalas do GuilisHUOL | As do HUOL são de outra época e outro serviço. Entre as duas da DASA, a que está no ar venceu — **o EscalaCongDasa pode ser arquivado** |
| **Acervo de textos de laudo** | ArquivosLaudos, Patholytics `/archive`, GuilisAHK `masks/`, FastPath, Butcherduck | Cinco lugares. Web já tem caminho de migração definido; desktop vai convergir no FastPath |
| **Automação de digitação desktop** | GuilisAHK (em uso), Remora (parado), FastPath (produto), 128 `.ahk` (legado) | Quatro gerações. **Remora pode ser arquivado** — o FastPath é a aposta |
| **Estadiamento TNM** | Estadiador, Patholytics `/stager`, Remora, PDFs do CAP | O Stager é o Estadiador ampliado. Quando estabilizar, **o Estadiador vira redirecionamento** |
| **TMA** | tma, Patholytics `/tools/tma`, contador do Telepato | Já reimplementado; o standalone é redundante |
| **Congelação e Mohs** | Assistente-trabalho, Patholytics `/tools/congelacao` | Port 1:1 em andamento |
| **Máscara de próstata** | GuilisHUOL (duas), Patholytics `/tools/prostate`, GuilisAHK `masks/uro/` | Três gerações; as do HUOL são históricas |
| **Macroscopia** | Butcherduck, Patholytics `/tools/macroscopia` | O Butcherduck já está quebrado no ar — **o Patholytics é o substituto** |
| **Contabilidade de produção** | Chopperverso (no ar), views mortas do Assistente-trabalho, guilis-stats | Migrou corretamente; **as views mortas podem ser apagadas** |
| **Hub de links** | GuilisHub, GuilisHUOL, dashboard do Patholytics | Três, mas com públicos diferentes — não é problema |

---

# Pontos de atenção

Achados factuais durante a leitura. Nenhum é urgente; todos são baratos de resolver.

**Documentação que descreve outro app.** O `CONTEXTO.md` do Assistente-trabalho descreve um
controle de produção com sessões e cronômetro. Esse app não existe mais ali — virou o
Chopperverso. O `manifest.json` também ficou com o nome antigo. Quem (ou o que) ler aquele
arquivo para entender o projeto vai entender errado.

**Código morto no Assistente-trabalho.** Cerca de dez arquivos de view — `today`, `history`,
`records`, `stats`, `calendario`, `pendencias`, `charts`, `timer`, `actions`, `events` — não
são carregados pelo `index.html`. São os restos do app anterior.

**O Butcherduck não roda onde está publicado.** É Express com SQLite, mas o GuilisHub aponta
para o GitHub Pages, que serve arquivo estático e não executa Node. No ar existe só a página
com os dados embutidos; a área administrativa não funciona. Ou sobe num lugar que roda Node,
ou o link deveria apontar para o Patholytics.

**Credenciais com valor padrão no código.**
- `Butcherduck/server.js:11` — senha de administrador com valor embutido para quando a
  variável de ambiente não existe. Como o servidor não está no ar, o risco hoje é zero; se
  subir, deixa de ser.
- `guilis-stats/backend/main.py:19` — chave de API com valor padrão, e CORS aberto na linha
  29. Roda só na máquina local, mas vale saber antes de expor.
- O `CONTEXTO.md` do Assistente-trabalho tem a configuração completa do Firebase escrita.
  Isso é público por natureza em app web e não é vazamento — a proteção real são as regras
  do Firestore, o que os READMEs do acervo explicam corretamente em vários lugares.

**Regras abertas no catálogo deste repositório.** O Firestore do catálogo de scripts está na
opção "qualquer um lê e escreve", que o próprio README descreve como a Opção A. Quem tiver a
URL do site pode alterar o código dos scripts publicados — e esses scripts são instalados no
navegador com acesso ao LIS. É o item desta lista que mais merece atenção.

**O `MOTION_ANCHORS.md` diverge do código.** Na seção de liberação, o documento descreve o
campo de senha e o botão de confirmar com seletores que os motores em produção não usam
mais. E várias âncoras reais não estão documentadas: as da lista de casos, a do popup de
imagens que lê os dados em base64 de um atributo, e a regra de somar uma lâmina quando
existe determinado campo. Como esse arquivo é justamente o mapa que se consulta antes de
escrever um script novo, a divergência custa tempo.

**Workflow apontando para branch de funcionalidade.** No clubedolivro, o gatilho de
publicação (`.github/workflows/publicar.yml:14`) ainda dispara numa branch de feature, não
na principal.

**Repositório duplicado.** `GuilisAHK` e `Sistema-Guilis-Huol` são o mesmo commit. Um dos
dois pode ser arquivado.

---

# Em uma frase

Você escreve software como quem escreve laudo: escopo exato, vocabulário próprio, decisão
registrada por escrito, e o resultado sempre pronto para ser colado no lugar onde o trabalho
de verdade acontece.
