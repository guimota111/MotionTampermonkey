/* ==========================================================================
 *  Philips GO · Diagnóstico do Visualizador de Lâminas
 *  --------------------------------------------------------------------------
 *  COMO USAR
 *  1. Abra uma lâmina no visualizador (https://patologia-go01.dasa.com.br/...).
 *  2. Abra o DevTools (F12) → aba "Console".
 *  3. Cole TODO este arquivo e aperte Enter.
 *  4. Faça, nessa ordem, com a lâmina aberta:
 *       a) arraste a lâmina com o MOUSE (segurando o botão) por ~2 segundos;
 *       b) gire a RODINHA do mouse pra dar zoom;
 *       c) tente arrastar a lâmina com o DEDO na tela;
 *       d) tente dar pinça (dois dedos) na tela.
 *  5. Rode no console:  pgtRelatorio()
 *     O relatório é impresso e copiado pro clipboard automaticamente.
 *  6. Cole o resultado na conversa.
 * ========================================================================== */

(function () {
  'use strict';

  const SPY_EVENTS = [
    'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
    'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
    'wheel', 'touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange'
  ];

  const MAX_POR_TIPO = 3;
  const registro = Object.create(null);

  // ---------- utilidades ---------------------------------------------------
  function caminho(el, limite = 6) {
    const partes = [];
    let n = el;
    while (n && n.nodeType === 1 && partes.length < limite) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += '#' + n.id;
      if (n.className && typeof n.className === 'string') {
        const cls = n.className.trim().split(/\s+/).slice(0, 3).join('.');
        if (cls) s += '.' + cls;
      }
      partes.unshift(s);
      n = n.parentElement;
    }
    return partes.join(' > ');
  }

  function retangulo(el) {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }

  function estilos(el) {
    const cs = getComputedStyle(el);
    return {
      touchAction: cs.touchAction,
      userSelect: cs.userSelect,
      pointerEvents: cs.pointerEvents,
      position: cs.position,
      overflow: cs.overflow
    };
  }

  // ---------- 1. canvases / elementos candidatos ---------------------------
  function canvases() {
    return Array.from(document.querySelectorAll('canvas')).map((c) => ({
      caminho: caminho(c),
      rect: retangulo(c),
      largura_interna: c.width,
      altura_interna: c.height,
      contextos: {
        webgl2: !!c.__pgtCtx && c.__pgtCtx.indexOf('webgl2') >= 0,
        detectado: c.__pgtCtx || '(não detectado — abra a lâmina antes de rodar o script)'
      },
      estilos: estilos(c),
      ancestrais: (function () {
        const out = [];
        let n = c.parentElement, i = 0;
        while (n && i < 5) { out.push({ caminho: caminho(n, 1), rect: retangulo(n), estilos: estilos(n) }); n = n.parentElement; i++; }
        return out;
      })()
    }));
  }

  function iframes() {
    return Array.from(document.querySelectorAll('iframe')).map((f) => ({
      src: f.src || '(sem src)',
      rect: retangulo(f),
      acessivel: (function () { try { return !!f.contentDocument; } catch (e) { return false; } })()
    }));
  }

  // ---------- 2. bibliotecas conhecidas ------------------------------------
  function bibliotecas() {
    const w = window;
    const alvos = {
      OpenSeadragon: 'OpenSeadragon', Leaflet: 'L', OpenLayers: 'ol', Cesium: 'Cesium',
      mapboxgl: 'mapboxgl', three: 'THREE', PIXI: 'PIXI', Konva: 'Konva', fabric: 'fabric',
      d3: 'd3', jQuery: 'jQuery', Hammer: 'Hammer', angular: 'angular', ng: 'ng',
      React: 'React', Vue: 'Vue', Zone: 'Zone'
    };
    const achadas = {};
    for (const nome in alvos) if (w[alvos[nome]] !== undefined) achadas[nome] = true;
    achadas.temNgVersion = !!document.querySelector('[ng-version]');
    achadas.ngVersion = (document.querySelector('[ng-version]') || {}).getAttribute
      ? document.querySelector('[ng-version]').getAttribute('ng-version') : null;
    achadas.suportaPointerEvent = typeof window.PointerEvent === 'function';
    achadas.maxTouchPoints = navigator.maxTouchPoints;
    return achadas;
  }

  // ---------- 3. listeners registrados (só funciona no console do DevTools) -
  function listeners() {
    if (typeof getEventListeners !== 'function') {
      return '(indisponível — getEventListeners só existe quando o código é colado direto no console do Chrome/Edge)';
    }
    const resultado = {};
    const alvos = [['window', window], ['document', document]];

    const cs = Array.from(document.querySelectorAll('canvas'))
      .sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight));
    if (cs[0]) {
      let n = cs[0], i = 0;
      while (n && i < 5) { alvos.push(['canvas' + (i ? '.pai'.repeat(i) : ''), n]); n = n.parentElement; i++; }
    }

    for (const [nome, alvo] of alvos) {
      try {
        const l = getEventListeners(alvo);
        const tipos = Object.keys(l).filter((t) => /pointer|mouse|touch|wheel|gesture|drag|click/i.test(t));
        if (tipos.length) resultado[nome] = tipos.map((t) => t + '×' + l[t].length).join(', ');
      } catch (e) { /* ignora */ }
    }
    return resultado;
  }

  // ---------- 4. espião de eventos -----------------------------------------
  function registrar(e) {
    const tipo = e.type;
    registro[tipo] = registro[tipo] || { total: 0, amostras: [] };
    const r = registro[tipo];
    r.total++;
    if (r.amostras.length < MAX_POR_TIPO) {
      const amostra = {
        alvo: caminho(e.target),
        confiavel: e.isTrusted,
        defaultPrevented: null // preenchido depois, na fase de bolha
      };
      if (e.pointerType) amostra.pointerType = e.pointerType;
      if (e.pointerId !== undefined) amostra.pointerId = e.pointerId;
      if (tipo === 'wheel') {
        amostra.deltaY = e.deltaY; amostra.deltaMode = e.deltaMode;
        amostra.ctrlKey = e.ctrlKey;
      }
      if (e.touches) amostra.dedos = e.touches.length;
      if (e.buttons !== undefined) amostra.buttons = e.buttons;
      r.amostras.push(amostra);

      // verifica, no fim do ciclo, se alguém chamou preventDefault (= o app tratou)
      setTimeout(() => { amostra.defaultPrevented = e.defaultPrevented; }, 0);
    }
  }

  if (window.__pgtEspiao) {
    for (const t of SPY_EVENTS) document.removeEventListener(t, window.__pgtEspiao, true);
  }
  window.__pgtEspiao = registrar;
  for (const t of SPY_EVENTS) {
    document.addEventListener(t, registrar, { capture: true, passive: true });
  }

  // marca qual contexto cada canvas usa (patch temporário só pra novos canvas)
  try {
    const orig = HTMLCanvasElement.prototype.getContext;
    if (!orig.__pgtPatched) {
      HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
        try { this.__pgtCtx = tipo; } catch (e) { /* ignora */ }
        return orig.call(this, tipo, ...resto);
      };
      HTMLCanvasElement.prototype.getContext.__pgtPatched = true;
    }
  } catch (e) { /* ignora */ }

  // ---------- 5. relatório --------------------------------------------------
  window.pgtRelatorio = function () {
    const rel = {
      url: location.href,
      dentroDeIframe: window.top !== window,
      userAgent: navigator.userAgent,
      viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      bibliotecas: bibliotecas(),
      canvases: canvases(),
      iframes: iframes(),
      listeners: listeners(),
      eventosCapturados: registro
    };
    const texto = JSON.stringify(rel, null, 2);
    console.log('%c=== RELATÓRIO PHILIPS GO ===', 'font-weight:bold;font-size:14px;color:#4ade80');
    console.log(rel);
    try { copy(texto); console.log('%c✔ Relatório copiado pro clipboard — é só colar na conversa.', 'color:#4ade80'); }
    catch (e) { console.log('Copie o texto abaixo:\n' + texto); }
    return texto;
  };

  console.log('%c✔ Diagnóstico Philips GO instalado.', 'font-weight:bold;color:#4ade80;font-size:13px');
  console.log('Agora: 1) arraste a lâmina com o MOUSE  2) use a RODINHA  3) tente arrastar com o DEDO  4) tente a PINÇA');
  console.log('Depois rode:  pgtRelatorio()');
})();
