// ==UserScript==
// @name         Motion DASA - Buscador Rápido de Casos (Painel)
// @namespace    https://motionap.dasa.com.br/
// @version      2.1.1
// @description  Caixa de busca ancorada nas abas do painel; filtra por FAP/nome, Enter abre o 1º caso e clica em Liberar Resultados
// @author       Guilherme
// @match        https://motionap.dasa.com.br/dashu/list.action*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-buscador-casos.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-buscador-casos.user.js
// ==/UserScript==
(function() {
    'use strict';

    console.log('✅ Buscador Rápido de Casos v2.1 Iniciado');

    // ─── CONFIG ──────────────────────────────────────────────────────────────────
    const CONFIG = {
        BOX_ID: 'motion-busca-box',
        INPUT_ID: 'motion-busca-input',
        COUNT_ID: 'motion-busca-count',

        SELETOR_FAP: 'td.requisicao',       // célula do número de FAP (também é o gatilho de "estou no painel")
        SELETOR_NOME: 'td.paciente',        // célula do nome do paciente

        // Elemento ao qual a caixa é ancorada (fica à direita dele, mesma altura).
        // São as abas de dashboard no topo do painel.
        ANCORA_SELECTOR: 'li.header[tpanelid]',
        OFFSET_X: 8,                        // distância (px) à direita da âncora

        // Ação disparada ao apertar Enter no primeiro resultado.
        // Troque para 'CONSULTA_REQUISICAO' se preferir abrir o popup de consulta.
        ACAO_ENTER: 'DETALHES',

        // Depois de abrir o caso, clica automaticamente neste botão do popup.
        // Deixe '' (vazio) para desativar o auto-clique.
        BOTAO_POS_ABERTURA: 'Liberar Resultados',
        TIMEOUT_POPUP: 9000,               // tempo máx. (ms) esperando o popup surgir

        FOCUS_SHORTCUT: '/'                 // tecla que foca a caixa de busca
    };

    // ─── ESTADO ──────────────────────────────────────────────────────────────────
    let termoAtual = '';
    let primeiroMatch = null;

    // ─── STEALTH: atrasos aleatórios (evita padrão robótico p/ Akamai) ───────────
    function delayAleatorio(min = 250, max = 700) {
        return Math.random() * (max - min) + min;
    }

    // ─── ESTILOS ────────────────────────────────────────────────────────────────
    GM_addStyle(`
        #${CONFIG.BOX_ID} {
            position: fixed;
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 6px;
            box-sizing: border-box;
            padding: 0 8px;
            width: 360px;
            max-width: 46vw;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            border: 1px solid #4CAF50;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(76, 175, 80, 0.35);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #${CONFIG.BOX_ID} .motion-busca-icon { font-size: 14px; line-height: 1; flex-shrink: 0; }
        #${CONFIG.INPUT_ID} {
            flex: 1;
            min-width: 0;
            height: 68%;
            box-sizing: border-box;
            background: #111;
            border: 1px solid #404040;
            color: #e0e0e0;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 13px;
            outline: none;
            transition: border-color .15s, box-shadow .15s;
        }
        #${CONFIG.INPUT_ID}:focus {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, .25);
        }
        #${CONFIG.INPUT_ID}::placeholder { color: #777; }
        #${CONFIG.COUNT_ID} {
            font-size: 10px;
            color: #9aa2b1;
            white-space: nowrap;
            flex-shrink: 0;
        }
        #${CONFIG.COUNT_ID}.zero { color: #ff5c7c; }
        #${CONFIG.BOX_ID} .motion-busca-clear {
            background: rgba(255,255,255,.12);
            border: none; color: #ccc; cursor: pointer;
            width: 20px; height: 20px; border-radius: 50%;
            font-size: 12px; line-height: 1; flex-shrink: 0;
        }
        #${CONFIG.BOX_ID} .motion-busca-clear:hover { background: rgba(255,255,255,.25); color: #fff; }

        /* Realce da primeira linha (a que o Enter vai abrir) */
        tr.motion-busca-first > td {
            background: rgba(76, 175, 80, 0.18) !important;
        }
        tr.motion-busca-first > td:first-child {
            box-shadow: inset 3px 0 0 #4CAF50;
        }
    `);

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    // Normaliza: minúsculas, sem acentos, só letras e números.
    // Assim "Jamysson Islan" casa com "jamyssonislan" e "9703 0427" casa com FAP.
    function norm(s) {
        return (s || '')
            .toString()
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    function textoLimpo(el) {
        return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    // Existe painel de pacientes carregado? (gatilho de exibição — não depende da URL)
    function painelPresente() {
        return document.querySelector(CONFIG.SELETOR_FAP) !== null;
    }

    // Âncora = última aba de dashboard (a caixa fica à direita dela)
    function obterAncora() {
        const abas = document.querySelectorAll(CONFIG.ANCORA_SELECTOR);
        return abas.length ? abas[abas.length - 1] : null;
    }

    // Todas as linhas de paciente do painel (mesmo em portlets diferentes)
    function obterLinhas() {
        return [...document.querySelectorAll(CONFIG.SELETOR_FAP)]
            .map(td => td.closest('tr'))
            .filter(Boolean);
    }

    function textoCelula(tr, seletor) {
        return textoLimpo(tr.querySelector(seletor));
    }

    // ─── POSICIONAR A CAIXA (colada à direita da aba, mesma altura) ───────────────
    function posicionarBox() {
        const box = document.getElementById(CONFIG.BOX_ID);
        if (!box) return;
        const anc = obterAncora();
        const r = anc ? anc.getBoundingClientRect() : null;

        if (r && (r.width || r.height)) {
            // Ancorada à direita da aba, mesma altura
            box.style.height = r.height + 'px';
            box.style.top = r.top + 'px';
            box.style.left = (r.right + CONFIG.OFFSET_X) + 'px';
            box.style.right = 'auto';
        } else {
            // Fallback: se a âncora não estiver disponível, não some — vai pro topo
            box.style.height = '';
            box.style.top = '8px';
            box.style.left = 'auto';
            box.style.right = '12px';
        }
    }

    // ─── FILTRO ──────────────────────────────────────────────────────────────────
    function aplicarFiltro() {
        const termo = norm(termoAtual);
        const linhas = obterLinhas();
        let visiveis = 0;
        primeiroMatch = null;

        document.querySelectorAll('tr.motion-busca-first')
            .forEach(tr => tr.classList.remove('motion-busca-first'));

        linhas.forEach(tr => {
            const fap = textoCelula(tr, CONFIG.SELETOR_FAP);
            const nome = textoCelula(tr, CONFIG.SELETOR_NOME);
            const hay = norm(nome) + norm(fap);
            const match = !termo || hay.includes(termo);

            tr.style.display = match ? '' : 'none';
            if (match) {
                visiveis++;
                if (!primeiroMatch) primeiroMatch = tr;
            }
        });

        if (termo && primeiroMatch) {
            primeiroMatch.classList.add('motion-busca-first');
        }

        atualizarContador(termo, visiveis, linhas.length);
    }

    function atualizarContador(termo, visiveis, total) {
        const count = document.getElementById(CONFIG.COUNT_ID);
        if (!count) return;
        if (!termo) {
            count.textContent = `${total} casos`;
            count.classList.remove('zero');
        } else if (visiveis === 0) {
            count.textContent = 'nenhum';
            count.classList.add('zero');
        } else {
            count.textContent = `${visiveis}/${total}`;
            count.classList.remove('zero');
        }
    }

    // ─── ABRIR CASO + AUTO-CLIQUE NO POPUP ────────────────────────────────────────
    function abrirCaso(tr) {
        if (!tr) {
            console.warn('⚠️ Nenhum caso no filtro para abrir');
            return;
        }
        const btn = tr.querySelector(`[caction="${CONFIG.ACAO_ENTER}"]`);
        if (!btn) {
            console.warn(`⚠️ Botão "${CONFIG.ACAO_ENTER}" não encontrado na linha`);
            return;
        }
        const fap = textoCelula(tr, CONFIG.SELETOR_FAP);
        console.log(`🔓 Abrindo caso FAP ${fap} via ${CONFIG.ACAO_ENTER}`);

        // Pequeno atraso humano antes do 1º clique (stealth)
        setTimeout(() => {
            (btn.querySelector('.button-content') || btn).click();

            // Depois de abrir, aguarda o popup e clica em "Liberar Resultados"
            if (CONFIG.BOTAO_POS_ABERTURA) {
                aguardarBotaoPorTexto(CONFIG.BOTAO_POS_ABERTURA, (alvo) => {
                    // Outro atraso aleatório antes de clicar no popup (stealth)
                    setTimeout(() => {
                        const clicavel = alvo.closest('.button') || alvo.parentElement || alvo;
                        console.log(`▶️ Clicando em "${CONFIG.BOTAO_POS_ABERTURA}"`);
                        clicavel.click();
                    }, delayAleatorio(450, 950));
                }, CONFIG.TIMEOUT_POPUP);
            }
        }, delayAleatorio(300, 600));
    }

    // Procura um elemento clicável cujo texto seja exatamente `texto`
    function encontrarPorTexto(texto) {
        const cand = document.querySelectorAll('.button-content, [caction], button, a');
        for (const el of cand) {
            if (textoLimpo(el) === texto) return el;
        }
        return null;
    }

    // Espera (via observer passivo) o botão surgir; chama aoAchar(el) uma única vez
    function aguardarBotaoPorTexto(texto, aoAchar, timeout) {
        const jaExiste = encontrarPorTexto(texto);
        if (jaExiste) { aoAchar(jaExiste); return; }

        let resolvido = false;
        const obs = new MutationObserver(() => {
            const el = encontrarPorTexto(texto);
            if (el && !resolvido) {
                resolvido = true;
                obs.disconnect();
                aoAchar(el);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            if (!resolvido) {
                resolvido = true;
                obs.disconnect();
                console.warn(`⚠️ Botão "${texto}" não apareceu em ${timeout}ms`);
            }
        }, timeout);
    }

    // ─── CRIAR / REMOVER CAIXA DE BUSCA ───────────────────────────────────────────
    function criarBox() {
        if (document.getElementById(CONFIG.BOX_ID)) return;

        const box = document.createElement('div');
        box.id = CONFIG.BOX_ID;
        box.innerHTML = `
            <span class="motion-busca-icon">🔍</span>
            <input id="${CONFIG.INPUT_ID}" type="text" placeholder="Buscar por FAP ou nome…" autocomplete="off" />
            <span id="${CONFIG.COUNT_ID}"></span>
            <button class="motion-busca-clear" title="Limpar (Esc)">✕</button>
        `;
        document.body.appendChild(box);

        const input = box.querySelector(`#${CONFIG.INPUT_ID}`);
        const btnClear = box.querySelector('.motion-busca-clear');

        input.value = termoAtual;

        input.addEventListener('input', () => {
            termoAtual = input.value;
            aplicarFiltro();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                abrirCaso(primeiroMatch);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                limpar(input);
            }
        });

        btnClear.addEventListener('click', () => limpar(input));

        // Impede que atalhos de teclado da página capturem o que é digitado aqui
        ['keydown', 'keypress', 'keyup'].forEach(ev =>
            input.addEventListener(ev, e => e.stopPropagation()));

        posicionarBox();
        aplicarFiltro();
        input.focus();
        console.log('✅ Caixa de busca criada');
    }

    function removerBox() {
        const box = document.getElementById(CONFIG.BOX_ID);
        if (box) {
            box.remove();
            console.log('👋 Painel ausente — caixa de busca removida');
        }
    }

    function limpar(input) {
        termoAtual = '';
        if (input) { input.value = ''; input.focus(); }
        aplicarFiltro();
    }

    // ─── MONITORAR ───────────────────────────────────────────────────────────────
    let debounce;
    function monitorar() {
        // Mostra sempre que o painel de pacientes está carregado (gatilho independente da URL).
        // A âncora define só a POSIÇÃO (com fallback), não a existência da caixa.
        if (painelPresente()) {
            criarBox();
            posicionarBox();
            aplicarFiltro();
        } else {
            removerBox();
        }
    }

    monitorar();

    const observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(monitorar, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Heartbeat: reavalia periodicamente, garantindo que a caixa reapareça ao voltar
    // do caso mesmo que o observer seja "afogado" por mutações contínuas do painel.
    setInterval(monitorar, 800);

    // Reposiciona a caixa quando a página rola ou é redimensionada
    window.addEventListener('scroll', posicionarBox, true);
    window.addEventListener('resize', posicionarBox);

    // Atalho: tecla "/" foca a busca (se não estiver digitando em outro campo)
    document.addEventListener('keydown', (e) => {
        if (e.key === CONFIG.FOCUS_SHORTCUT) {
            const alvo = e.target;
            const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
            if (!digitando) {
                const input = document.getElementById(CONFIG.INPUT_ID);
                if (input) { e.preventDefault(); input.focus(); }
            }
        }
    });

    console.log('✅ Buscador Rápido v2.1 pronto');
})();
