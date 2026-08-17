// ==UserScript==
// @name         Philips GO · Navegação por Toque
// @namespace    https://github.com/guimota111/MotionTampermonkey
// @version      1.2.1
// @description  Habilita navegação por toque no visualizador de lâminas do Philips PathologySuite (Telepatologia Dasa): 1 dedo arrasta, pinça dá zoom, toque duplo aproxima. Traduz o toque em eventos de mouse/ponteiro que o visualizador entende.
// @author       guimota111
// @match        https://patologia-go01.dasa.com.br/*
// @match        https://patologia-rj01.dasa.com.br/*
// @match        https://patologia-rj02.dasa.com.br/*
// @match        https://patologia-sp01.dasa.com.br/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/philips-go-navegacao-toque.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/philips-go-navegacao-toque.user.js
// ==/UserScript==

/* eslint-env browser */
(function () {
  'use strict';

  // =========================================================================
  //  Configuração (persistida em localStorage, por domínio)
  // =========================================================================
  const LS_KEY = 'pgt:config:v1';

  const PADRAO = {
    ativo: true,
    emitirMouse: true,        // dispara mousedown/mousemove/mouseup
    emitirPonteiro: true,     // dispara pointerdown/pointermove/pointerup (pointerType: mouse)
    zoomComCtrl: false,       // usa Ctrl+roda em vez de roda pura
    eventosRoda: 'auto',      // 'auto' | 'wheel' | 'mousewheel' | 'todos'
    inverterZoom: false,
    sensibilidadeZoom: 1,     // quantos passos de roda a pinça gera
    autoPasso: true,          // usa o deltaY nativo medido na própria página
    passoRoda: 4,             // deltaY de cada passo quando autoPasso está desligado
    passoNativo: 0,           // mediana do |deltaY| observado em rodas reais (calibração)
    deltaModeNativo: 0,
    panDoisDedos: false,      // arrastar com dois dedos também move (além do zoom)
    toqueDuplo: 'zoom',       // 'zoom' | 'dblclick' | 'off'
    qualquerCanvas: true,     // trata qualquer canvas do visualizador (inclui janela de navegação)
    seletor: '',              // força o elemento do visualizador (CSS selector)
    debug: false
  };

  let cfg = Object.assign({}, PADRAO, ler());

  function ler() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function salvar() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) { /* ignora */ }
  }
  function log(...args) {
    if (cfg.debug) console.log('%c[toque]', 'color:#38bdf8', ...args);
  }

  // =========================================================================
  //  Descoberta do visualizador
  // =========================================================================
  // O PathologySuite empilha várias camadas de canvas do mesmo tamanho: o
  // render WebGL embaixo e os overlays do Fabric (anotação, grade, pan) por
  // cima. Quem recebe os eventos é a camada de cima, que fica numa subárvore
  // diferente da do canvas WebGL — por isso a área de toque não pode ser o pai
  // do canvas, e sim o contêiner que abriga todas as camadas.
  const LADO_MINIMO = 200;     // lado mínimo pra um canvas ser "o visualizador"
  const LADO_MINIMO_AUX = 80;  // lado mínimo pra um canvas auxiliar (janela de navegação)
  const FOLGA_RAIZ = 2;        // a raiz pode ter até 2× a área do canvas

  let visualizador = null;
  let visualizadorEm = 0;
  let raizAtual = null;

  function acharVisualizador() {
    if (cfg.seletor) {
      const forcado = document.querySelector(cfg.seletor);
      if (forcado) return forcado;
    }
    let melhor = null;
    let maiorArea = 0;
    for (const c of document.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      if (r.width < LADO_MINIMO || r.height < LADO_MINIMO) continue;
      const area = r.width * r.height;
      if (area > maiorArea) { maiorArea = area; melhor = c; }
    }
    return melhor;
  }

  // Sobe a partir do canvas enquanto os ancestrais mantiverem praticamente a
  // mesma área — assim chegamos ao contêiner do viewport (que também contém os
  // overlays) sem estourar pra página inteira.
  function acharRaiz(canvas) {
    const rc = canvas.getBoundingClientRect();
    const areaCanvas = Math.max(1, rc.width * rc.height);
    let melhor = canvas;
    let n = canvas.parentElement;
    let i = 0;
    while (n && n !== document.body && n !== document.documentElement && i < 10) {
      const r = n.getBoundingClientRect();
      if (r.width * r.height > areaCanvas * FOLGA_RAIZ) break;
      melhor = n;
      n = n.parentElement;
      i++;
    }
    return melhor;
  }

  function desmarcar() {
    if (visualizador) visualizador.classList.remove('pgt-alvo');
    if (raizAtual) raizAtual.classList.remove('pgt-alvo');
    raizAtual = null;
  }

  function getVisualizador() {
    const agora = Date.now();
    if (!visualizador || !visualizador.isConnected || agora - visualizadorEm > 1000) {
      const novo = acharVisualizador();
      if (novo !== visualizador) {
        desmarcar();
        visualizador = novo;
        if (visualizador) {
          visualizador.classList.add('pgt-alvo');
          raizAtual = acharRaiz(visualizador);
          if (raizAtual !== visualizador) raizAtual.classList.add('pgt-alvo');
          log('visualizador:', visualizador, 'raiz:', raizAtual);
        }
        atualizarStatus();
      }
      visualizadorEm = agora;
    }
    return visualizador;
  }

  const IGNORAR = 'button, a, input, select, textarea, label, [role="button"], [role="slider"], .pgt-widget';

  function deveTratar(alvo) {
    if (!cfg.ativo || !alvo || alvo.nodeType !== 1) return false;
    if (alvo.closest && alvo.closest(IGNORAR)) return false;

    const v = getVisualizador();
    if (!v) return false;
    if (alvo === v) return true;
    if (raizAtual && (alvo === raizAtual || raizAtual.contains(alvo))) return true;

    // Rede de segurança: as camadas de overlay podem morar fora da raiz
    // detectada. Neste domínio todo canvas pertence ao visualizador.
    if (cfg.qualquerCanvas && alvo.tagName === 'CANVAS') {
      const r = alvo.getBoundingClientRect();
      if (r.width >= LADO_MINIMO_AUX && r.height >= LADO_MINIMO_AUX) return true;
    }
    return false;
  }

  // =========================================================================
  //  Calibração da roda
  // =========================================================================
  // O deltaY nativo varia muito por dispositivo (neste visualizador, uma rolagem
  // real chega com deltaY = 2, não com os 100 de um mouse clássico). Em vez de
  // chutar, medimos o valor real da própria página e usamos a mediana.
  const amostrasRoda = [];

  function aoRodaReal(e) {
    if (e.__pgt || !e.isTrusted) return;
    const d = Math.abs(e.deltaY);
    if (!d) return;
    amostrasRoda.push(d);
    if (amostrasRoda.length > 21) amostrasRoda.shift();
    const ord = amostrasRoda.slice().sort((a, b) => a - b);
    cfg.passoNativo = ord[Math.floor(ord.length / 2)];
    cfg.deltaModeNativo = e.deltaMode;
    salvar();
    atualizarStatus();
  }

  function passoEfetivo() {
    if (cfg.autoPasso && cfg.passoNativo > 0) return cfg.passoNativo;
    return cfg.passoRoda;
  }

  // =========================================================================
  //  Disparo de eventos sintéticos
  // =========================================================================
  // Alguns visualizadores chamam setPointerCapture() dentro do handler. Com um
  // pointerId sintético isso lança InvalidPointerId e quebra o handler deles —
  // então engolimos o erro sem alterar o comportamento normal.
  (function protegerPointerCapture() {
    for (const nome of ['setPointerCapture', 'releasePointerCapture']) {
      const orig = Element.prototype[nome];
      if (!orig || orig.__pgt) continue;
      const patch = function (id) {
        try { return orig.call(this, id); } catch (e) { return undefined; }
      };
      patch.__pgt = true;
      Element.prototype[nome] = patch;
    }
  })();

  const PONTEIRO_ID = 9901;

  function base(x, y, extra) {
    return Object.assign({
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + (window.screenX || 0),
      screenY: y + (window.screenY || 0),
      button: 0,
      detail: 1
    }, extra || {});
  }

  function dispararMouse(tipo, alvo, x, y, extra) {
    if (!cfg.emitirMouse || !alvo) return;
    const ev = new MouseEvent(tipo, base(x, y, extra));
    ev.__pgt = true;
    alvo.dispatchEvent(ev);
  }

  function dispararPonteiro(tipo, alvo, x, y, extra) {
    if (!cfg.emitirPonteiro || !alvo || typeof window.PointerEvent !== 'function') return;
    const ev = new PointerEvent(tipo, base(x, y, Object.assign({
      pointerId: PONTEIRO_ID,
      pointerType: 'mouse',
      isPrimary: true,
      width: 1,
      height: 1,
      pressure: (extra && extra.buttons) ? 0.5 : 0
    }, extra || {})));
    ev.__pgt = true;
    alvo.dispatchEvent(ev);
  }

  // Ordem igual à do navegador real: pointer* antes de mouse*.
  function pairar(alvo, x, y) {
    // Move o "cursor" até o ponto ANTES de pressionar. Visualizadores que
    // calculam o deslocamento a partir da última posição conhecida dariam um
    // pulo enorme sem isto.
    dispararPonteiro('pointermove', alvo, x, y, { buttons: 0 });
    dispararMouse('mousemove', alvo, x, y, { buttons: 0 });
  }
  function pressionar(alvo, x, y) {
    dispararPonteiro('pointerdown', alvo, x, y, { buttons: 1 });
    dispararMouse('mousedown', alvo, x, y, { buttons: 1 });
  }
  function mover(alvo, x, y, dx, dy, pressionado) {
    const extra = { buttons: pressionado ? 1 : 0, movementX: dx, movementY: dy };
    dispararPonteiro('pointermove', alvo, x, y, extra);
    dispararMouse('mousemove', alvo, x, y, extra);
  }
  function soltar(alvo, x, y) {
    dispararPonteiro('pointerup', alvo, x, y, { buttons: 0 });
    dispararMouse('mouseup', alvo, x, y, { buttons: 0 });
  }
  function clicar(alvo, x, y, duplo) {
    dispararMouse('click', alvo, x, y, { buttons: 0 });
    if (duplo) dispararMouse('dblclick', alvo, x, y, { buttons: 0, detail: 2 });
  }

  // Uma roda real traz mais coisa do que só o deltaY: `detail` é 0 (e não 1,
  // como nos demais eventos de mouse) e os campos legados wheelDelta* vêm
  // preenchidos — normalizadores antigos leem justamente esses. Num evento
  // sintético eles valem 0 se a gente não passar.
  function eventoRoda(tipo, alvo, x, y, deltaY) {
    const wd = Math.round(-deltaY * 1.2); // convenção legada: 120 por "clique" de 100px
    const ev = new WheelEvent(tipo, base(x, y, {
      detail: 0,
      deltaX: 0,
      deltaY: deltaY,
      deltaZ: 0,
      deltaMode: cfg.deltaModeNativo || 0,
      wheelDelta: wd,
      wheelDeltaX: 0,
      wheelDeltaY: wd,
      ctrlKey: cfg.zoomComCtrl
    }));
    ev.__pgt = true;
    alvo.dispatchEvent(ev);
    return ev;
  }

  function eventoRodaFirefox(alvo, x, y, deltaY) {
    const ev = new MouseEvent('DOMMouseScroll', base(x, y, {
      detail: Math.round(deltaY / 40) || (deltaY > 0 ? 1 : -1),
      ctrlKey: cfg.zoomComCtrl
    }));
    ev.__pgt = true;
    alvo.dispatchEvent(ev);
  }

  function roda(x, y, deltaY) {
    const alvo = document.elementFromPoint(x, y) || getVisualizador();
    if (!alvo) return;

    const modo = cfg.eventosRoda;
    let tratado = false;

    if (modo !== 'mousewheel') {
      tratado = eventoRoda('wheel', alvo, x, y, deltaY).defaultPrevented;
    }
    // 'auto': só cai no legado se ninguém tratou o `wheel` moderno — assim não
    // corre o risco de aplicar o zoom duas vezes.
    if (modo === 'mousewheel' || modo === 'todos' || (modo === 'auto' && !tratado)) {
      eventoRoda('mousewheel', alvo, x, y, deltaY);
    }
    if (modo === 'todos') {
      eventoRodaFirefox(alvo, x, y, deltaY);
    }
    log('roda', deltaY, 'wheel tratado:', tratado, 'modo:', modo);
  }

  // passos > 0 aproxima (zoom in); < 0 afasta
  function zoom(x, y, passos) {
    const sinal = cfg.inverterZoom ? 1 : -1; // convenção: deltaY negativo = aproximar
    roda(x, y, sinal * passos * passoEfetivo());
    log('zoom', passos > 0 ? 'in' : 'out', 'passo', passoEfetivo());
  }

  // =========================================================================
  //  Máquina de estados dos gestos
  // =========================================================================
  const LIMIAR_ZOOM = 0.10;   // ~7% de variação da distância = 1 passo de roda
  const TAP_DIST = 14;        // px
  const TAP_MS = 260;
  const DUPLO_TAP_MS = 320;

  let modo = 'ocioso';        // 'ocioso' | 'arrasto' | 'pinca'
  let alvoArrasto = null;
  let ultimo = { x: 0, y: 0 };
  let inicio = { x: 0, y: 0, t: 0 };
  let moveu = false;

  let distPinca = 0;
  let acumZoom = 0;
  let pincaInicio = 0;
  let pincaMoveu = false;
  let pincaArrastando = false;

  let ultimoTap = { x: 0, y: 0, t: 0 };

  function iniciarArrasto(toque, alvo) {
    alvoArrasto = alvo || document.elementFromPoint(toque.clientX, toque.clientY) || getVisualizador();
    ultimo = { x: toque.clientX, y: toque.clientY };
    inicio = { x: toque.clientX, y: toque.clientY, t: Date.now() };
    moveu = false;
    modo = 'arrasto';
    pairar(alvoArrasto, ultimo.x, ultimo.y);
    pressionar(alvoArrasto, ultimo.x, ultimo.y);
    log('arrasto iniciado em', alvoArrasto);
  }

  function moverArrasto(x, y) {
    const dx = x - ultimo.x;
    const dy = y - ultimo.y;
    if (!moveu && Math.hypot(x - inicio.x, y - inicio.y) > 3) moveu = true;
    ultimo = { x: x, y: y };
    mover(alvoArrasto, x, y, dx, dy, true);
  }

  function encerrarArrasto(podeSerTap) {
    if (modo !== 'arrasto') return;
    modo = 'ocioso';
    const x = ultimo.x;
    const y = ultimo.y;
    soltar(alvoArrasto, x, y);

    const dur = Date.now() - inicio.t;
    const dist = Math.hypot(x - inicio.x, y - inicio.y);
    const foiTap = podeSerTap && !moveu && dur < TAP_MS && dist < TAP_DIST;

    if (foiTap) {
      const agora = Date.now();
      const perto = Math.hypot(x - ultimoTap.x, y - ultimoTap.y) < 40;
      const duplo = perto && (agora - ultimoTap.t) < DUPLO_TAP_MS;

      if (duplo && cfg.toqueDuplo !== 'off') {
        ultimoTap = { x: 0, y: 0, t: 0 };
        if (cfg.toqueDuplo === 'dblclick') clicar(alvoArrasto, x, y, true);
        else zoom(x, y, 1);
        log('toque duplo');
      } else {
        ultimoTap = { x: x, y: y, t: agora };
        clicar(alvoArrasto, x, y, false);
      }
    }
    alvoArrasto = null;
  }

  function iniciarPinca(e) {
    const a = e.touches[0];
    const b = e.touches[1];
    distPinca = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    acumZoom = 0;
    pincaInicio = Date.now();
    pincaMoveu = false;
    modo = 'pinca';

    if (cfg.panDoisDedos) {
      const mx = (a.clientX + b.clientX) / 2;
      const my = (a.clientY + b.clientY) / 2;
      alvoArrasto = document.elementFromPoint(mx, my) || getVisualizador();
      ultimo = { x: mx, y: my };
      pairar(alvoArrasto, mx, my);
      pressionar(alvoArrasto, mx, my);
      pincaArrastando = true;
    }
    log('pinça iniciada');
  }

  function atualizarPinca(e) {
    const a = e.touches[0];
    const b = e.touches[1];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const mx = (a.clientX + b.clientX) / 2;
    const my = (a.clientY + b.clientY) / 2;

    if (pincaArrastando) {
      const dx = mx - ultimo.x;
      const dy = my - ultimo.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        ultimo = { x: mx, y: my };
        mover(alvoArrasto, mx, my, dx, dy, true);
      }
    }

    if (!distPinca) { distPinca = d; return; }
    acumZoom += Math.log2(d / distPinca) * cfg.sensibilidadeZoom;
    distPinca = d;

    if (Math.abs(acumZoom) < LIMIAR_ZOOM) return;

    // o zoom costuma ser ancorado no cursor: leva o "cursor" ao ponto médio antes
    if (!pincaArrastando) pairar(document.elementFromPoint(mx, my) || getVisualizador(), mx, my);

    let guarda = 0;
    while (Math.abs(acumZoom) >= LIMIAR_ZOOM && guarda++ < 8) {
      const s = acumZoom > 0 ? 1 : -1;
      zoom(mx, my, s);
      acumZoom -= s * LIMIAR_ZOOM;
      pincaMoveu = true;
    }
  }

  function encerrarPinca(x, y) {
    if (modo !== 'pinca') return;
    modo = 'ocioso';
    if (pincaArrastando) {
      soltar(alvoArrasto, ultimo.x, ultimo.y);
      pincaArrastando = false;
      alvoArrasto = null;
    }
    // dois dedos batidos rápido, sem pinçar = afastar um passo
    if (!pincaMoveu && (Date.now() - pincaInicio) < TAP_MS && cfg.toqueDuplo !== 'off') {
      zoom(x, y, -1);
      log('toque de dois dedos → afastar');
    }
    distPinca = 0;
    acumZoom = 0;
  }

  // =========================================================================
  //  Handlers de toque
  // =========================================================================
  function aoTocar(e) {
    if (!cfg.ativo) return;
    const alvo = e.target && e.target.nodeType === 1
      ? e.target
      : document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    if (!deveTratar(alvo)) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 1) {
      iniciarArrasto(e.touches[0], alvo);
    } else if (e.touches.length >= 2) {
      if (modo === 'arrasto') encerrarArrasto(false);
      if (modo !== 'pinca') iniciarPinca(e);
    }
  }

  function aoMover(e) {
    if (modo === 'ocioso') return;
    e.preventDefault();
    e.stopPropagation();

    if (modo === 'arrasto' && e.touches.length === 1) {
      moverArrasto(e.touches[0].clientX, e.touches[0].clientY);
    } else if (modo === 'pinca' && e.touches.length >= 2) {
      atualizarPinca(e);
    }
  }

  function aoSoltar(e) {
    if (modo === 'ocioso') return;
    e.preventDefault();
    e.stopPropagation();

    const restantes = e.touches.length;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    const x = t ? t.clientX : ultimo.x;
    const y = t ? t.clientY : ultimo.y;

    if (modo === 'pinca') {
      encerrarPinca(x, y);
      // sobrou um dedo na tela: recomeça o arrasto do zero, sem "pulo"
      if (restantes === 1) iniciarArrasto(e.touches[0], null);
      return;
    }

    if (modo === 'arrasto' && restantes === 0) {
      encerrarArrasto(e.type === 'touchend');
    }
  }

  function aoCancelar() {
    if (modo === 'arrasto') encerrarArrasto(false);
    else if (modo === 'pinca') encerrarPinca(ultimo.x, ultimo.y);
    modo = 'ocioso';
  }

  function aoMenuContexto(e) {
    // toque longo abrindo menu de contexto atrapalha o arrasto
    if (cfg.ativo && modo !== 'ocioso') e.preventDefault();
  }

  const opts = { capture: true, passive: false };
  document.addEventListener('touchstart', aoTocar, opts);
  document.addEventListener('touchmove', aoMover, opts);
  document.addEventListener('touchend', aoSoltar, opts);
  document.addEventListener('touchcancel', aoCancelar, opts);
  document.addEventListener('contextmenu', aoMenuContexto, opts);
  document.addEventListener('wheel', aoRodaReal, { capture: true, passive: true });

  // =========================================================================
  //  Estilos: impede o navegador de "roubar" o gesto (scroll/zoom da página)
  // =========================================================================
  const estilo = document.createElement('style');
  estilo.textContent = `
    .pgt-alvo, .pgt-alvo * {
      touch-action: none !important;
      -ms-touch-action: none !important;
      overscroll-behavior: none !important;
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    .pgt-widget, .pgt-widget * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    #pgt-btn {
      position: fixed; bottom: 20px; left: 20px; z-index: 2147483646;
      width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
      background: #0f172a; color: #e2e8f0; font-size: 20px; line-height: 46px; text-align: center;
      box-shadow: 0 4px 14px rgba(0,0,0,.35); transition: transform .15s ease, background .15s ease;
      padding: 0;
    }
    #pgt-btn:hover { transform: scale(1.06); }
    #pgt-btn.off { background: #475569; opacity: .6; }
    #pgt-painel {
      position: fixed; bottom: 76px; left: 20px; z-index: 2147483646;
      width: 274px; max-height: 78vh; overflow-y: auto;
      background: #0f172a; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px;
      padding: 14px; font-size: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
    }
    #pgt-painel[hidden] { display: none; }
    #pgt-painel h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #f8fafc; }
    #pgt-painel .linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 7px 0; }
    #pgt-painel label { color: #cbd5e1; flex: 1; }
    #pgt-painel input[type="range"] { width: 104px; }
    #pgt-painel input[type="text"] { width: 100%; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; padding: 5px 7px; font-size: 11px; }
    #pgt-painel select { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; padding: 3px 5px; font-size: 11px; }
    #pgt-painel hr { border: none; border-top: 1px solid #1e293b; margin: 11px 0; }
    #pgt-painel .status { color: #94a3b8; font-size: 11px; line-height: 1.45; word-break: break-all; }
    #pgt-painel .dica { color: #64748b; font-size: 10.5px; line-height: 1.45; margin-top: 8px; }
    #pgt-painel .val { color: #38bdf8; font-variant-numeric: tabular-nums; min-width: 30px; text-align: right; }
  `;

  // =========================================================================
  //  Painel de ajustes
  // =========================================================================
  let painel = null;
  let elStatus = null;
  let botao = null;

  function atualizarStatus() {
    if (!elStatus) return;
    const v = getVisualizador();
    if (!v) {
      elStatus.textContent = 'Nenhum visualizador detectado. Abra uma lâmina — ou informe um seletor abaixo.';
      return;
    }
    const r = v.getBoundingClientRect();
    const nome = (el) => {
      const id = el.id ? '#' + el.id : '';
      const cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.trim().split(/\s+/).filter((c) => c !== 'pgt-alvo').slice(0, 2).join('.') : '';
      return el.tagName.toLowerCase() + id + cls;
    };
    const passo = cfg.autoPasso && cfg.passoNativo
      ? `${cfg.passoNativo} (medido)`
      : `${cfg.passoRoda} (manual)`;
    elStatus.textContent =
      `Canvas: ${nome(v)} — ${Math.round(r.width)}×${Math.round(r.height)}px\n` +
      `Área de toque: ${raizAtual && raizAtual !== v ? nome(raizAtual) : '(o próprio canvas)'}\n` +
      `Passo da roda: ${passo}`;
    elStatus.style.whiteSpace = 'pre-line';
  }

  function checkbox(rotulo, chave, aoMudar) {
    const linha = document.createElement('div');
    linha.className = 'linha';
    const lab = document.createElement('label');
    lab.textContent = rotulo;
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = !!cfg[chave];
    inp.addEventListener('change', () => { cfg[chave] = inp.checked; salvar(); if (aoMudar) aoMudar(); });
    linha.append(lab, inp);
    return linha;
  }

  function slider(rotulo, chave, min, max, passo, formatar, aoMudar) {
    const linha = document.createElement('div');
    linha.className = 'linha';
    const lab = document.createElement('label');
    lab.textContent = rotulo;
    const val = document.createElement('span');
    val.className = 'val';
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = min; inp.max = max; inp.step = passo;
    inp.value = cfg[chave];
    const pinta = () => { val.textContent = formatar ? formatar(cfg[chave]) : cfg[chave]; };
    inp.addEventListener('input', () => {
      cfg[chave] = parseFloat(inp.value);
      pinta(); salvar();
      if (aoMudar) aoMudar();
    });
    pinta();
    linha.append(lab, inp, val);
    return linha;
  }

  function montarPainel() {
    painel = document.createElement('div');
    painel.id = 'pgt-painel';
    painel.className = 'pgt-widget';
    painel.hidden = true;

    const titulo = document.createElement('h4');
    titulo.textContent = '👆 Navegação por toque';

    elStatus = document.createElement('div');
    elStatus.className = 'status';

    // toque duplo
    const linhaTD = document.createElement('div');
    linhaTD.className = 'linha';
    const labTD = document.createElement('label');
    labTD.textContent = 'Toque duplo';
    const selTD = document.createElement('select');
    for (const [v, t] of [['zoom', 'Aproximar'], ['dblclick', 'Duplo-clique'], ['off', 'Desligado']]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = t; o.selected = cfg.toqueDuplo === v;
      selTD.appendChild(o);
    }
    selTD.addEventListener('change', () => { cfg.toqueDuplo = selTD.value; salvar(); });
    linhaTD.append(labTD, selTD);

    // eventos de roda usados pelo zoom
    const linhaER = document.createElement('div');
    linhaER.className = 'linha';
    const labER = document.createElement('label');
    labER.textContent = 'Eventos de roda';
    const selER = document.createElement('select');
    for (const [v, t] of [
      ['auto', 'Auto'], ['wheel', 'Só wheel'],
      ['mousewheel', 'Só mousewheel'], ['todos', 'Todos']
    ]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = t; o.selected = cfg.eventosRoda === v;
      selER.appendChild(o);
    }
    selER.addEventListener('change', () => { cfg.eventosRoda = selER.value; salvar(); });
    linhaER.append(labER, selER);

    // seletor manual
    const labSel = document.createElement('label');
    labSel.textContent = 'Seletor do visualizador (opcional)';
    labSel.style.display = 'block';
    labSel.style.margin = '8px 0 4px';
    const inpSel = document.createElement('input');
    inpSel.type = 'text';
    inpSel.placeholder = 'ex.: canvas.webgl';
    inpSel.value = cfg.seletor;
    inpSel.addEventListener('change', () => {
      cfg.seletor = inpSel.value.trim();
      salvar();
      redetectar();
    });

    const dica = document.createElement('div');
    dica.className = 'dica';
    dica.innerHTML = '1 dedo arrasta · 2 dedos dão zoom · toque duplo aproxima · 2 dedos batidos afastam.<br>' +
      'O passo da roda é medido a partir de uma rolagem real na própria página — role uma vez com o mouse/trackpad para calibrar.<br>' +
      'Zoom fraco ou forte demais? Desligue "Passo automático" e ajuste no braço.<br>' +
      'Zoom não responde? Troque "Eventos de roda" para "Só mousewheel" ou "Todos".<br>' +
      'Arrasto com o dobro da velocidade? Desligue "Eventos de ponteiro".';

    painel.append(
      titulo,
      elStatus,
      document.createElement('hr'),
      checkbox('Ativo', 'ativo', aplicarAtivo),
      slider('Sensibilidade do zoom', 'sensibilidadeZoom', 0.3, 3, 0.1, (v) => v.toFixed(1) + '×'),
      checkbox('Passo automático', 'autoPasso', atualizarStatus),
      slider('Passo da roda', 'passoRoda', 1, 300, 1, null, atualizarStatus),
      checkbox('Inverter zoom', 'inverterZoom'),
      checkbox('Zoom com Ctrl+roda', 'zoomComCtrl'),
      linhaER,
      linhaTD,
      checkbox('Pan com dois dedos', 'panDoisDedos'),
      document.createElement('hr'),
      checkbox('Eventos de mouse', 'emitirMouse'),
      checkbox('Eventos de ponteiro', 'emitirPonteiro'),
      checkbox('Tratar qualquer canvas', 'qualquerCanvas'),
      checkbox('Log no console', 'debug'),
      labSel,
      inpSel,
      dica
    );
    document.body.appendChild(painel);
  }

  function redetectar() {
    desmarcar();
    visualizador = null;
    visualizadorEm = 0;
    getVisualizador();
    atualizarStatus();
  }

  function aplicarAtivo() {
    if (botao) botao.classList.toggle('off', !cfg.ativo);
    if (!cfg.ativo) { desmarcar(); return; }
    redetectar();
  }

  function montarBotao() {
    botao = document.createElement('button');
    botao.id = 'pgt-btn';
    botao.className = 'pgt-widget';
    botao.type = 'button';
    botao.textContent = '👆';
    botao.title = 'Navegação por toque — clique para ajustar';
    botao.classList.toggle('off', !cfg.ativo);
    botao.addEventListener('click', () => {
      if (!painel) montarPainel();
      painel.hidden = !painel.hidden;
      if (!painel.hidden) atualizarStatus();
    });
    document.body.appendChild(botao);
  }

  // =========================================================================
  //  Inicialização
  // =========================================================================
  // O visualizador pode estar dentro de um iframe. O script roda em todos os
  // frames, mas o botão flutuante só aparece no frame que realmente tem a
  // lâmina — assim não fica um botão duplicado por cima do outro.
  const ehTopo = window.top === window;
  let tentativas = 0;

  function talvezMostrarBotao() {
    if (botao) return;
    const temViewer = !!getVisualizador();
    const sozinho = ehTopo && document.querySelectorAll('iframe').length === 0;
    if (temViewer || (sozinho && tentativas > 3)) montarBotao();
  }

  function iniciar() {
    if (!document.body || !document.head) { setTimeout(iniciar, 300); return; }
    if (!document.head.contains(estilo)) document.head.appendChild(estilo);
    // o canvas só existe depois que a lâmina carrega
    setInterval(() => { tentativas++; getVisualizador(); talvezMostrarBotao(); }, 1200);
    talvezMostrarBotao();
    log('pronto (frame ' + (ehTopo ? 'topo' : 'interno') + ')');
  }

  iniciar();
})();
