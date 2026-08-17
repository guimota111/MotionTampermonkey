/* Motion To Chopperverso — Motor
 * ─────────────────────────────────────────────────────────────────────────
 * Este arquivo NÃO tem dado de usuário nenhum (sem endpoint, sem senha, sem
 * tipos). Ele é buscado ao vivo (via GM_xmlhttpRequest) pelo script instalado
 * no Tampermonkey de cada usuário ("loader"), que só guarda a config pessoal
 * e passa pra cá na hora de iniciar. Assim dá pra evoluir a lógica aqui sem
 * nunca sobrescrever a config de ninguém.
 *
 * Baseado no Motion To Chopperverso v4.1.
 * Repo: https://github.com/guimota111/MotionTampermonkey
 */

function iniciarMotorChopperverso(overrides, GM_addStyle, GM_xmlhttpRequest) {
    'use strict';

    const CONFIG = Object.assign({
        TRIGGER_SELECTOR: 'td.col-acao.acao-liberacao .seletor-grupo',
        IMAGE_URL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgorx3-2eibte_3wtdj02EpP7-TD3T1kHpcCCdeyJgX2kkD-WBmX4iXyya&s=10',
        FALLBACK_EMOJI: '🔬',

        // ENDPOINT E AUTENTICAÇÃO (vem do loader)
        ENDPOINT: null,
        API_TOKEN: null,
        CUSTOM_HEADERS: {},

        // Códigos usados para localizar Lâminas/Pontos automaticamente na página.
        // São testados EM ORDEM — usa o primeiro que existir no caso.
        // Casos de IHQ trazem os valores em NAAPIM (lâminas) e SCOREAPIM (pontos);
        // os demais casos usam BLOCO (lâminas) e SCORE/SCOREPP (pontos).
        LABELS_LAMINAS: ['NAAPIM', 'BLOCO'],
        LABELS_PONTOS: ['SCOREAPIM', 'SCORE', 'SCOREPP'],
        LABEL_HEAP: 'HEAP',

        // Lista de tipos disponíveis (vem do loader).
        // Formato: { id: 'CODIGO', label: 'Texto exibido' }
        TIPOS_DISPONIVEIS: [],

        // ─── LIBERAÇÃO (usado pelo botão "Enviar e liberar") ──────────────────────
        SELETOR_TD: 'td.col-acao.acao-liberacao',
        SELETOR_DIV_LIBERACAO: 'div.seletor-grupo',
        INPUT_ASSINATURA: 'input.assinaturaDigital',
        ASSINATURA_VALOR: null,      // senha de assinatura digital (vem do loader)
        BUTTON_CONFIRMAR: 'div.button-content',
        TEXTO_CONFIRMAR: 'Confirmar',

        // ─── SEGUNDA ASSINATURA ───────────────────────────────────────────────────
        // Mostra um checkbox no modal. Quando marcado, envia este campo no JSON.
        MOSTRAR_SEGUNDA_ASSINATURA: true,
        CAMPO_SEGUNDA_ASSINATURA: 'segundaAssinatura'
    }, overrides);

    console.log('✅ Motor Motion To Chopperverso iniciado');

    // ─── STEALTH: atrasos aleatórios (evita padrão robótico p/ Akamai) ───────────
    function delayAleatorio(min = 200, max = 800) {
        return Math.random() * (max - min) + min;
    }

    // ─── ESTILOS ────────────────────────────────────────────────────────────────
    GM_addStyle(`
        /* Botão flutuante */
        #motion-laminas-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            z-index: 99998;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: all 0.3s ease;
            display: none;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: #4CAF50;
        }
        #motion-laminas-btn:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); }
        #motion-laminas-btn:active { transform: scale(0.95); }
        #motion-laminas-btn.fallback { font-size: 24px; color: white; font-weight: bold; }

        /* Modal */
        #motion-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); display: none; z-index: 99999;
            align-items: center; justify-content: center;
        }
        #motion-modal-overlay.active { display: flex; }
        #motion-modal {
            background: white; border-radius: 12px; padding: 24px; width: 92%; max-width: 680px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideUp 0.3s ease; max-height: 85vh; overflow-y: auto;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        #motion-modal h2 { margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; font-weight: 600; }

        .motion-form-group { margin-bottom: 16px; }
        .motion-form-row { display: flex; gap: 16px; }
        .motion-form-row .motion-form-group { flex: 1; }
        .motion-form-group label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .motion-form-group input[type="number"] {
            width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px;
            font-size: 13px; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s;
        }
        .motion-form-group input[type="number"]:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1); }
        .motion-form-group input[type="number"]::placeholder { color: #999; }
        .motion-form-group input.motion-auto-preenchido { border-color: #4CAF50; background: #f4fbf4; }
        .motion-auto-tag { font-size: 10px; color: #4CAF50; font-weight: 600; margin-left: 6px; }
        .motion-fap-display { background: #f5f5f5; padding: 10px 12px; border-radius: 6px; font-size: 13px; color: #333; font-weight: 500; border: 1px solid #e0e0e0; }

        /* Checkboxes de tipos - GRID de 2 colunas */
        .motion-checkbox-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .motion-checkbox-item {
            display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px;
            border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s;
        }
        .motion-checkbox-item:hover { background: #f5f5f5; border-color: #4CAF50; }
        .motion-checkbox-item input[type="checkbox"] { cursor: pointer; width: 18px; height: 18px; accent-color: #4CAF50; flex-shrink: 0; }
        .motion-checkbox-item label { margin: 0; flex: 1; cursor: pointer; font-weight: 500; color: #333; font-size: 12.5px; }
        .motion-checkbox-item input[type="checkbox"]:checked ~ label { color: #4CAF50; font-weight: 600; }
        .motion-tipos-count { font-size: 11px; color: #999; margin-top: 4px; }

        /* Segunda assinatura (destaque azul) */
        .motion-segunda-item { border-color: #cfe0ff; background: #f5f9ff; }
        .motion-segunda-item:hover { border-color: #2f7bff; background: #eef4ff; }
        .motion-segunda-item input[type="checkbox"] { accent-color: #2f7bff; }
        .motion-segunda-item input[type="checkbox"]:checked ~ label { color: #2f7bff; }

        .motion-modal-buttons { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
        .motion-modal-buttons button { flex: 1; min-width: 130px; padding: 10px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        #motion-btn-submit { background: #4CAF50; color: white; }
        #motion-btn-submit:hover { background: #45a049; }
        #motion-btn-submit:disabled { background: #ccc; cursor: not-allowed; }
        #motion-btn-submit-liberar { background: #2f7bff; color: white; }
        #motion-btn-submit-liberar:hover { background: #2668db; }
        #motion-btn-submit-liberar:disabled { background: #ccc; cursor: not-allowed; }
        #motion-btn-cancel { background: #f0f0f0; color: #333; }
        #motion-btn-cancel:hover { background: #e0e0e0; }
    `);

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    function temElementoGatilho() {
        return document.querySelector(CONFIG.TRIGGER_SELECTOR) !== null;
    }

    function extrairFAP() {
        const tdRequisicao = document.querySelector('td.col-requisicao');
        if (!tdRequisicao) return null;
        const texto = tdRequisicao.textContent.trim();
        const match = texto.match(/(\d{4}\.\d{4}\.\d{4})/);
        return match ? match[1] : null;
    }

    function extrairValorPorLabel(labelTexto) {
        const headers = document.querySelectorAll('p.teste-codigo-alfa.info-destaque');
        for (const header of headers) {
            if (header.textContent.trim().toUpperCase() === labelTexto.toUpperCase()) {
                let container = header.parentElement;
                let nivel = 0;
                while (container && nivel < 5) {
                    const valor = container.querySelector('span.info-destaque.correcao-resultado-texto');
                    if (valor) {
                        const texto = valor.textContent.trim();
                        const numero = texto.match(/\d+/);
                        return numero ? numero[0] : texto;
                    }
                    container = container.parentElement;
                    nivel++;
                }
            }
        }
        return null;
    }

    // Tenta uma lista de códigos em ordem e retorna o valor do primeiro encontrado
    function extrairPrimeiroValor(labels) {
        for (const label of labels) {
            const valor = extrairValorPorLabel(label);
            if (valor !== null) {
                console.log(`✓ Valor obtido de "${label}": ${valor}`);
                return { valor, label };
            }
        }
        return { valor: null, label: null };
    }

    function extrairPontos() {
        return extrairPrimeiroValor(CONFIG.LABELS_PONTOS).valor;
    }

    function existeCampoHEAP() {
        const headers = document.querySelectorAll('p.teste-codigo-alfa.info-destaque');
        for (const header of headers) {
            if (header.textContent.trim().toUpperCase() === CONFIG.LABEL_HEAP.toUpperCase()) return true;
        }
        return false;
    }

    function extrairLaminas() {
        const base = extrairPrimeiroValor(CONFIG.LABELS_LAMINAS).valor;
        if (base === null) return { valor: null, ajustadoPorHeap: false };
        const temHeap = existeCampoHEAP();
        const numeroBase = parseInt(base, 10);
        if (isNaN(numeroBase)) return { valor: base, ajustadoPorHeap: false };
        if (temHeap) return { valor: String(numeroBase + 1), ajustadoPorHeap: true };
        return { valor: String(numeroBase), ajustadoPorHeap: false };
    }

    function configurarImagemBotao(btn) {
        const img = new Image();
        img.onload = () => {
            btn.style.backgroundImage = `url('${CONFIG.IMAGE_URL}')`;
            btn.classList.remove('fallback');
            console.log('✅ Imagem carregada');
        };
        img.onerror = () => {
            console.warn('⚠️ Imagem bloqueada, usando emoji');
            btn.innerHTML = CONFIG.FALLBACK_EMOJI;
            btn.classList.add('fallback');
        };
        img.src = CONFIG.IMAGE_URL;
    }

    // ─── CRIAR MODAL ─────────────────────────────────────────────────────────────
    function criarModal() {
        const overlay = document.createElement('div');
        overlay.id = 'motion-modal-overlay';

        const modal = document.createElement('div');
        modal.id = 'motion-modal';

        const fap = extrairFAP();
        const laminasInfo = extrairLaminas();
        const laminasAuto = laminasInfo.valor;
        const laminasAjustadoPorHeap = laminasInfo.ajustadoPorHeap;
        const pontosAuto = extrairPontos();

        // Checkboxes de tipos
        let tiposHtml = '<div class="motion-checkbox-group">';
        CONFIG.TIPOS_DISPONIVEIS.forEach(tipo => {
            tiposHtml += `
                <div class="motion-checkbox-item">
                    <input type="checkbox" id="tipo_${tipo.id}" value="${tipo.id}" class="motion-tipo-checkbox" />
                    <label for="tipo_${tipo.id}">${tipo.label}</label>
                </div>`;
        });
        tiposHtml += '</div>';
        tiposHtml += '<div class="motion-tipos-count"><span id="motion-tipos-count">0 selecionado(s)</span></div>';

        // Bloco opcional de "Segunda assinatura"
        const segundaHtml = CONFIG.MOSTRAR_SEGUNDA_ASSINATURA ? `
            <div class="motion-form-group">
                <div class="motion-checkbox-item motion-segunda-item">
                    <input type="checkbox" id="motion-segunda-assinatura" />
                    <label for="motion-segunda-assinatura">Segunda assinatura</label>
                </div>
            </div>` : '';

        modal.innerHTML = `
            <h2>📋 Dados de Lâmina</h2>

            <div class="motion-form-group">
                <label>FAP (Requisição)</label>
                <div class="motion-fap-display" id="motion-fap-display">${fap ? fap : '⚠️ FAP não encontrado'}</div>
            </div>

            <div class="motion-form-row">
                <div class="motion-form-group">
                    <label for="motion-laminas">Número de Lâminas *${laminasAuto ? `<span class="motion-auto-tag">auto${laminasAjustadoPorHeap ? ' +1 HEAP' : ''}</span>` : ''}</label>
                    <input type="number" id="motion-laminas" placeholder="Ex: 5" min="1" step="1" required
                        value="${laminasAuto ? laminasAuto : ''}" class="${laminasAuto ? 'motion-auto-preenchido' : ''}" ${laminasAuto ? '' : 'autofocus'} />
                </div>
                <div class="motion-form-group">
                    <label for="motion-pontos">Número de Pontos *${pontosAuto ? '<span class="motion-auto-tag">auto</span>' : ''}</label>
                    <input type="number" id="motion-pontos" placeholder="Ex: 150" min="0" step="1" required
                        value="${pontosAuto ? pontosAuto : ''}" class="${pontosAuto ? 'motion-auto-preenchido' : ''}" />
                </div>
            </div>

            <div class="motion-form-group">
                <label>Tipo de Biópsia(s) *</label>
                ${tiposHtml}
            </div>

            ${segundaHtml}

            <div class="motion-modal-buttons">
                <button id="motion-btn-submit" type="button">✅ Enviar</button>
                <button id="motion-btn-submit-liberar" type="button">🚀 Enviar e liberar</button>
                <button id="motion-btn-cancel" type="button">❌ Cancelar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // ─── EVENTOS ─────────────────────────────────────────────────────────────
        ['motion-laminas', 'motion-pontos'].forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', () => {
                input.classList.remove('motion-auto-preenchido');
                const label = input.closest('.motion-form-group').querySelector('label');
                const tag = label ? label.querySelector('.motion-auto-tag') : null;
                if (tag) tag.remove();
            });
        });

        // Clicar em qualquer parte do box ativa o checkbox de tipo
        document.querySelectorAll('.motion-checkbox-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });

        // Contador de tipos selecionados
        document.querySelectorAll('.motion-tipo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selecionados = document.querySelectorAll('.motion-tipo-checkbox:checked').length;
                document.getElementById('motion-tipos-count').textContent =
                    `${selecionados} selecionado${selecionados !== 1 ? '(s)' : ''}`;
            });
        });

        document.getElementById('motion-btn-cancel').addEventListener('click', () => overlay.remove());
        document.getElementById('motion-btn-submit').addEventListener('click', () => submeterDados(fap, overlay, false));
        document.getElementById('motion-btn-submit-liberar').addEventListener('click', () => submeterDados(fap, overlay, true));

        setTimeout(() => overlay.classList.add('active'), 50);
    }

    // ─── ENVIAR DADOS (e opcionalmente liberar) ───────────────────────────────────
    function submeterDados(fap, overlay, liberarDepois) {
        const laminas = document.getElementById('motion-laminas').value;
        const pontos = document.getElementById('motion-pontos').value;

        const tiposSelecionados = Array.from(document.querySelectorAll('.motion-tipo-checkbox:checked'))
            .map(checkbox => checkbox.value);

        if (!laminas || !pontos || tiposSelecionados.length === 0) {
            alert('⚠️ Preencha todos os campos obrigatórios!');
            return;
        }
        if (!fap) {
            alert('⚠️ FAP não foi encontrado na página!');
            return;
        }

        const dados = {
            fap: fap,
            laminas: parseInt(laminas),
            pontos: parseInt(pontos),
            tipo: tiposSelecionados,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        // Segunda assinatura (opcional)
        if (CONFIG.MOSTRAR_SEGUNDA_ASSINATURA) {
            const chk = document.getElementById('motion-segunda-assinatura');
            dados[CONFIG.CAMPO_SEGUNDA_ASSINATURA] = !!(chk && chk.checked);
        }

        console.log('📤 Enviando JSON:', dados);
        console.log('%c✅ JSON COLETADO:', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.table(dados);
        console.log(JSON.stringify(dados, null, 2));

        navigator.clipboard.writeText(JSON.stringify(dados, null, 2))
            .then(() => console.log('✅ JSON copiado para clipboard!'))
            .catch(err => console.warn('⚠️ Clipboard indisponível:', err));

        // Fecha o modal imediatamente
        overlay.remove();

        if (!CONFIG.ENDPOINT) {
            console.error('❌ Motion To Chopperverso: ENDPOINT não configurado no loader instalado.');
            return;
        }

        // Envia em background (sem esperar resposta)
        const headers = { 'Content-Type': 'application/json', ...CONFIG.CUSTOM_HEADERS };
        if (CONFIG.API_TOKEN) headers['Authorization'] = `Bearer ${CONFIG.API_TOKEN}`;

        console.log('📡 Enviando para:', CONFIG.ENDPOINT);
        GM_xmlhttpRequest({
            method: 'POST',
            url: CONFIG.ENDPOINT,
            headers: headers,
            data: JSON.stringify(dados),
            onload: function(response) {
                console.log('📨 Status:', response.status);
                if (response.status >= 200 && response.status < 300) {
                    console.log('%c✅ Dados enviados com sucesso!', 'color: #4CAF50; font-weight: bold;');
                } else {
                    console.error('❌ Erro HTTP:', response.status);
                    console.error('❌ Response:', response.responseText.substring(0, 300));
                }
            },
            onerror: function(err) { console.error('❌ Erro de conexão:', err); }
        });

        // Se pediu "Enviar e liberar", dispara a liberação após um atraso humano
        if (liberarDepois) {
            setTimeout(() => fluxoLiberacao(), delayAleatorio(600, 1200));
        }
    }

    // ─── FLUXO DE LIBERAÇÃO (stealth — do "Liberar Stealth") ──────────────────────
    function fluxoLiberacao() {
        console.log('🔄 Iniciando liberação...');

        if (!CONFIG.ASSINATURA_VALOR) {
            console.error('❌ Motion To Chopperverso: ASSINATURA_VALOR não configurado no loader instalado.');
            return;
        }

        // PASSO 1: clicar no div.seletor-grupo
        setTimeout(() => {
            const td = document.querySelector(CONFIG.SELETOR_TD);
            const divLiberacao = td ? td.querySelector(CONFIG.SELETOR_DIV_LIBERACAO) : null;
            if (!divLiberacao) {
                console.error('❌ Div de liberação não encontrada');
                return;
            }
            console.log('✓ Clicando no seletor-grupo');
            divLiberacao.click();

            // PASSO 2: preencher assinatura
            setTimeout(() => {
                const inputAssinatura = document.querySelector(CONFIG.INPUT_ASSINATURA);
                if (!inputAssinatura) {
                    console.error('❌ Input de assinatura não encontrado');
                    return;
                }
                console.log('✓ Preenchendo assinatura digital');
                inputAssinatura.removeAttribute('readonly');
                inputAssinatura.value = CONFIG.ASSINATURA_VALOR;
                inputAssinatura.dispatchEvent(new Event('input', { bubbles: true }));
                inputAssinatura.dispatchEvent(new Event('change', { bubbles: true }));
                inputAssinatura.dispatchEvent(new Event('blur', { bubbles: true }));
                setTimeout(() => inputAssinatura.setAttribute('readonly', 'readonly'), 100);

                // PASSO 3: clicar em Confirmar
                setTimeout(() => {
                    const btnConfirmar = Array.from(document.querySelectorAll(CONFIG.BUTTON_CONFIRMAR))
                        .find(btn => btn.textContent.trim() === CONFIG.TEXTO_CONFIRMAR);
                    if (!btnConfirmar) {
                        console.error('❌ Botão Confirmar não encontrado');
                        return;
                    }
                    console.log('✓ Clicando em Confirmar');
                    btnConfirmar.click();
                    console.log('✅ Liberação concluída');
                }, delayAleatorio(300, 600));

            }, delayAleatorio(400, 800));

        }, delayAleatorio(200, 400));
    }

    // ─── CRIAR E MONITORAR BOTÃO ─────────────────────────────────────────────────
    function criarBotao() {
        if (document.getElementById('motion-laminas-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'motion-laminas-btn';
        btn.title = 'Coletar dados de lâmina';
        configurarImagemBotao(btn);
        btn.addEventListener('click', criarModal);
        document.body.appendChild(btn);
        console.log('✅ Botão criado');
    }

    function monitorarPagina() {
        const btnExistente = document.getElementById('motion-laminas-btn');
        if (temElementoGatilho()) {
            if (!btnExistente) criarBotao();
            else btnExistente.style.display = 'block';
        } else if (btnExistente) {
            btnExistente.style.display = 'none';
        }
    }

    monitorarPagina();

    const observer = new MutationObserver(() => monitorarPagina());
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Motor Motion To Chopperverso pronto (Enviar / Enviar e liberar + segunda assinatura + IHQ)');
}
