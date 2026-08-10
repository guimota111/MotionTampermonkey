// ==UserScript==
// @name         Philips GO · Navegação por Toque
// @namespace    https://github.com/guimota111/MotionTampermonkey
// @version      1.0.0
// @description  Habilita navegação por toque no visualizador de lâminas do Philips (Telepatologia Dasa): 1 dedo arrasta, pinça dá zoom, toque duplo aproxima. Traduz o toque em eventos de mouse/ponteiro que o visualizador entende.
// @author       guimota111
// @match        https://patologia-go01.dasa.com.br/*
// @match        https://patologia-rj01.dasa.com.br/*
// @match        https://patologia-rj02.dasa.com.br/*
// @match        https://patologia-sp01.dasa.com.br/*
// @run-at       document-idle
// @grant        none
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
    inverterZoom: false,
    sensibilidadeZoom: 1,     // multiplicador da pinça
    passoRoda: 100,           // deltaY de cada "clique" de roda sintético
    panDoisDedos: false,      // arrastar com dois dedos também move (além do zoom)
    toqueDuplo: 'zoom',       // 'zoom' | 'dblclick' | 'off'
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
  //  Descoberta do elemento do visualizador
  // =========================================================================
  const AREA_MINIMA = 200; // px de lado mínimo pra considerar um canvas como visualizador
  let visualizador = null;
  let visualizadorEm = 0;
  let raizMarcada = null;

  function acharVisualizador() {
    if (cfg.seletor) {
      const forcado = document.querySelector(cfg.seletor);
      if (forcado) return forcado;
    }
    let melhor = null;
    let maiorArea = 0;
    for (const c of document.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      if (r.width < AREA_MINIMA || r.height < AREA_MINIMA) continue;
      const area = r.width * r.height;
      if (area > maiorArea) { maiorArea = area; melhor = c; }
    }
    return melhor;
  }

  function desmarcar() {
    if (visualizador) visualizador.classList.remove('pgt-alvo');
    if (raizMarcada) raizMarcada.classList.remove('pgt-alvo');
    raizMarcada = null;
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
          const pai = visualizador.parentElement;
          if (pai && pai !== document.body && pai !== document.documentElement) {
            pai.classList.add('pgt-alvo');
            raizMarcada = pai;
          }
          log('visualizador detectado:', visualizador);
        }
        atualizarStatus();
      }
      visualizadorEm = agora;
    }
    return visualizador;
  }

  // A raiz é o contêiner do canvas (o visualizador costuma sobrepor divs
  // transparentes ao canvas). Se o pai for <body>/<html>, ficaríamos com a
  // página inteira como área de toque — nesse caso usamos o próprio canvas.
  function raiz() {
    const v = getVisualizador();
    if (!v) return null;
    const pai = v.parentElement;
    if (!pai || pai === document.body || pai === document.documentElement) return v;
    return pai;
  }

  const IGNORAR = 'button, a, input, select, textarea, label, [role="button"], [role="slider"], .pgt-widget';

  function deveTratar(alvo) {
    if (!cfg.ativo || !alvo || alvo.nodeType !== 1) return false;
    if (alvo.closest && alvo.closest(IGNORAR)) return false;
    const v = getVisualizador();
    if (alvo === v) return true;
    const r = raiz();
    if (!r) return false;
    return alvo === r || r.contains(alvo);
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

  function roda(x, y, deltaY) {
    const alvo = document.elementFromPoint(x, y) || getVisualizador();
    if (!alvo) return;
    const ev = new WheelEvent('wheel', base(x, y, {
      deltaX: 0,
      deltaY: deltaY,
      deltaZ: 0,
      deltaMode: 0,
      ctrlKey: cfg.zoomComCtrl
    }));
    ev.__pgt = true;
    alvo.dispatchEvent(ev);
  }

  // passos > 0 aproxima (zoom in); < 0 afasta
  function zoom(x, y, passos) {
    const sinal = cfg.inverterZoom ? 1 : -1; // convenção: deltaY negativo = aproximar
    roda(x, y, sinal * passos * cfg.passoRoda);
    log('zoom', passos > 0 ? 'in' : 'out', 'em', Math.round(x), Math.round(y));
  }

  // =========================================================================
  //  Máquina de estados dos gestos
  // =========================================================================
  const LIMIAR_ZOOM = 0.14;   // ~10% de variação da distância = 1 passo de roda
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
    pressionar(alvoArrasto, ultimo.x, ultimo.y);
    log('arrasto iniciado');
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

  function aoCancelar(e) {
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
      width: 268px; max-height: 78vh; overflow-y: auto;
      background: #0f172a; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px;
      padding: 14px; font-size: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
    }
    #pgt-painel[hidden] { display: none; }
    #pgt-painel h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #f8fafc; }
    #pgt-painel .linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 7px 0; }
    #pgt-painel label { color: #cbd5e1; flex: 1; }
    #pgt-painel input[type="range"] { width: 108px; }
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
    if (!v) { elStatus.textContent = 'Nenhum visualizador detectado. Abra uma lâmina — ou informe um seletor abaixo.'; return; }
    const r = v.getBoundingClientRect();
    const id = v.id ? '#' + v.id : '';
    const cls = (v.className && typeof v.className === 'string')
      ? '.' + v.className.trim().split(/\s+/).filter((c) => c !== 'pgt-alvo').slice(0, 2).join('.') : '';
    elStatus.textContent = `Detectado: ${v.tagName.toLowerCase()}${id}${cls} — ${Math.round(r.width)}×${Math.round(r.height)}px`;
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

  function slider(rotulo, chave, min, max, passo, formatar) {
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
    inp.addEventListener('input', () => { cfg[chave] = parseFloat(inp.value); pinta(); salvar(); });
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

    const sep1 = document.createElement('hr');
    const sep2 = document.createElement('hr');

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

    // seletor manual
    const labSel = document.createElement('label');
    labSel.textContent = 'Seletor do visualizador (opcional)';
    labSel.style.display = 'block';
    labSel.style.margin = '8px 0 4px';
    const inpSel = document.createElement('input');
    inpSel.type = 'text';
    inpSel.placeholder = 'ex.: canvas.slide-canvas';
    inpSel.value = cfg.seletor;
    inpSel.addEventListener('change', () => {
      cfg.seletor = inpSel.value.trim();
      salvar();
      visualizador = null; visualizadorEm = 0;
      getVisualizador();
      atualizarStatus();
    });

    const dica = document.createElement('div');
    dica.className = 'dica';
    dica.innerHTML = '1 dedo arrasta · 2 dedos dão zoom · toque duplo aproxima · 2 dedos batidos afastam.<br>' +
      'Se o arrasto ficar com o dobro da velocidade, desligue "Eventos de ponteiro".<br>' +
      'Se a pinça não der zoom, tente ligar "Zoom com Ctrl+roda" ou "Inverter zoom".';

    painel.append(
      titulo,
      elStatus,
      sep1,
      checkbox('Ativo', 'ativo', aplicarAtivo),
      slider('Sensibilidade do zoom', 'sensibilidadeZoom', 0.3, 3, 0.1, (v) => v.toFixed(1) + '×'),
      slider('Passo da roda', 'passoRoda', 20, 300, 10),
      checkbox('Inverter zoom', 'inverterZoom'),
      checkbox('Zoom com Ctrl+roda', 'zoomComCtrl'),
      linhaTD,
      checkbox('Pan com dois dedos', 'panDoisDedos'),
      sep2,
      checkbox('Eventos de mouse', 'emitirMouse'),
      checkbox('Eventos de ponteiro', 'emitirPonteiro'),
      checkbox('Log no console', 'debug'),
      labSel,
      inpSel,
      dica
    );
    document.body.appendChild(painel);
  }

  function aplicarAtivo() {
    if (botao) botao.classList.toggle('off', !cfg.ativo);
    if (!cfg.ativo) { desmarcar(); return; }
    visualizador = null; visualizadorEm = 0;
    getVisualizador();
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
  // frames, mas o botão só aparece no frame que realmente tem a lâmina — assim
  // não fica um botão duplicado por cima do outro.
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
    // o visualizador costuma aparecer só depois que a lâmina carrega
    setInterval(() => { tentativas++; getVisualizador(); talvezMostrarBotao(); }, 1200);
    talvezMostrarBotao();
    log('pronto (frame ' + (ehTopo ? 'topo' : 'interno') + ')');
  }

  iniciar();
})();
