// ==UserScript==
// @name         Telepato · Contador (Patologia)
// @namespace    https://dasa.com.br/
// @version      1.1.1
// @description  Widget de telepatologia (mitoses, linfonodos e mapeamento de cassetes) acionado por um botão "Opções" no canto inferior direito
// @author       Guilherme
// @match        https://patologia-rj01.dasa.com.br/*
// @match        https://patologia-go01.dasa.com.br/*
// @match        https://patologia-sp01.dasa.com.br/*
// @match        https://patologia-rj02.dasa.com.br/*
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/telepato-contador.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/telepato-contador.user.js
// ==/UserScript==
(function() {
    'use strict';

    console.log('✅ Telepato · Contador v1.1 iniciado');

    const CONFIG = {
        BTN_ID: 'tp-opcoes-btn',
        WIDGET_ID: 'tp-widget-container'
    };

    // ─── ESTILOS (escopados em .tp-widget para não afetar o site) ─────────────────
    GM_addStyle(`
      :root{
        --tp-bg: #12181a;
        --tp-panel: #1a2224;
        --tp-panel-2: #202a2c;
        --tp-border: #2c3739;
        --tp-text: #e6ede9;
        --tp-text-dim: #7e938d;
        --tp-amber: #ffb020;
        --tp-amber-glow: rgba(255,176,32,0.35);
        --tp-teal: #49d3c0;
        --tp-teal-glow: rgba(73,211,192,0.30);
        --tp-violet: #9b8cf2;
        --tp-violet-glow: rgba(155,140,242,0.30);
        --tp-radius: 14px;
        --tp-font-ui: -apple-system, "Segoe UI", system-ui, sans-serif;
        --tp-font-mono: "SF Mono", "Cascadia Code", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
      }

      #${CONFIG.BTN_ID}, #${CONFIG.WIDGET_ID}, #${CONFIG.WIDGET_ID} *{ box-sizing: border-box; }

      /* Botão flutuante "Opções" */
      #${CONFIG.BTN_ID}{
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 10px 16px;
        background: var(--tp-panel);
        color: var(--tp-text);
        border: 1px solid var(--tp-border);
        border-radius: 24px;
        cursor: pointer;
        font-family: var(--tp-font-ui);
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.45);
        transition: border-color .15s ease, transform .1s ease;
      }
      #${CONFIG.BTN_ID}:hover{ border-color: var(--tp-amber); transform: translateY(-1px); }
      #${CONFIG.BTN_ID}:active{ transform: translateY(0); }
      #${CONFIG.BTN_ID} .tp-opcoes-dot{
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--tp-amber); box-shadow: 0 0 6px var(--tp-amber-glow);
      }

      /* Container do widget (posicionado no canto inferior direito, acima do botão) */
      #${CONFIG.WIDGET_ID}{
        position: fixed;
        bottom: 72px;
        right: 20px;
        z-index: 2147483646;
        animation: tp-pop .16s ease;
      }
      @keyframes tp-pop{ from{ opacity:0; transform: translateY(8px); } to{ opacity:1; transform: translateY(0); } }

      .tp-widget{
        width: 234px;
        background: var(--tp-panel);
        border: 1px solid var(--tp-border);
        border-radius: var(--tp-radius);
        box-shadow: 0 12px 28px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.03) inset;
        overflow: hidden;
        user-select: none;
        color: var(--tp-text);
        font-family: var(--tp-font-ui);
        transition: width .2s ease;
      }
      .tp-widget.tp-widget-wide{
        width: 310px;
      }

      .tp-titlebar{
        display:flex; align-items:center; gap: 8px; padding: 10px 12px;
        background: var(--tp-panel-2); border-bottom: 1px solid var(--tp-border);
        font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--tp-text-dim);
      }
      .tp-dot{
        width: 6px; height: 6px; border-radius: 50%; background: var(--tp-amber);
        box-shadow: 0 0 6px var(--tp-amber-glow); flex-shrink: 0;
      }
      .tp-dot.tp-teal{ background: var(--tp-teal); box-shadow: 0 0 6px var(--tp-teal-glow); }
      .tp-dot.tp-violet{ background: var(--tp-violet); box-shadow: 0 0 6px var(--tp-violet-glow); }
      .tp-dot.tp-gradient{ background: linear-gradient(135deg, var(--tp-amber), var(--tp-teal), var(--tp-violet)); box-shadow: 0 0 6px rgba(255,255,255,0.4); }
      .tp-titlebar span{ flex:1; }
      .tp-back{
        appearance:none; background:none; border:none; color: var(--tp-text-dim);
        cursor:pointer; font-size: 13px; padding: 2px 4px; line-height:1; border-radius: 6px;
      }
      .tp-back:hover{ color: var(--tp-text); background: rgba(255,255,255,0.04); }
      .tp-widget .tp-back:focus-visible, .tp-widget button:focus-visible{
        outline: 2px solid var(--tp-teal); outline-offset: 1px;
      }
      .tp-body{ padding: 14px; }
      .tp-body-combined{
        max-height: 75vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }
      .tp-body-combined::-webkit-scrollbar{ width: 5px; }
      .tp-body-combined::-webkit-scrollbar-thumb{ background: var(--tp-border); border-radius: 3px; }

      .tp-section-block{
        background: var(--tp-panel-2);
        border: 1px solid var(--tp-border);
        border-radius: 10px;
        padding: 10px;
      }
      .tp-section-header{
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--tp-text);
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .tp-ico-sm{ color: var(--tp-amber); font-size: 11px; }
      .tp-ico-sm.tp-teal{ color: var(--tp-teal); }
      .tp-ico-sm.tp-violet{ color: var(--tp-violet); }

      .tp-menu-btn{
        width: 100%; display:flex; align-items:center; gap: 10px; padding: 13px 14px; margin-bottom: 8px;
        background: var(--tp-panel-2); border: 1px solid var(--tp-border); border-radius: 10px;
        color: var(--tp-text); font-family: var(--tp-font-ui); font-size: 14px; font-weight: 600;
        cursor: pointer; transition: transform .12s ease, border-color .12s ease, background .12s ease; text-align: left;
      }
      .tp-menu-btn:last-child{ margin-bottom: 0; }
      .tp-menu-btn:hover{ border-color: var(--tp-amber); transform: translateY(-1px); }
      .tp-menu-btn:active{ transform: translateY(0); }
      .tp-menu-btn .tp-ico{
        width: 26px; height:26px; border-radius: 7px; display:flex; align-items:center; justify-content:center;
        font-size: 13px; background: rgba(255,176,32,0.12); color: var(--tp-amber); flex-shrink:0;
      }
      .tp-menu-btn.tp-linfo .tp-ico{ background: rgba(73,211,192,0.12); color: var(--tp-teal); }
      .tp-menu-btn.tp-cassetes .tp-ico{ background: rgba(155,140,242,0.12); color: var(--tp-violet); }
      .tp-menu-btn.tp-combined .tp-ico{ background: rgba(255,255,255,0.1); color: #fff; }
      .tp-menu-btn.tp-combined:hover{ border-color: var(--tp-teal); }
      .tp-menu-btn small{ display:block; font-weight: 400; font-size: 11px; color: var(--tp-text-dim); margin-top: 1px; }

      .tp-counter-display{
        background: #0e1415; border: 1px solid var(--tp-border); border-radius: 10px; padding: 18px 10px;
        text-align: center; margin-bottom: 10px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
      }
      .tp-counter-display.tp-compact{ padding: 10px 8px; margin-bottom: 8px; }
      .tp-counter-num{
        font-family: var(--tp-font-mono); font-variant-numeric: tabular-nums; font-size: 40px; font-weight: 700;
        letter-spacing: 0.04em; color: var(--tp-amber); text-shadow: 0 0 14px var(--tp-amber-glow);
        line-height: 1; transition: transform .1s ease;
      }
      .tp-counter-num.tp-sm{ font-size: 32px; }
      .tp-counter-num.tp-teal{ color: var(--tp-teal); text-shadow: 0 0 14px var(--tp-teal-glow); }
      .tp-counter-label{
        margin-top: 6px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--tp-text-dim);
      }
      .tp-tap-btn{
        width: 100%; padding: 16px; background: linear-gradient(180deg, #26312f, #1c2524);
        border: 1px solid var(--tp-border); border-radius: 10px; color: var(--tp-amber);
        font-family: var(--tp-font-ui); font-size: 15px; font-weight: 700; letter-spacing: 0.03em;
        cursor: pointer; margin-bottom: 8px; transition: transform .06s ease, box-shadow .12s ease;
        box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
      }
      .tp-tap-btn.tp-tap-btn-sm{ padding: 10px; font-size: 13px; margin-bottom: 6px; }
      .tp-tap-btn:hover{ box-shadow: 0 0 0 1px var(--tp-amber) inset; }
      .tp-tap-btn:active{ transform: scale(0.97); }
      .tp-row{ display:flex; gap: 8px; }
      .tp-mini-btn{
        flex: 1; padding: 8px 6px; background: transparent; border: 1px solid var(--tp-border);
        border-radius: 8px; color: var(--tp-text-dim); font-family: var(--tp-font-ui); font-size: 12px;
        cursor: pointer; transition: color .12s ease, border-color .12s ease;
      }
      .tp-mini-btn:hover{ color: var(--tp-text); border-color: #445052; }
      .tp-hint{ text-align:center; font-size: 10px; color: var(--tp-text-dim); margin-top: 10px; opacity: 0.7; }
      .tp-hint kbd{
        font-family: var(--tp-font-mono); background: rgba(255,255,255,0.06); padding: 1px 5px;
        border-radius: 4px; border: 1px solid var(--tp-border);
      }

      .tp-ratio{ display:flex; align-items:baseline; justify-content:center; gap: 6px; font-family: var(--tp-font-mono); font-variant-numeric: tabular-nums; }
      .tp-ratio .tp-num-a{ font-size: 34px; font-weight:700; color: var(--tp-teal); text-shadow: 0 0 14px var(--tp-teal-glow); }
      .tp-ratio.tp-sm .tp-num-a, .tp-ratio.tp-sm .tp-num-b{ font-size: 26px; }
      .tp-ratio .tp-slash{ font-size: 20px; color: var(--tp-text-dim); }
      .tp-ratio .tp-num-b{ font-size: 34px; font-weight:700; color: var(--tp-text); }
      .tp-stepper-group{
        display:flex; justify-content:space-between; align-items:center; background: var(--tp-panel-2);
        border: 1px solid var(--tp-border); border-radius: 10px; padding: 8px 10px; margin-bottom: 8px;
      }
      .tp-stepper-label{ font-size: 11px; color: var(--tp-text-dim); flex: 1; }
      .tp-stepper-label strong{ display:block; font-size: 12px; color: var(--tp-text); font-weight:600; }
      .tp-stepper{ display:flex; align-items:center; gap: 6px; }
      .tp-step-btn{
        width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--tp-border); background: #0e1415;
        color: var(--tp-text); font-size: 15px; line-height:1; cursor:pointer; display:flex; align-items:center;
        justify-content:center; transition: border-color .12s ease, transform .06s ease;
      }
      .tp-step-btn:hover{ border-color: var(--tp-teal); }
      .tp-step-btn:active{ transform: scale(0.92); }
      .tp-step-val{ min-width: 22px; text-align:center; font-family: var(--tp-font-mono); font-size: 14px; font-weight:700; }

      .tp-textarea{
        width: 100%; min-height: 100px; resize: vertical; background: #0e1415; border: 1px solid var(--tp-border);
        border-radius: 10px; color: var(--tp-text); font-family: var(--tp-font-ui); font-size: 12.5px;
        line-height: 1.45; padding: 10px; margin-bottom: 8px;
      }
      .tp-textarea::placeholder{ color: var(--tp-text-dim); }
      .tp-textarea:focus{ outline: none; border-color: var(--tp-violet); box-shadow: 0 0 0 1px var(--tp-violet) inset; }
      .tp-tap-btn.tp-violet-btn{ color: var(--tp-violet); }
      .tp-tap-btn.tp-violet-btn:hover{ box-shadow: 0 0 0 1px var(--tp-violet) inset; }
      .tp-cassetes-list{
        max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
        padding-right: 2px; margin-bottom: 8px;
      }
      .tp-cassetes-list::-webkit-scrollbar{ width: 5px; }
      .tp-cassetes-list::-webkit-scrollbar-thumb{ background: var(--tp-border); border-radius: 3px; }
      .tp-cass-item{
        display: flex; align-items: flex-start; gap: 8px; background: var(--tp-panel-2);
        border: 1px solid var(--tp-border); border-radius: 8px; padding: 7px 9px;
      }
      .tp-cass-badge{
        flex-shrink: 0; font-family: var(--tp-font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
        color: var(--tp-violet); background: rgba(155,140,242,0.12); border: 1px solid rgba(155,140,242,0.35);
        padding: 2px 7px; border-radius: 6px; white-space: nowrap; margin-top: 1px;
      }
      .tp-cass-legend{ font-size: 12.5px; color: var(--tp-text); line-height: 1.35; padding-top: 2px; }
      .tp-cass-item.tp-cass-unparsed .tp-cass-legend{ color: var(--tp-text-dim); font-style: italic; padding-top: 0; }
      .tp-cass-empty{ text-align: center; color: var(--tp-text-dim); font-size: 12px; padding: 18px 6px; }

      @keyframes tp-tick{
        0%   { transform: rotateX(0deg) scale(1); }
        35%  { transform: rotateX(18deg) scale(1.06); }
        100% { transform: rotateX(0deg) scale(1); }
      }
      .tp-tick{ animation: tp-tick 220ms ease; }
      @media (prefers-reduced-motion: reduce){
        .tp-tick, .tp-menu-btn, .tp-tap-btn, .tp-step-btn { animation: none !important; transition: none !important; }
      }
      .tp-screen{ display:none; }
      .tp-screen.tp-active{ display:block; }
    `);

    // ─── MARKUP DO WIDGET ─────────────────────────────────────────────────────────
    const WIDGET_HTML = `
    <div class="tp-widget" id="tp-widget-box" role="application" aria-label="Contador de telepatologia">
      <section class="tp-screen tp-active" id="tp-screen-menu">
        <div class="tp-titlebar"><span class="tp-dot"></span><span>Telepato</span></div>
        <div class="tp-body">
          <button class="tp-menu-btn" id="tp-go-mitoses"><span class="tp-ico">◆</span><span>Mitoses<small>Contagem por campo</small></span></button>
          <button class="tp-menu-btn tp-linfo" id="tp-go-linfonodos"><span class="tp-ico">◈</span><span>Linfonodos<small>Avaliados / acometidos</small></span></button>
          <button class="tp-menu-btn tp-cassetes" id="tp-go-cassetes"><span class="tp-ico">▦</span><span>Mapeamento dos Cassetes<small>Consulta rápida</small></span></button>
          <button class="tp-menu-btn tp-combined" id="tp-go-combined"><span class="tp-ico">✦</span><span>Visão Combinada<small>Ver todos ao mesmo tempo</small></span></button>
        </div>
      </section>

      <section class="tp-screen" id="tp-screen-mitoses">
        <div class="tp-titlebar"><button class="tp-back" data-back aria-label="Voltar ao menu">‹</button><span>Mitoses</span><span class="tp-dot"></span></div>
        <div class="tp-body">
          <div class="tp-counter-display">
            <div class="tp-counter-num" id="tp-mitoses-num">0</div>
            <div class="tp-counter-label">mitoses contadas</div>
          </div>
          <button class="tp-tap-btn" id="tp-mitoses-add">+ 1 MITOSE</button>
          <div class="tp-row">
            <button class="tp-mini-btn" id="tp-mitoses-undo">↺ Desfazer</button>
            <button class="tp-mini-btn" id="tp-mitoses-reset">Zerar</button>
          </div>
          <div class="tp-hint">clique ou pressione <kbd>espaço</kbd></div>
        </div>
      </section>

      <section class="tp-screen" id="tp-screen-linfonodos">
        <div class="tp-titlebar"><button class="tp-back" data-back aria-label="Voltar ao menu">‹</button><span>Linfonodos</span><span class="tp-dot tp-teal"></span></div>
        <div class="tp-body">
          <div class="tp-counter-display">
            <div class="tp-ratio">
              <span class="tp-num-a" id="tp-linfo-acometidos-big">0</span>
              <span class="tp-slash">/</span>
              <span class="tp-num-b" id="tp-linfo-avaliados-big">0</span>
            </div>
            <div class="tp-counter-label">acometidos / avaliados</div>
          </div>
          <div class="tp-stepper-group">
            <div class="tp-stepper-label"><strong>Avaliados</strong>total de linfonodos</div>
            <div class="tp-stepper">
              <button class="tp-step-btn" data-target="avaliados" data-delta="-1">−</button>
              <span class="tp-step-val" id="tp-val-avaliados">0</span>
              <button class="tp-step-btn" data-target="avaliados" data-delta="1">+</button>
            </div>
          </div>
          <div class="tp-stepper-group">
            <div class="tp-stepper-label"><strong>Acometidos</strong>com metástase</div>
            <div class="tp-stepper">
              <button class="tp-step-btn" data-target="acometidos" data-delta="-1">−</button>
              <span class="tp-step-val" id="tp-val-acometidos">0</span>
              <button class="tp-step-btn" data-target="acometidos" data-delta="1">+</button>
            </div>
          </div>
          <div class="tp-row"><button class="tp-mini-btn" id="tp-linfo-reset" style="flex:1">Zerar contagem</button></div>
        </div>
      </section>

      <section class="tp-screen" id="tp-screen-cassetes">
        <div class="tp-titlebar"><button class="tp-back" data-back aria-label="Voltar ao menu">‹</button><span>Cassetes</span><span class="tp-dot tp-violet"></span></div>
        <div class="tp-body">
          <div id="tp-cassetes-input-view">
            <textarea id="tp-cassetes-textarea" class="tp-textarea" placeholder="Cole aqui o mapeamento, ex:&#10;A1 a A5 - área da lesão&#10;A6-7 Linfonodos (um em cada cassete)&#10;A8: omento"></textarea>
            <button class="tp-tap-btn tp-violet-btn" id="tp-cassetes-process">Ver mapeamento</button>
          </div>
          <div id="tp-cassetes-list-view" style="display:none;">
            <div class="tp-cassetes-list" id="tp-cassetes-list"></div>
            <div class="tp-row">
              <button class="tp-mini-btn" id="tp-cassetes-edit">✎ Editar</button>
              <button class="tp-mini-btn" id="tp-cassetes-clear">Limpar</button>
            </div>
          </div>
        </div>
      </section>

      <!-- NOVO: VISÃO COMBINADA (TODOS AO MESMO TEMPO) -->
      <section class="tp-screen" id="tp-screen-combined">
        <div class="tp-titlebar"><button class="tp-back" data-back aria-label="Voltar ao menu">‹</button><span>Visão Combinada</span><span class="tp-dot tp-gradient"></span></div>
        <div class="tp-body-combined">

          <!-- Bloco Mitoses -->
          <div class="tp-section-block">
            <div class="tp-section-header"><span class="tp-ico-sm">◆</span> Mitoses</div>
            <div class="tp-counter-display tp-compact">
              <div class="tp-counter-num tp-sm" id="tp-mitoses-num-comb">0</div>
              <div class="tp-counter-label">mitoses contadas</div>
            </div>
            <button class="tp-tap-btn tp-tap-btn-sm" id="tp-mitoses-add-comb">+ 1 MITOSE</button>
            <div class="tp-row">
              <button class="tp-mini-btn" id="tp-mitoses-undo-comb">↺ Desfazer</button>
              <button class="tp-mini-btn" id="tp-mitoses-reset-comb">Zerar</button>
            </div>
            <div class="tp-hint">atalho: <kbd>espaço</kbd></div>
          </div>

          <!-- Bloco Linfonodos -->
          <div class="tp-section-block">
            <div class="tp-section-header"><span class="tp-ico-sm tp-teal">◈</span> Linfonodos</div>
            <div class="tp-counter-display tp-compact">
              <div class="tp-ratio tp-sm">
                <span class="tp-num-a" id="tp-linfo-acometidos-big-comb">0</span>
                <span class="tp-slash">/</span>
                <span class="tp-num-b" id="tp-linfo-avaliados-big-comb">0</span>
              </div>
              <div class="tp-counter-label">acometidos / avaliados</div>
            </div>
            <div class="tp-stepper-group">
              <div class="tp-stepper-label"><strong>Avaliados</strong>total</div>
              <div class="tp-stepper">
                <button class="tp-step-btn" data-target="avaliados" data-delta="-1">−</button>
                <span class="tp-step-val" id="tp-val-avaliados-comb">0</span>
                <button class="tp-step-btn" data-target="avaliados" data-delta="1">+</button>
              </div>
            </div>
            <div class="tp-stepper-group">
              <div class="tp-stepper-label"><strong>Acometidos</strong>metástase</div>
              <div class="tp-stepper">
                <button class="tp-step-btn" data-target="acometidos" data-delta="-1">−</button>
                <span class="tp-step-val" id="tp-val-acometidos-comb">0</span>
                <button class="tp-step-btn" data-target="acometidos" data-delta="1">+</button>
              </div>
            </div>
            <div class="tp-row"><button class="tp-mini-btn" id="tp-linfo-reset-comb" style="flex:1">Zerar contagem</button></div>
          </div>

          <!-- Bloco Cassetes -->
          <div class="tp-section-block">
            <div class="tp-section-header"><span class="tp-ico-sm tp-violet">▦</span> Cassetes</div>
            <div id="tp-cassetes-input-view-comb">
              <textarea id="tp-cassetes-textarea-comb" class="tp-textarea" placeholder="Cole aqui o mapeamento..."></textarea>
              <button class="tp-tap-btn tp-violet-btn tp-tap-btn-sm" id="tp-cassetes-process-comb">Ver mapeamento</button>
            </div>
            <div id="tp-cassetes-list-view-comb" style="display:none;">
              <div class="tp-cassetes-list" id="tp-cassetes-list-comb"></div>
              <div class="tp-row">
                <button class="tp-mini-btn" id="tp-cassetes-edit-comb">✎ Editar</button>
                <button class="tp-mini-btn" id="tp-cassetes-clear-comb">Limpar</button>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>`;

    // ─── LÓGICA DO WIDGET ─────────────────────────────────────────────────────────
    function inicializarWidget(root) {
        const $ = (sel) => root.querySelector(sel);
        const widgetBox = $('#tp-widget-box');

        const state = {
            mitoses: 0,
            mitosesHistory: [],
            linfonodos: { avaliados: 0, acometidos: 0 },
            cassetes: { raw: '', items: [] }
        };

        const screens = {
            menu: $('#tp-screen-menu'),
            mitoses: $('#tp-screen-mitoses'),
            linfonodos: $('#tp-screen-linfonodos'),
            cassetes: $('#tp-screen-cassetes'),
            combined: $('#tp-screen-combined')
        };

        function showScreen(name) {
            Object.keys(screens).forEach((k) => screens[k].classList.toggle('tp-active', k === name));
            widgetBox.classList.toggle('tp-widget-wide', name === 'combined');
        }

        $('#tp-go-mitoses').addEventListener('click', () => showScreen('mitoses'));
        $('#tp-go-linfonodos').addEventListener('click', () => showScreen('linfonodos'));
        $('#tp-go-cassetes').addEventListener('click', () => showScreen('cassetes'));
        $('#tp-go-combined').addEventListener('click', () => showScreen('combined'));
        root.querySelectorAll('[data-back]').forEach((btn) => btn.addEventListener('click', () => showScreen('menu')));

        // ---------------- Mitoses ----------------
        const mitosesNumEl = $('#tp-mitoses-num');
        const mitosesNumCombEl = $('#tp-mitoses-num-comb');

        function tick(el) {
            if (!el) return;
            el.classList.remove('tp-tick');
            void el.offsetWidth;
            el.classList.add('tp-tick');
        }

        function renderMitoses() {
            if (mitosesNumEl) mitosesNumEl.textContent = state.mitoses;
            if (mitosesNumCombEl) mitosesNumCombEl.textContent = state.mitoses;
        }

        function addMitose() {
            state.mitoses += 1;
            state.mitosesHistory.push(1);
            renderMitoses();
            tick(mitosesNumEl);
            tick(mitosesNumCombEl);
        }

        function undoMitose() {
            if (state.mitosesHistory.length === 0) return;
            state.mitosesHistory.pop();
            state.mitoses = Math.max(0, state.mitoses - 1);
            renderMitoses();
            tick(mitosesNumEl);
            tick(mitosesNumCombEl);
        }

        function resetMitoses() {
            state.mitoses = 0;
            state.mitosesHistory = [];
            renderMitoses();
        }

        $('#tp-mitoses-add').addEventListener('click', addMitose);
        $('#tp-mitoses-add-comb').addEventListener('click', addMitose);

        $('#tp-mitoses-undo').addEventListener('click', undoMitose);
        $('#tp-mitoses-undo-comb').addEventListener('click', undoMitose);

        $('#tp-mitoses-reset').addEventListener('click', resetMitoses);
        $('#tp-mitoses-reset-comb').addEventListener('click', resetMitoses);

        // atalho espaço: soma 1 mitose só quando a tela Mitoses ou Combinada está ativa
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;
            const isMitosesActive = screens.mitoses.classList.contains('tp-active');
            const isCombinedActive = screens.combined.classList.contains('tp-active');
            if (!isMitosesActive && !isCombinedActive) return;
            if (document.getElementById(CONFIG.WIDGET_ID)?.style.display === 'none') return;
            const alvo = e.target;
            const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
            if (digitando && !root.contains(alvo)) return;
            e.preventDefault();
            addMitose();
        });

        // ---------------- Linfonodos ----------------
        const linfoValEls = { avaliados: $('#tp-val-avaliados'), acometidos: $('#tp-val-acometidos') };
        const linfoBigEls = { avaliados: $('#tp-linfo-avaliados-big'), acometidos: $('#tp-linfo-acometidos-big') };
        const linfoValCombEls = { avaliados: $('#tp-val-avaliados-comb'), acometidos: $('#tp-val-acometidos-comb') };
        const linfoBigCombAcometidos = $('#tp-linfo-acometidos-big-comb');
        const linfoBigCombAvaliados = $('#tp-linfo-avaliados-big-comb');

        function renderLinfo() {
            linfoValEls.avaliados.textContent = state.linfonodos.avaliados;
            linfoValEls.acometidos.textContent = state.linfonodos.acometidos;
            linfoBigEls.avaliados.textContent = state.linfonodos.avaliados;
            linfoBigEls.acometidos.textContent = state.linfonodos.acometidos;

            if (linfoValCombEls.avaliados) linfoValCombEls.avaliados.textContent = state.linfonodos.avaliados;
            if (linfoValCombEls.acometidos) linfoValCombEls.acometidos.textContent = state.linfonodos.acometidos;
            if (linfoBigCombAvaliados) linfoBigCombAvaliados.textContent = state.linfonodos.avaliados;
            if (linfoBigCombAcometidos) linfoBigCombAcometidos.textContent = state.linfonodos.acometidos;
        }

        root.querySelectorAll('.tp-step-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                const delta = parseInt(btn.getAttribute('data-delta'), 10);
                const next = state.linfonodos[target] + delta;
                if (next < 0) return;
                if (target === 'acometidos' && next > state.linfonodos.avaliados) return;
                if (target === 'avaliados' && next < state.linfonodos.acometidos) return;
                state.linfonodos[target] = next;
                renderLinfo();
                tick(linfoBigEls[target]);
                if (target === 'acometidos') tick(linfoBigCombAcometidos);
                if (target === 'avaliados') tick(linfoBigCombAvaliados);
            });
        });

        function resetLinfo() {
            state.linfonodos.avaliados = 0;
            state.linfonodos.acometidos = 0;
            renderLinfo();
        }

        $('#tp-linfo-reset').addEventListener('click', resetLinfo);
        $('#tp-linfo-reset-comb').addEventListener('click', resetLinfo);

        // ---------------- Mapeamento dos Cassetes ----------------
        const cassetesTextarea = $('#tp-cassetes-textarea');
        const cassetesInputView = $('#tp-cassetes-input-view');
        const cassetesListView = $('#tp-cassetes-list-view');
        const cassetesListEl = $('#tp-cassetes-list');

        const cassetesTextareaComb = $('#tp-cassetes-textarea-comb');
        const cassetesInputViewComb = $('#tp-cassetes-input-view-comb');
        const cassetesListViewComb = $('#tp-cassetes-list-view-comb');
        const cassetesListCombEl = $('#tp-cassetes-list-comb');

        const CASSETE_REGEX = /^([A-Za-z]{1,3}\s*\d+(?:\s*-\s*\d+|\s+a\s+[A-Za-z]{0,3}\s*\d+)?)\s*[:\-–—]?\s*(.+)$/i;

        function formatCode(code) {
            return code.replace(/\s+/g, ' ').trim().replace(/\s*-\s*/g, '-').replace(/\s+a\s+/i, '–');
        }
        function parseCassetes(raw) {
            const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
            return lines.map((line) => {
                const m = line.match(CASSETE_REGEX);
                if (m && m[2] && m[2].trim().length > 0) return { code: formatCode(m[1]), legend: m[2].trim() };
                return { code: null, legend: line };
            });
        }

        function populateList(container) {
            if (!container) return;
            container.innerHTML = '';
            if (state.cassetes.items.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'tp-cass-empty';
                empty.textContent = 'Nenhum cassete colado ainda.';
                container.appendChild(empty);
                return;
            }
            state.cassetes.items.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'tp-cass-item' + (item.code ? '' : ' tp-cass-unparsed');
                if (item.code) {
                    const badge = document.createElement('span');
                    badge.className = 'tp-cass-badge';
                    badge.textContent = item.code;
                    row.appendChild(badge);
                }
                const legend = document.createElement('span');
                legend.className = 'tp-cass-legend';
                legend.textContent = item.legend;
                row.appendChild(legend);
                container.appendChild(row);
            });
        }

        function renderCassetesList() {
            populateList(cassetesListEl);
            populateList(cassetesListCombEl);
        }

        function showCassetesInput() {
            cassetesInputView.style.display = '';
            cassetesListView.style.display = 'none';
            if (cassetesInputViewComb) cassetesInputViewComb.style.display = '';
            if (cassetesListViewComb) cassetesListViewComb.style.display = 'none';
        }

        function showCassetesList() {
            cassetesInputView.style.display = 'none';
            cassetesListView.style.display = '';
            if (cassetesInputViewComb) cassetesInputViewComb.style.display = 'none';
            if (cassetesListViewComb) cassetesListViewComb.style.display = '';
        }

        function processCassetes(rawVal) {
            state.cassetes.raw = rawVal;
            state.cassetes.items = parseCassetes(rawVal);
            cassetesTextarea.value = rawVal;
            if (cassetesTextareaComb) cassetesTextareaComb.value = rawVal;
            renderCassetesList();
            showCassetesList();
        }

        $('#tp-cassetes-process').addEventListener('click', () => processCassetes(cassetesTextarea.value));
        $('#tp-cassetes-process-comb').addEventListener('click', () => processCassetes(cassetesTextareaComb.value));

        $('#tp-cassetes-edit').addEventListener('click', showCassetesInput);
        $('#tp-cassetes-edit-comb').addEventListener('click', showCassetesInput);

        function clearCassetes() {
            state.cassetes.raw = '';
            state.cassetes.items = [];
            cassetesTextarea.value = '';
            if (cassetesTextareaComb) cassetesTextareaComb.value = '';
            showCassetesInput();
        }

        $('#tp-cassetes-clear').addEventListener('click', clearCassetes);
        $('#tp-cassetes-clear-comb').addEventListener('click', clearCassetes);

        renderMitoses();
        renderLinfo();
    }

    // ─── CRIAR UI (botão Opções + widget) ─────────────────────────────────────────
    function criarUI() {
        if (document.getElementById(CONFIG.BTN_ID)) return;

        const btn = document.createElement('button');
        btn.id = CONFIG.BTN_ID;
        btn.type = 'button';
        btn.innerHTML = '<span class="tp-opcoes-dot"></span>Opções';

        const container = document.createElement('div');
        container.id = CONFIG.WIDGET_ID;
        container.innerHTML = WIDGET_HTML;
        container.style.display = 'none';

        document.body.appendChild(btn);
        document.body.appendChild(container);

        btn.addEventListener('click', () => {
            container.style.display = (container.style.display === 'none') ? 'block' : 'none';
        });

        inicializarWidget(container);
        console.log('✅ Telepato injetado (botão Opções no canto inferior direito)');
    }

    criarUI();
    // Reinjeta caso o site remova os elementos (SPA)
    new MutationObserver(() => {
        if (!document.getElementById(CONFIG.BTN_ID)) criarUI();
    }).observe(document.body, { childList: true, subtree: true });

    console.log('✅ Telepato · Contador pronto');
})();
