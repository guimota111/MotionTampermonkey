// ==UserScript==
// @name         Motion · Extrator de Casos (Monitor de Pendências)
// @namespace    https://github.com/guimota111/MotionTampermonkey
// @version      1.2.1
// @description  Botão que aparece no Monitor de Pendências quando há casos: extrai prazo, FAP, nome, tipo de pendência e flags, e envia a lista para o Organizador de Casos.
// @author       guimota111
// @match        https://motionap.dasa.com.br/velab-monitores/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-extrator-casos.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-extrator-casos.user.js
// ==/UserScript==
(function () {
    'use strict';

    // O script roda em todos os frames (a grade fica dentro de um deles).
    // Num documento <frameset> não existe body — aí não há nada a fazer.
    if (!document.body) return;

    // Endereço do Organizador de Casos (GitHub Pages). Ajuste se o seu for outro.
    const URL_ORGANIZADOR = 'https://guimota111.github.io/OrganizadorCasos/';

    // true = botão fica sempre na tela (cinza quando não há casos), útil para
    // depurar. false = só aparece quando a grade tem casos.
    const SEMPRE_VISIVEL = false;

    const limpar = t => (t || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

    /* ---------------------------------------------------------------- *
     * Extração
     * ---------------------------------------------------------------- */

    // A grade pode ser renderizada dentro de um iframe de mesma origem, então
    // procuramos no documento atual e em todos os frames acessíveis.
    function documentos() {
        const docs = [document];
        document.querySelectorAll('iframe, frame').forEach(f => {
            try { if (f.contentDocument && f.contentDocument.body) docs.push(f.contentDocument); } catch (e) {}
        });
        return docs;
    }

    // Cada caso é a <tr> cujo seletor carrega data-pendencia — pode ser td ou th,
    // então não filtramos por tag. A grade tem uma <tr class="header"> oculta que
    // também tem data-pendencia; ela é descartada por não ter texto algum.
    //
    // Laço explícito de propósito: a página carrega o Prototype.js, que troca
    // Array.prototype.filter pela versão dele (chama o callback só com valor e
    // índice, sem o array). Nada aqui depende da assinatura dos callbacks.
    function linhasDeCasos() {
        const linhas = [];
        const vistas = new Set();

        documentos().forEach(function (doc) {
            const marcadores = doc.querySelectorAll('[data-pendencia]');
            for (let i = 0; i < marcadores.length; i++) {
                const linha = marcadores[i].closest('tr');
                if (!linha || vistas.has(linha)) continue;
                if (linha.classList.contains('header')) continue;
                if (!limpar(linha.textContent)) continue;
                vistas.add(linha);
                linhas.push(linha);
            }
        });

        return linhas;
    }

    // "2d04h", "14h30m", "45m" -> horas decimais
    function paraHoras(texto) {
        const t = limpar(texto).toLowerCase();
        const dias = /(\d+)\s*d/.exec(t);
        const horas = /(\d+)\s*h/.exec(t);
        const minutos = /(\d+)\s*m(?!s)/.exec(t);
        if (!dias && !horas && !minutos) return null;
        const total = (dias ? +dias[1] * 24 : 0) + (horas ? +horas[1] : 0) + (minutos ? +minutos[1] / 60 : 0);
        return Math.round(total * 10) / 10;
    }

    const FLAGS = {
        urgente:   ['tcolor-urgent'],
        alerta:    ['ticon-alerta'],
        bloqueado: ['ticon-cadeado-fechado', 'tcolor-locked'],
        imagens:   ['ticon-arquivo-imagem'],
        pedidoEscaneado: ['ticon-prancheta-lista'],
    };

    function extrairCaso(linha, indice) {
        const celulas = [...linha.children];
        const caso = { n: indice + 1 };

        caso.id = (linha.querySelector('[data-pendencia]') || {}).dataset?.pendencia || '';

        // Prazo: célula do timer (classe listaTimer) ou texto no formato 2d04h / 14h30m.
        const celulaPrazo = celulas.find(c => c.querySelector('.listaTimer') || c.classList.contains('listaTimer')) ||
            celulas.find(c => /^\s*\d+\s*[dhm]/i.test(limpar(c.textContent)) && limpar(c.textContent).length <= 10);
        caso.prazo = celulaPrazo ? limpar(celulaPrazo.textContent) : '';
        caso.horas = paraHoras(caso.prazo);
        const dica = celulaPrazo && (celulaPrazo.getAttribute('title') ||
            (celulaPrazo.querySelector('[title]') || {}).title);
        if (dica) caso.prazoDetalhe = limpar(dica);

        // FAP: célula puramente numérica de 12 dígitos (é a chave do Organizador).
        const celulaReq = celulas.find(c => /^\d{10,14}$/.test(limpar(c.textContent)));
        caso.fap = celulaReq ? limpar(celulaReq.textContent).replace(/\D/g, '').slice(-12) : '';

        // Nome + código interno (formato XX-99-9999) dividem a mesma célula.
        const celulaNome = [...celulas].reverse().find(c => {
            const t = limpar(c.textContent);
            return t.length > 6 && /[A-Za-zÀ-ÿ]{3}/.test(t) && c !== celulaPrazo && c !== celulaReq;
        });
        if (celulaNome) {
            const pedacos = [...celulaNome.querySelectorAll('*')]
                .filter(el => !el.children.length && limpar(el.textContent))
                .map(el => limpar(el.textContent));
            const codigoEmPedaco = pedacos.find(p => /^[A-Z]{2,4}-\d{2}-\d+$/.test(p));
            if (codigoEmPedaco) {
                caso.codigo = codigoEmPedaco;
                caso.nome = pedacos.filter(p => p !== codigoEmPedaco).join(' ').trim();
            } else {
                const texto = limpar(celulaNome.textContent);
                const encontrado = /([A-Z]{2,4}-\d{2}-\d+)\s*$/.exec(texto);
                caso.codigo = encontrado ? encontrado[1] : '';
                caso.nome = encontrado ? texto.slice(0, encontrado.index).trim() : texto;
            }
        } else {
            caso.codigo = '';
            caso.nome = '';
        }

        // Tipo de pendência: só existe como tooltip dos ícones.
        const celulaIcones = celulas.find(c => c.classList.contains('preventRowSelection')) || linha;
        const tipos = new Set();
        celulaIcones.querySelectorAll('span, [title]').forEach(el => {
            const texto = limpar(el.getAttribute('title') || (el.children.length ? '' : el.textContent));
            if (texto && texto.length > 3 && texto.length < 80) tipos.add(texto);
        });
        caso.tipos = [...tipos].join(' | ');

        // Flags de estado, codificadas em classes de ícone.
        const classes = new Set();
        linha.querySelectorAll('*').forEach(el => el.classList.forEach(c => classes.add(c)));
        Object.keys(FLAGS).forEach(flag => {
            caso[flag] = FLAGS[flag].some(c => classes.has(c)) ? 'SIM' : '';
        });

        return caso;
    }

    function extrair() {
        return linhasDeCasos().map(extrairCaso);
    }

    const COLUNAS = ['n', 'prazo', 'horas', 'fap', 'nome', 'codigo', 'tipos',
        'urgente', 'alerta', 'bloqueado', 'imagens', 'pedidoEscaneado', 'id', 'prazoDetalhe'];

    /* ---------------------------------------------------------------- *
     * Painel
     * ---------------------------------------------------------------- */

    const CSS = `
    #mpx-btn{position:fixed;bottom:20px;right:20px;z-index:2147483646;background:#2563eb;color:#fff;
        border:0;border-radius:999px;padding:12px 18px;font:600 14px/1 system-ui,sans-serif;cursor:pointer;
        box-shadow:0 6px 20px rgba(0,0,0,.3)}
    #mpx-btn:hover{background:#1d4ed8}
    #mpx-btn.mpx-vazio{background:#475569;cursor:default}
    #mpx-btn.mpx-vazio:hover{background:#475569}
    .mpx-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.8);display:flex;
        align-items:center;justify-content:center;padding:24px}
    .mpx-painel{background:#0f172a;color:#e2e8f0;border:1px solid #1e293b;border-radius:14px;
        width:min(1250px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;
        font:14px/1.45 system-ui,sans-serif}
    .mpx-topo{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid #1e293b}
    .mpx-topo h2{margin:0;font-size:16px;flex:1}
    .mpx-topo button{background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;
        padding:7px 12px;font-size:13px;cursor:pointer}
    .mpx-topo button:hover{background:#334155}
    .mpx-topo button.mpx-primario{background:#2563eb;border-color:#2563eb;color:#fff}
    .mpx-topo input{background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:7px 10px}
    .mpx-corpo{overflow:auto;padding:0 16px 16px}
    .mpx-corpo table{border-collapse:collapse;width:100%;font-size:12.5px}
    .mpx-corpo th{position:sticky;top:0;background:#1e293b;text-align:left;padding:8px;
        border-bottom:1px solid #334155;cursor:pointer;white-space:nowrap}
    .mpx-corpo td{padding:6px 8px;border-bottom:1px solid #1e293b;vertical-align:top}
    .mpx-corpo tr.urg td{background:rgba(239,68,68,.14)}
    .mpx-corpo tr.blq td{background:rgba(148,163,184,.14)}
    .mpx-rodape{padding:8px 16px;border-top:1px solid #1e293b;color:#94a3b8;font-size:12px}
    `;

    let ordenacao = { coluna: 'horas', crescente: false };

    function abrirPainel() {
        const casos = extrair();
        const overlay = document.createElement('div');
        overlay.className = 'mpx-overlay';
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="mpx-painel">
                <div class="mpx-topo">
                    <h2>📋 Casos <span id="mpx-contagem"></span></h2>
                    <input id="mpx-busca" placeholder="filtrar…" size="16">
                    <button id="mpx-organizador" class="mpx-primario">➡️ Enviar ao Organizador</button>
                    <button id="mpx-copiar">Copiar p/ Excel</button>
                    <button id="mpx-csv">CSV</button>
                    <button id="mpx-json">JSON</button>
                    <button id="mpx-fechar">✕</button>
                </div>
                <div class="mpx-corpo" id="mpx-corpo"></div>
                <div class="mpx-rodape" id="mpx-rodape"></div>
            </div>`;
        document.body.appendChild(overlay);

        const corpo = overlay.querySelector('#mpx-corpo');
        const escapar = t => String(t == null ? '' : t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

        function renderizar(filtro) {
            let lista = casos;
            if (filtro) {
                const alvo = filtro.toLowerCase();
                lista = lista.filter(c => Object.values(c).join(' ').toLowerCase().includes(alvo));
            }
            lista = lista.slice().sort((a, b) => {
                const va = a[ordenacao.coluna], vb = b[ordenacao.coluna];
                const cmp = (typeof va === 'number' && typeof vb === 'number')
                    ? va - vb : String(va || '').localeCompare(String(vb || ''), 'pt-BR');
                return ordenacao.crescente ? cmp : -cmp;
            });

            corpo.innerHTML = '<table><thead><tr>' +
                COLUNAS.map(c => `<th data-col="${c}">${c}${ordenacao.coluna === c ? (ordenacao.crescente ? ' ▲' : ' ▼') : ''}</th>`).join('') +
                '</tr></thead><tbody>' +
                lista.map(caso => `<tr class="${caso.urgente ? 'urg' : caso.bloqueado ? 'blq' : ''}">` +
                    COLUNAS.map(c => `<td>${escapar(caso[c])}</td>`).join('') + '</tr>').join('') +
                '</tbody></table>';

            corpo.querySelectorAll('th').forEach(th => th.onclick = () => {
                const coluna = th.dataset.col;
                ordenacao = { coluna, crescente: ordenacao.coluna === coluna ? !ordenacao.crescente : true };
                renderizar(overlay.querySelector('#mpx-busca').value);
            });

            overlay.querySelector('#mpx-contagem').textContent = `(${lista.length}/${casos.length})`;
            overlay.querySelector('#mpx-rodape').textContent =
                `${casos.length} casos · ${casos.filter(c => c.urgente).length} urgentes · ` +
                `${casos.filter(c => c.bloqueado).length} bloqueados · ` +
                `mais antigo: ${Math.max(...casos.map(c => c.horas || 0))}h`;
        }

        const texto = separador => [COLUNAS.join(separador)].concat(casos.map(caso =>
            COLUNAS.map(c => {
                const v = String(caso[c] == null ? '' : caso[c]);
                return separador === ';' && /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
            }).join(separador))).join('\n');

        const copiar = (conteudo, botao) => {
            const antes = botao.textContent;
            navigator.clipboard.writeText(conteudo)
                .then(() => { botao.textContent = '✓ copiado'; })
                .catch(() => { botao.textContent = '✕ falhou'; });
            setTimeout(() => botao.textContent = antes, 1500);
        };

        overlay.querySelector('#mpx-fechar').onclick = () => overlay.remove();
        overlay.querySelector('#mpx-busca').oninput = e => renderizar(e.target.value);
        overlay.querySelector('#mpx-copiar').onclick = e => copiar(texto('\t'), e.target);
        overlay.querySelector('#mpx-json').onclick = e => copiar(JSON.stringify(casos, null, 2), e.target);
        // Envia a lista ao Organizador de Casos: abre o site com o JSON no hash,
        // onde ele compara por FAP e mostra novos / prazos / sobrando antes de gravar.
        overlay.querySelector('#mpx-organizador').onclick = e => {
            const payload = casos.map(caso => ({
                fap:   caso.fap,
                nome:  caso.nome,
                prazo: caso.prazo,
                horas: caso.horas,
            })).filter(caso => /^\d{12}$/.test(caso.fap || ''));

            if (!payload.length) {
                e.target.textContent = '✕ nenhum FAP válido';
                return;
            }

            const json = JSON.stringify(payload);
            const bytes = new TextEncoder().encode(json);
            let binario = '';
            bytes.forEach(b => { binario += String.fromCharCode(b); });
            const destino = URL_ORGANIZADOR + '#motion=' + encodeURIComponent(btoa(binario));

            // Cópia como plano B: se o pop-up for bloqueado, dá para colar
            // em "Importar → JSON do Motion".
            navigator.clipboard.writeText(json).catch(() => {});

            const aba = window.open(destino, '_blank');
            e.target.textContent = aba ? `✓ ${payload.length} enviados` : '✕ pop-up bloqueado (JSON copiado)';
        };

        overlay.querySelector('#mpx-csv').onclick = () => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob(['\ufeff' + texto(';')], { type: 'text/csv;charset=utf-8' }));
            link.download = 'pendencias.csv';
            link.click();
        };

        document.addEventListener('keydown', function fechar(e) {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', fechar); }
        });

        renderizar('');
    }

    /* ---------------------------------------------------------------- *
     * Botão — só existe enquanto houver casos na tela
     * ---------------------------------------------------------------- */

    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    // Idempotente: só toca no DOM quando a contagem muda de fato. Isso evita
    // qualquer risco de laço (a versão anterior usava MutationObserver sobre o
    // body e se auto-disparava ao criar/atualizar o próprio botão).
    let ultimoTotal = -1;

    function sincronizarBotao() {
        try {
            atualizarBotao();
        } catch (erro) {
            // Sem isto, um erro aqui mataria a sondagem em silêncio.
            console.error('[Extrator de Casos] falhou ao sincronizar:', erro);
        }
    }

    function atualizarBotao() {
        const total = linhasDeCasos().length;
        if (total === ultimoTotal) return;
        ultimoTotal = total;
        console.log('[Extrator de Casos] contagem mudou para', total);

        let botao = document.getElementById('mpx-btn');

        if (!total && !SEMPRE_VISIVEL) {
            if (botao) botao.remove();
            return;
        }
        if (!botao) {
            botao = document.createElement('button');
            botao.id = 'mpx-btn';
            botao.onclick = () => { if (linhasDeCasos().length) abrirPainel(); };
            document.body.appendChild(botao);
        }
        botao.classList.toggle('mpx-vazio', !total);
        botao.textContent = total
            ? `📋 Extrair ${total} caso${total > 1 ? 's' : ''}`
            : '📋 0 casos (aguardando filtro)';
    }

    // Atalho de depuração: window.__mpx.linhas() / .casos() no console.
    window.__mpx = {
        linhas: linhasDeCasos, casos: extrair, painel: abrirPainel,
        // __mpx.diag() no console: onde o script está achando (ou não) os casos.
        diag: () => documentos().map((doc, i) => ({
            doc: i === 0 ? 'principal' : 'frame ' + i,
            url: doc.location ? doc.location.href : '?',
            marcadores: doc.querySelectorAll('[data-pendencia]').length,
            linhas: doc.querySelectorAll('tr').length,
        })),
    };
    console.log('[Extrator de Casos] ativo —', linhasDeCasos().length, 'caso(s) detectado(s)');

    sincronizarBotao();
    // A grade muda por AJAX (filtro) e se recarrega sozinha a cada 60s.
    // Uma sondagem leve dá conta e, ao contrário do MutationObserver,
    // não corre risco de reagir às próprias alterações.
    setInterval(sincronizarBotao, 1500);
})();
