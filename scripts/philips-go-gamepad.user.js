// ==UserScript==
// @name         Philips GO · Controle de Gamepad 🎮
// @namespace    https://github.com/guimota111/MotionTampermonkey
// @version      1.0.1
// @description  Navegue pela lâmina do Philips PathologySuite com um controle de Xbox: analógico esquerdo move (velocidade proporcional), gatilhos dão zoom gradual, analógico direito posiciona o cursor de ancoragem, bumpers dão passos fixos de zoom e o direcional faz varredura sistemática.
// @author       guimota111
// @match        https://patologia-go01.dasa.com.br/*
// @match        https://patologia-rj01.dasa.com.br/*
// @match        https://patologia-rj02.dasa.com.br/*
// @match        https://patologia-sp01.dasa.com.br/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/philips-go-gamepad.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/philips-go-gamepad.user.js
// ==/UserScript==

/* eslint-env browser */
(function () {
  'use strict';

  // =========================================================================
  //  Configuração
  // =========================================================================
  const LS_KEY = 'pgg:config:v1';
  const LS_KEY_TOQUE = 'pgt:config:v1'; // calibração compartilhada com o script de toque

  const PADRAO = {
    ativo: true,
    velocidadePan: 900,       // px/s na inclinação máxima do analógico
    curvaPan: 1.8,            // expoente da resposta (>1 = mais precisão no toque leve)
    zonaMorta: 0.15,          // ignora deriva de analógico gasto
    passosZoomPorSeg: 9,      // passos de roda por segundo, gatilho no fundo
    velocidadeCursor: 750,    // px/s do cursor de ancoragem (analógico direito)
    passoBumper: 5,           // passos de roda por toque em LB/RB
    passoDirecional: 0.28,    // fração da largura do visualizador por toque no D-pad
    inverterPanX: false,
    inverterPanY: false,
    inverterZoom: false,
    mostrarCursor: true,
    // --- emissão de eventos (mesma base do script de toque) ---
    emitirMouse: true,
    emitirPonteiro: true,
    eventosRoda: 'auto',      // 'auto' | 'wheel' | 'mousewheel' | 'todos'
    zoomComCtrl: false,
    autoPasso: true,
    passoRoda: 4,
    passoNativo: 0,
    deltaModeNativo: 0,
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
    if (cfg.debug) console.log('%c[gamepad]', 'color:#a78bfa', ...args);
  }

  // Aproveita a calibração da roda já feita pelo script de toque, se existir.
  (function herdarCalibracao() {
    if (cfg.passoNativo > 0) return;
    try {
      const t = JSON.parse(localStorage.getItem(LS_KEY_TOQUE) || '{}');
      if (t.passoNativo > 0) {
        cfg.passoNativo = t.passoNativo;
        cfg.deltaModeNativo = t.deltaModeNativo || 0;
        log('calibração herdada do script de toque:', cfg.passoNativo);
      }
    } catch (e) { /* ignora */ }
  })();

  // =========================================================================
  //  Descoberta do visualizador (mesma heurística do script de toque)
  // =========================================================================
  const LADO_MINIMO = 200;
  const FOLGA_RAIZ = 2;

  let visualizador = null;
  let visualizadorEm = 0;

  function acharVisualizador() {
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

  function getVisualizador() {
    const agora = Date.now();
    if (!visualizador || !visualizador.isConnected || agora - visualizadorEm > 1000) {
      const novo = acharVisualizador();
      if (novo !== visualizador) {
        visualizador = novo;
        if (visualizador) {
          centralizarCursor();
          log('visualizador detectado:', visualizador);
        }
        atualizarStatus();
      }
      visualizadorEm = agora;
    }
    return visualizador;
  }

  function areaVisualizador() {
    const v = getVisualizador();
    if (!v) return null;
    const r = v.getBoundingClientRect();
    if (r.width < LADO_MINIMO || r.height < LADO_MINIMO) return null;
    return r;
  }

  // =========================================================================
  //  Calibração da roda (idem script de toque)
  // =========================================================================
  const amostrasRoda = [];

  function aoRodaReal(e) {
    if (e.__pgg || !e.isTrusted) return;
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
  document.addEventListener('wheel', aoRodaReal, { capture: true, passive: true });

  function passoEfetivo() {
    if (cfg.autoPasso && cfg.passoNativo > 0) return cfg.passoNativo;
    return cfg.passoRoda;
  }

  // =========================================================================
  //  Emissão de eventos sintéticos
  // =========================================================================
  (function protegerPointerCapture() {
    for (const nome of ['setPointerCapture', 'releasePointerCapture']) {
      const orig = Element.prototype[nome];
      if (!orig || orig.__pgg) continue;
      const patch = function (id) {
        try { return orig.call(this, id); } catch (e) { return undefined; }
      };
      patch.__pgg = true;
      Element.prototype[nome] = patch;
    }
  })();

  const PONTEIRO_ID = 9902;

  function base(x, y, extra) {
    return Object.assign({
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      // coordenadas inteiras: o MouseEvent trunca, e sobra de ponto flutuante
      // vira erro de 1px no destino
      clientX: Math.round(x),
      clientY: Math.round(y),
      screenX: Math.round(x) + (window.screenX || 0),
      screenY: Math.round(y) + (window.screenY || 0),
      button: 0,
      detail: 1
    }, extra || {});
  }

  function alvoEm(x, y) {
    return document.elementFromPoint(x, y) || getVisualizador();
  }

  function dispararMouse(tipo, alvo, x, y, extra) {
    if (!cfg.emitirMouse || !alvo) return;
    const ev = new MouseEvent(tipo, base(x, y, extra));
    ev.__pgg = true;
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
    ev.__pgg = true;
    alvo.dispatchEvent(ev);
  }

  function pairar(x, y) {
    const alvo = alvoEm(x, y);
    dispararPonteiro('pointermove', alvo, x, y, { buttons: 0 });
    dispararMouse('mousemove', alvo, x, y, { buttons: 0 });
    return alvo;
  }
  function pressionar(alvo, x, y) {
    dispararPonteiro('pointerdown', alvo, x, y, { buttons: 1 });
    dispararMouse('mousedown', alvo, x, y, { buttons: 1 });
  }
  function arrastar(alvo, x, y, dx, dy) {
    const extra = { buttons: 1, movementX: dx, movementY: dy };
    dispararPonteiro('pointermove', alvo, x, y, extra);
    dispararMouse('mousemove', alvo, x, y, extra);
  }
  function soltar(alvo, x, y) {
    dispararPonteiro('pointerup', alvo, x, y, { buttons: 0 });
    dispararMouse('mouseup', alvo, x, y, { buttons: 0 });
  }

  // Uma roda real traz detail 0 e os campos legados wheelDelta* preenchidos —
  // num evento sintético eles vêm zerados e handlers antigos ignoram o evento.
  function eventoRoda(tipo, alvo, x, y, deltaY) {
    const wd = Math.round(-deltaY * 1.2);
    const ev = new WheelEvent(tipo, base(x, y, {
      detail: 0,
      deltaX: 0, deltaY: deltaY, deltaZ: 0,
      deltaMode: cfg.deltaModeNativo || 0,
      wheelDelta: wd, wheelDeltaX: 0, wheelDeltaY: wd,
      ctrlKey: cfg.zoomComCtrl
    }));
    ev.__pgg = true;
    alvo.dispatchEvent(ev);
    return ev;
  }

  function roda(x, y, deltaY) {
    const alvo = alvoEm(x, y);
    if (!alvo) return;
    let tratado = false;
    if (cfg.eventosRoda !== 'mousewheel') {
      tratado = eventoRoda('wheel', alvo, x, y, deltaY).defaultPrevented;
    }
    if (cfg.eventosRoda === 'mousewheel' || cfg.eventosRoda === 'todos' ||
        (cfg.eventosRoda === 'auto' && !tratado)) {
      eventoRoda('mousewheel', alvo, x, y, deltaY);
    }
    if (cfg.eventosRoda === 'todos') {
      const ev = new MouseEvent('DOMMouseScroll', base(x, y, {
        detail: Math.round(deltaY / 40) || (deltaY > 0 ? 1 : -1)
      }));
      ev.__pgg = true;
      alvo.dispatchEvent(ev);
    }
  }

  // passos > 0 aproxima. Emite um evento POR passo, em vez de um evento com o
  // delta multiplicado: não se sabe se o visualizador escala pelo valor do
  // delta ou só conta eventos, e assim funciona dos dois jeitos — é também o
  // que uma roda real faz ao girar vários cliques.
  function zoom(x, y, passos) {
    const sinal = cfg.inverterZoom ? 1 : -1;
    const dir = passos < 0 ? -1 : 1;
    const n = Math.max(1, Math.abs(Math.round(passos)));
    pairar(x, y); // o zoom é ancorado no cursor: leva o cursor ao ponto antes
    for (let i = 0; i < n; i++) roda(x, y, sinal * dir * passoEfetivo());
  }

  // =========================================================================
  //  Cursor de ancoragem
  // =========================================================================
  let cursor = { x: 0, y: 0 };
  let elCursor = null;

  function centralizarCursor() {
    const r = areaVisualizador();
    if (!r) return;
    cursor = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    posicionarCursor();
  }

  function limitarCursor() {
    const r = areaVisualizador();
    if (!r) return;
    const m = 8;
    cursor.x = Math.min(Math.max(cursor.x, r.left + m), r.right - m);
    cursor.y = Math.min(Math.max(cursor.y, r.top + m), r.bottom - m);
  }

  function posicionarCursor() {
    if (!elCursor) return;
    const mostrar = cfg.ativo && cfg.mostrarCursor && !!padAtivo() && !!areaVisualizador();
    elCursor.style.display = mostrar ? 'block' : 'none';
    if (mostrar) {
      elCursor.style.left = cursor.x + 'px';
      elCursor.style.top = cursor.y + 'px';
    }
  }

  // =========================================================================
  //  Pan contínuo com reancoragem
  // =========================================================================
  // O pan é um mousedown segurado + mousemove. Num deslocamento longo o ponto
  // do arrasto sairia da tela e o app travaria no limite; então, ao chegar perto
  // da borda, soltamos, voltamos ao centro e pressionamos de novo. Como o pan é
  // relativo ao ponto do mousedown, a imagem não dá salto.
  let arrastando = false;
  let alvoArrasto = null;
  let ponto = { x: 0, y: 0 };

  function iniciarArrasto() {
    const r = areaVisualizador();
    if (!r) return false;
    ponto = { x: cursor.x, y: cursor.y };
    alvoArrasto = pairar(ponto.x, ponto.y);
    pressionar(alvoArrasto, ponto.x, ponto.y);
    arrastando = true;
    log('arrasto iniciado');
    return true;
  }

  function encerrarArrasto() {
    if (!arrastando) return;
    soltar(alvoArrasto, ponto.x, ponto.y);
    arrastando = false;
    alvoArrasto = null;
    log('arrasto encerrado');
  }

  function reancorar() {
    const r = areaVisualizador();
    if (!r) return;
    soltar(alvoArrasto, ponto.x, ponto.y);
    ponto = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    alvoArrasto = pairar(ponto.x, ponto.y);
    pressionar(alvoArrasto, ponto.x, ponto.y);
    log('reancorado no centro');
  }

  function moverArrasto(dx, dy) {
    const r = areaVisualizador();
    if (!r) return;
    ponto.x += dx;
    ponto.y += dy;
    arrastar(alvoArrasto, ponto.x, ponto.y, dx, dy);

    const margem = Math.min(60, r.width * 0.12, r.height * 0.12);
    if (ponto.x < r.left + margem || ponto.x > r.right - margem ||
        ponto.y < r.top + margem || ponto.y > r.bottom - margem) {
      reancorar();
    }
  }

  // Deslocamento fixo (D-pad): um arrasto curto e imediato.
  function empurrar(fx, fy) {
    const r = areaVisualizador();
    if (!r) return;
    const dx = fx * r.width * cfg.passoDirecional;
    const dy = fy * r.height * cfg.passoDirecional;
    const ox = r.left + r.width / 2;
    const oy = r.top + r.height / 2;
    const alvo = pairar(ox, oy);
    pressionar(alvo, ox, oy);
    arrastar(alvo, ox + dx, oy + dy, dx, dy);
    soltar(alvo, ox + dx, oy + dy);
  }

  function clicar() {
    const alvo = pairar(cursor.x, cursor.y);
    pressionar(alvo, cursor.x, cursor.y);
    soltar(alvo, cursor.x, cursor.y);
    dispararMouse('click', alvo, cursor.x, cursor.y, { buttons: 0 });
  }

  // =========================================================================
  //  Leitura do gamepad
  // =========================================================================
  // Índices do "standard gamepad layout" — é o que o Xbox reporta no Chrome.
  const BTN = {
    A: 0, B: 1, X: 2, Y: 3,
    LB: 4, RB: 5, LT: 6, RT: 7,
    VIEW: 8, MENU: 9, L3: 10, R3: 11,
    CIMA: 12, BAIXO: 13, ESQ: 14, DIR: 15
  };

  let anterior = [];
  let acumZoom = 0;
  let ultimoT = 0;
  let padInfo = null;

  function padAtivo() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  function eixo(p, i) {
    const v = p.axes[i] || 0;
    return Math.abs(v) < cfg.zonaMorta ? 0 : v;
  }

  // Normaliza fora da zona morta e aplica a curva de resposta, para que a
  // inclinação leve dê varredura fina e a inclinação cheia, movimento rápido.
  function resposta(v) {
    if (!v) return 0;
    const s = v < 0 ? -1 : 1;
    const m = (Math.abs(v) - cfg.zonaMorta) / (1 - cfg.zonaMorta);
    return s * Math.pow(Math.max(0, Math.min(1, m)), cfg.curvaPan);
  }

  function gatilho(p, i) {
    const b = p.buttons[i];
    if (!b) return 0;
    const v = typeof b.value === 'number' ? b.value : (b.pressed ? 1 : 0);
    return v < 0.06 ? 0 : v;
  }

  function pressionouAgora(p, i) {
    const b = p.buttons[i];
    const agora = !!(b && b.pressed);
    const antes = !!anterior[i];
    return agora && !antes;
  }

  function laco(t) {
    requestAnimationFrame(laco);

    const p = padAtivo();
    const dt = ultimoT ? Math.min((t - ultimoT) / 1000, 0.05) : 0;
    ultimoT = t;

    if (!p || !cfg.ativo || !areaVisualizador() || !document.hasFocus()) {
      if (arrastando) encerrarArrasto();
      if (padInfo && !p) { padInfo = null; atualizarStatus(); posicionarCursor(); }
      return;
    }

    if (!padInfo) {
      padInfo = p.id;
      centralizarCursor();
      atualizarStatus();
      log('controle conectado:', p.id);
    }

    // --- analógico direito: cursor de ancoragem -----------------------------
    const cx = resposta(eixo(p, 2));
    const cy = resposta(eixo(p, 3));
    if (cx || cy) {
      cursor.x += cx * cfg.velocidadeCursor * dt;
      cursor.y += cy * cfg.velocidadeCursor * dt;
      limitarCursor();
      posicionarCursor();
    }

    // --- analógico esquerdo: move a lâmina ----------------------------------
    const ex = resposta(eixo(p, 0));
    const ey = resposta(eixo(p, 1));
    if (ex || ey) {
      if (!arrastando && !iniciarArrasto()) return;
      // empurrar o analógico para a direita leva a VISTA para a direita, ou
      // seja, arrasta o conteúdo para a esquerda
      const sx = cfg.inverterPanX ? 1 : -1;
      const sy = cfg.inverterPanY ? 1 : -1;
      moverArrasto(sx * ex * cfg.velocidadePan * dt, sy * ey * cfg.velocidadePan * dt);
    } else if (arrastando) {
      encerrarArrasto();
    }

    // --- gatilhos: zoom gradual ---------------------------------------------
    const rt = gatilho(p, BTN.RT);
    const lt = gatilho(p, BTN.LT);
    const intensidade = Math.pow(rt, 1.6) - Math.pow(lt, 1.6);
    if (intensidade) {
      acumZoom += intensidade * cfg.passosZoomPorSeg * dt;
      let guarda = 0;
      while (Math.abs(acumZoom) >= 1 && guarda++ < 6) {
        const s = acumZoom > 0 ? 1 : -1;
        zoom(cursor.x, cursor.y, s);
        acumZoom -= s;
      }
    } else {
      acumZoom = 0;
    }

    // --- botões (borda de subida) -------------------------------------------
    if (pressionouAgora(p, BTN.RB)) zoom(cursor.x, cursor.y, cfg.passoBumper);
    if (pressionouAgora(p, BTN.LB)) zoom(cursor.x, cursor.y, -cfg.passoBumper);
    if (pressionouAgora(p, BTN.DIR)) empurrar(-1, 0);
    if (pressionouAgora(p, BTN.ESQ)) empurrar(1, 0);
    if (pressionouAgora(p, BTN.BAIXO)) empurrar(0, -1);
    if (pressionouAgora(p, BTN.CIMA)) empurrar(0, 1);
    if (pressionouAgora(p, BTN.A)) clicar();
    if (pressionouAgora(p, BTN.R3)) centralizarCursor();

    anterior = p.buttons.map((b) => !!b.pressed);
  }

  window.addEventListener('gamepadconnected', (e) => {
    log('gamepadconnected:', e.gamepad && e.gamepad.id);
    atualizarStatus();
    posicionarCursor();
  });
  window.addEventListener('gamepaddisconnected', () => {
    if (arrastando) encerrarArrasto();
    padInfo = null;
    atualizarStatus();
    posicionarCursor();
  });

  // =========================================================================
  //  Estilos e widget
  // =========================================================================
  const estilo = document.createElement('style');
  estilo.textContent = `
    #pgg-cursor {
      position: fixed; z-index: 2147483645; pointer-events: none;
      width: 30px; height: 30px; margin: -15px 0 0 -15px; display: none;
      border: 2px solid rgba(167,139,250,.95); border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0,0,0,.55), inset 0 0 0 1px rgba(0,0,0,.55);
    }
    #pgg-cursor::before, #pgg-cursor::after {
      content: ''; position: absolute; background: rgba(167,139,250,.95);
    }
    #pgg-cursor::before { left: 50%; top: -8px; width: 2px; height: 8px; margin-left: -1px; }
    #pgg-cursor::after { top: 50%; left: -8px; height: 2px; width: 8px; margin-top: -1px; }
    .pgg-widget, .pgg-widget * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    #pgg-btn {
      position: fixed; bottom: 20px; left: 78px; z-index: 2147483646;
      width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
      background: #0f172a; color: #e2e8f0; font-size: 19px; line-height: 46px; text-align: center;
      box-shadow: 0 4px 14px rgba(0,0,0,.35); transition: transform .15s ease, background .15s ease;
      padding: 0;
    }
    #pgg-btn:hover { transform: scale(1.06); }
    #pgg-btn.off { background: #475569; opacity: .6; }
    #pgg-btn.conectado { background: #4c1d95; }
    #pgg-painel {
      position: fixed; bottom: 76px; left: 78px; z-index: 2147483646;
      width: 278px; max-height: 78vh; overflow-y: auto;
      background: #0f172a; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px;
      padding: 14px; font-size: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
    }
    #pgg-painel[hidden] { display: none; }
    #pgg-painel h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #f8fafc; }
    #pgg-painel .linha { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 7px 0; }
    #pgg-painel label { color: #cbd5e1; flex: 1; }
    #pgg-painel input[type="range"] { width: 104px; }
    #pgg-painel select { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; padding: 3px 5px; font-size: 11px; }
    #pgg-painel hr { border: none; border-top: 1px solid #1e293b; margin: 11px 0; }
    #pgg-painel .status { color: #94a3b8; font-size: 11px; line-height: 1.5; white-space: pre-line; }
    #pgg-painel .mapa { color: #64748b; font-size: 10.5px; line-height: 1.6; margin-top: 8px; }
    #pgg-painel .mapa b { color: #a78bfa; font-weight: 600; }
    #pgg-painel .val { color: #a78bfa; font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; }
  `;

  let painel = null;
  let elStatus = null;
  let botao = null;

  function atualizarStatus() {
    if (botao) {
      botao.classList.toggle('off', !cfg.ativo);
      botao.classList.toggle('conectado', !!padAtivo() && cfg.ativo);
    }
    if (!elStatus) return;
    const p = padAtivo();
    const v = areaVisualizador();
    const linhas = [];
    linhas.push(p ? '🎮 ' + (p.id || 'controle').slice(0, 40) : '⚪ Nenhum controle detectado — aperte um botão com esta aba em foco.');
    linhas.push(v ? `Lâmina: ${Math.round(v.width)}×${Math.round(v.height)}px` : 'Lâmina: não detectada — abra uma imagem.');
    linhas.push('Passo da roda: ' + (cfg.autoPasso && cfg.passoNativo ? cfg.passoNativo + ' (medido)' : cfg.passoRoda + ' (manual)'));
    if (!document.hasFocus()) linhas.push('⚠ A aba está sem foco — o controle só responde com ela ativa.');
    elStatus.textContent = linhas.join('\n');
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
    painel.id = 'pgg-painel';
    painel.className = 'pgg-widget';
    painel.hidden = true;

    const titulo = document.createElement('h4');
    titulo.textContent = '🎮 Controle de gamepad';

    elStatus = document.createElement('div');
    elStatus.className = 'status';

    const linhaER = document.createElement('div');
    linhaER.className = 'linha';
    const labER = document.createElement('label');
    labER.textContent = 'Eventos de roda';
    const selER = document.createElement('select');
    for (const [v, t] of [['auto', 'Auto'], ['wheel', 'Só wheel'], ['mousewheel', 'Só mousewheel'], ['todos', 'Todos']]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = t; o.selected = cfg.eventosRoda === v;
      selER.appendChild(o);
    }
    selER.addEventListener('change', () => { cfg.eventosRoda = selER.value; salvar(); });
    linhaER.append(labER, selER);

    const mapa = document.createElement('div');
    mapa.className = 'mapa';
    mapa.innerHTML =
      '<b>Analógico esq.</b> move a lâmina<br>' +
      '<b>RT / LT</b> aproxima / afasta<br>' +
      '<b>Analógico dir.</b> move o cursor de ancoragem<br>' +
      '<b>RB / LB</b> passo fixo de zoom<br>' +
      '<b>Direcional</b> varredura sistemática<br>' +
      '<b>A</b> clica no cursor · <b>R3</b> recentra o cursor';

    painel.append(
      titulo,
      elStatus,
      document.createElement('hr'),
      checkbox('Ativo', 'ativo', () => { if (!cfg.ativo && arrastando) encerrarArrasto(); atualizarStatus(); posicionarCursor(); }),
      slider('Velocidade do pan', 'velocidadePan', 200, 2500, 50),
      slider('Precisão no toque leve', 'curvaPan', 1, 3, 0.1, (v) => v.toFixed(1)),
      slider('Zona morta', 'zonaMorta', 0.02, 0.4, 0.01, (v) => v.toFixed(2)),
      slider('Zoom (passos/s)', 'passosZoomPorSeg', 1, 30, 1),
      slider('Velocidade do cursor', 'velocidadeCursor', 150, 2000, 50),
      slider('Passo do bumper', 'passoBumper', 1, 20, 1),
      slider('Passo do direcional', 'passoDirecional', 0.05, 0.9, 0.01, (v) => Math.round(v * 100) + '%'),
      document.createElement('hr'),
      checkbox('Inverter eixo X', 'inverterPanX'),
      checkbox('Inverter eixo Y', 'inverterPanY'),
      checkbox('Inverter zoom', 'inverterZoom'),
      checkbox('Mostrar cursor', 'mostrarCursor', posicionarCursor),
      linhaER,
      checkbox('Passo automático da roda', 'autoPasso', atualizarStatus),
      slider('Passo da roda', 'passoRoda', 1, 300, 1),
      checkbox('Log no console', 'debug'),
      mapa
    );
    document.body.appendChild(painel);
  }

  function montarWidget() {
    elCursor = document.createElement('div');
    elCursor.id = 'pgg-cursor';
    document.body.appendChild(elCursor);

    botao = document.createElement('button');
    botao.id = 'pgg-btn';
    botao.className = 'pgg-widget';
    botao.type = 'button';
    botao.textContent = '🎮';
    botao.title = 'Controle de gamepad — clique para ajustar';
    botao.addEventListener('click', () => {
      if (!painel) montarPainel();
      painel.hidden = !painel.hidden;
      if (!painel.hidden) atualizarStatus();
    });
    document.body.appendChild(botao);
    atualizarStatus();
  }

  // =========================================================================
  //  Inicialização
  // =========================================================================
  const ehTopo = window.top === window;
  let tentativas = 0;

  function talvezMostrarWidget() {
    if (botao) return;
    const sozinho = ehTopo && document.querySelectorAll('iframe').length === 0;
    if (getVisualizador() || (sozinho && tentativas > 3)) montarWidget();
  }

  function iniciar() {
    if (!document.body || !document.head) { setTimeout(iniciar, 300); return; }
    if (!document.head.contains(estilo)) document.head.appendChild(estilo);
    setInterval(() => {
      tentativas++;
      getVisualizador();
      talvezMostrarWidget();
      atualizarStatus();
    }, 1200);
    talvezMostrarWidget();
    requestAnimationFrame(laco);
    log('pronto (frame ' + (ehTopo ? 'topo' : 'interno') + ')');
  }

  iniciar();
})();
