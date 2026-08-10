/* ==========================================================================
 *  Philips GO · Teste de Zoom (qual evento de roda o visualizador aceita?)
 *  --------------------------------------------------------------------------
 *  O pan por toque já funciona, mas o zoom não. Como o mousedown sintético
 *  chega aos handlers do app, o problema não é o alvo do evento e sim o
 *  FORMATO dele. Este script dispara 8 variantes de roda, uma a cada 2s, e
 *  informa em qual delas o app reagiu.
 *
 *  COMO USAR
 *  1. Abra a lâmina, deixe-a num zoom intermediário (nem no mínimo, nem no
 *     máximo) e desligue o script de toque no botão 👆 (evita interferência).
 *  2. Abra o console (F12), cole este arquivo e aperte Enter.
 *  3. NÃO mexa no mouse durante o teste. Olhe a lâmina e anote os números
 *     dos testes em que a imagem deu zoom.
 *  4. Rode  pgtResultado()  e cole o resultado na conversa, junto com os
 *     números que você viu funcionar.
 * ========================================================================== */

(function () {
  'use strict';

  const grandes = Array.from(document.querySelectorAll('canvas')).filter((c) => {
    const r = c.getBoundingClientRect();
    return r.width > 200 && r.height > 200;
  });

  if (!grandes.length) {
    console.log('%c✘ Nenhum canvas grande encontrado — abra uma lâmina primeiro.', 'color:#f87171');
    return;
  }

  const rect = grandes[0].getBoundingClientRect();
  const X = Math.round(rect.left + rect.width / 2);
  const Y = Math.round(rect.top + rect.height / 2);

  const canvasRender = grandes[0];                       // camada WebGL (a de baixo)
  const canvasTopo = document.elementFromPoint(X, Y);    // camada que recebe os eventos

  function caminho(el) {
    const a = [];
    for (let n = el, i = 0; n && n.nodeType === 1 && i < 4; n = n.parentElement, i++) {
      a.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
        (typeof n.className === 'string' && n.className.trim()
          ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
    }
    return a.join(' > ');
  }

  const REPETICOES = 6;   // repete cada variante, caso o app acumule o delta
  const PAUSA = 2000;     // ms entre uma variante e outra

  function comum(extra) {
    return Object.assign({
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: X, clientY: Y, screenX: X, screenY: Y, button: 0
    }, extra);
  }

  function pairar(alvo) {
    alvo.dispatchEvent(new MouseEvent('mousemove', comum({ detail: 0, buttons: 0 })));
    if (typeof PointerEvent === 'function') {
      alvo.dispatchEvent(new PointerEvent('pointermove', comum({
        detail: 0, buttons: 0, pointerId: 9901, pointerType: 'mouse', isPrimary: true
      })));
    }
  }

  function wheel(alvo, opts) {
    const dY = opts.deltaY;
    const wd = opts.wheelDelta !== undefined ? opts.wheelDelta : Math.round(-dY * 1.2);
    const ev = new WheelEvent(opts.tipo || 'wheel', comum({
      detail: opts.detail !== undefined ? opts.detail : 0,
      deltaX: 0, deltaY: dY, deltaZ: 0,
      deltaMode: opts.deltaMode || 0,
      wheelDelta: wd, wheelDeltaX: 0, wheelDeltaY: wd,
      ctrlKey: !!opts.ctrl
    }));
    alvo.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  function firefox(alvo, deltaY) {
    const ev = new MouseEvent('DOMMouseScroll', comum({ detail: Math.round(deltaY / 40) || -1 }));
    alvo.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  // Zoom in = deltaY negativo. Cada variante muda UMA coisa.
  const TESTES = [
    { nome: 'wheel deltaY -2 (magnitude nativa) no topo', fn: (a) => wheel(a, { deltaY: -2 }) },
    { nome: 'wheel deltaY -100 no topo', fn: (a) => wheel(a, { deltaY: -100 }) },
    { nome: 'wheel deltaY -100 com detail:1 (como era na v1.1)', fn: (a) => wheel(a, { deltaY: -100, detail: 1 }) },
    { nome: 'wheel deltaY -100 com wheelDelta ZERADO', fn: (a) => wheel(a, { deltaY: -100, wheelDelta: 0 }) },
    { nome: 'mousewheel (legado) wheelDelta +120', fn: (a) => wheel(a, { tipo: 'mousewheel', deltaY: -100 }) },
    { nome: 'DOMMouseScroll (legado Firefox) detail -3', fn: (a) => firefox(a, -100) },
    { nome: 'wheel deltaY -100 com Ctrl (pinça de trackpad)', fn: (a) => wheel(a, { deltaY: -100, ctrl: true }) },
    { nome: 'wheel deltaY -3 com deltaMode 1 (linhas)', fn: (a) => wheel(a, { deltaY: -3, deltaMode: 1 }) }
  ];

  const ALVOS = [
    ['topo (camada de anotação)', canvasTopo],
    ['canvas do render (WebGL)', canvasRender]
  ];

  const resultado = {
    url: location.href,
    ponto: { x: X, y: Y },
    alvoTopo: caminho(canvasTopo),
    alvoRender: caminho(canvasRender),
    mesmoAlvo: canvasTopo === canvasRender,
    testes: []
  };

  console.log('%c=== TESTE DE ZOOM — não mexa no mouse ===', 'font-weight:bold;font-size:14px;color:#38bdf8');
  console.log('Alvo do topo:', resultado.alvoTopo);
  console.log('Alvo do render:', resultado.alvoRender);
  console.log(`Serão ${TESTES.length * ALVOS.length} testes, 1 a cada ${PAUSA / 1000}s. Anote os números em que a lâmina se mexeu.`);

  const fila = [];
  for (const [rotuloAlvo, alvo] of ALVOS) {
    for (const t of TESTES) fila.push({ rotulo: t.nome + '  @ ' + rotuloAlvo, alvo: alvo, fn: t.fn });
  }

  let i = 0;
  function proximo() {
    if (i >= fila.length) {
      console.log('%c=== FIM. Rode: pgtResultado() ===', 'font-weight:bold;color:#4ade80');
      return;
    }
    const t = fila[i];
    const n = i + 1;
    pairar(t.alvo);
    let tratado = false;
    for (let k = 0; k < REPETICOES; k++) tratado = t.fn(t.alvo) || tratado;
    resultado.testes.push({ n: n, variante: t.rotulo, defaultPrevented: tratado });
    console.log(`%c▶ TESTE ${n}: ${t.rotulo}${tratado ? '   [o app chamou preventDefault]' : ''}`,
      'color:' + (tratado ? '#4ade80' : '#94a3b8'));
    i++;
    setTimeout(proximo, PAUSA);
  }

  window.pgtResultado = function () {
    const s = JSON.stringify(resultado, null, 1);
    console.log(resultado);
    try { copy(s); console.log('%c✔ copiado pro clipboard', 'color:#4ade80'); } catch (e) { console.log(s); }
    return s;
  };

  setTimeout(proximo, 500);
})();
