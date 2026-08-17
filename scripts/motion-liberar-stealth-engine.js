/* Motion DASA - Liberar Stealth — Motor
 * ─────────────────────────────────────────────────────────────────────────
 * Este arquivo NÃO tem dado de usuário nenhum (sem senha). Ele é buscado ao
 * vivo (via GM_xmlhttpRequest) pelo script instalado no Tampermonkey de cada
 * usuário ("loader"), que só guarda a senha de assinatura e passa pra cá na
 * hora de iniciar. Assim dá pra evoluir a lógica aqui sem nunca sobrescrever
 * a senha de ninguém.
 *
 * Repo: https://github.com/guimota111/MotionTampermonkey
 */

function iniciarMotorLiberarStealth(overrides, GM_addStyle) {
    'use strict';

    const CONFIG = Object.assign({
        SELETOR_TD: 'td.col-acao.acao-liberacao',
        SELETOR_DIV_LIBERACAO: 'div.seletor-grupo',
        INPUT_ASSINATURA: 'input.assinaturaDigital',
        ASSINATURA_VALOR: null,      // senha de assinatura digital (vem do loader)
        BUTTON_CONFIRMAR: 'div.button-content'
    }, overrides);

    console.log('✅ Motor Liberar Stealth iniciado');

    // ─── HELPER: Delays aleatórios stealth ────────────────────────────────────
    function delayAleatorio(min = 200, max = 800) {
        return Math.random() * (max - min) + min;
    }

    // ─── ESTILOS ────────────────────────────────────────────────────────────────
    GM_addStyle(`
        #motion-liberar-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 14px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            z-index: 99998;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: all 0.2s;
        }

        #motion-liberar-btn:hover {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        #motion-liberar-btn:active {
            transform: translateY(0);
        }

        #motion-liberar-btn.loading {
            background: #FFC107;
            cursor: not-allowed;
        }

        #motion-liberar-btn.loading::after {
            content: ' ⏳';
        }
    `);

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    function temLiberacao() {
        return document.querySelector(CONFIG.SELETOR_TD) !== null;
    }

    function encontrarDivLiberacao() {
        const td = document.querySelector(CONFIG.SELETOR_TD);
        if (!td) return null;
        return td.querySelector(CONFIG.SELETOR_DIV_LIBERACAO);
    }

    function encontrarInputAssinatura() {
        return document.querySelector(CONFIG.INPUT_ASSINATURA);
    }

    function encontrarBotaoConfirmar() {
        const botoes = document.querySelectorAll(CONFIG.BUTTON_CONFIRMAR);
        return Array.from(botoes).find(btn =>
            btn.textContent.trim() === 'Confirmar'
        );
    }

    // ─── PROCESSO DE LIBERAÇÃO ───────────────────────────────────────────────────
    function processoLiberacao() {
        const btn = document.getElementById('motion-liberar-btn');

        if (!CONFIG.ASSINATURA_VALOR) {
            console.error('❌ Liberar Stealth: ASSINATURA_VALOR não configurado no loader instalado.');
            return;
        }

        btn.classList.add('loading');
        btn.disabled = true;

        console.log('🔄 Iniciando processo de liberação...');

        // PASSO 1: Clicar no div.seletor-grupo
        setTimeout(() => {
            const divLiberacao = encontrarDivLiberacao();
            if (!divLiberacao) {
                console.error('❌ Div de liberação não encontrada');
                resetarBotao();
                return;
            }

            console.log('✓ Clicando no seletor-grupo');
            divLiberacao.click();

            // PASSO 2: Preencher assinatura (com delay)
            setTimeout(() => {
                const inputAssinatura = encontrarInputAssinatura();
                if (!inputAssinatura) {
                    console.error('❌ Input de assinatura não encontrado');
                    resetarBotao();
                    return;
                }

                console.log('✓ Preenchendo assinatura digital');

                inputAssinatura.removeAttribute('readonly');
                inputAssinatura.value = CONFIG.ASSINATURA_VALOR;

                inputAssinatura.dispatchEvent(new Event('input', { bubbles: true }));
                inputAssinatura.dispatchEvent(new Event('change', { bubbles: true }));
                inputAssinatura.dispatchEvent(new Event('blur', { bubbles: true }));

                setTimeout(() => {
                    inputAssinatura.setAttribute('readonly', 'readonly');
                }, 100);

                // PASSO 3: Clicar no Confirmar (com delay)
                setTimeout(() => {
                    const btnConfirmar = encontrarBotaoConfirmar();
                    if (!btnConfirmar) {
                        console.error('❌ Botão Confirmar não encontrado');
                        resetarBotao();
                        return;
                    }

                    console.log('✓ Clicando em Confirmar');
                    btnConfirmar.click();

                    setTimeout(() => {
                        console.log('✅ Processo de liberação concluído');
                        resetarBotao();
                    }, delayAleatorio(500, 1000));

                }, delayAleatorio(300, 600));

            }, delayAleatorio(400, 800));

        }, delayAleatorio(200, 400));
    }

    // ─── RESETAR BOTÃO ───────────────────────────────────────────────────────────
    function resetarBotao() {
        const btn = document.getElementById('motion-liberar-btn');
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // ─── CRIAR BOTÃO ─────────────────────────────────────────────────────────────
    function criarBotao() {
        if (document.getElementById('motion-liberar-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'motion-liberar-btn';
        btn.textContent = '✅ LIBERAR';
        btn.type = 'button';

        btn.addEventListener('click', processoLiberacao);

        document.body.appendChild(btn);
        console.log('✅ Botão LIBERAR criado');
    }

    // ─── MONITORAR ───────────────────────────────────────────────────────────────
    function monitorar() {
        const btn = document.getElementById('motion-liberar-btn');
        const temLiberacaoAgora = temLiberacao();

        if (temLiberacaoAgora) {
            if (!btn) {
                criarBotao();
            } else {
                btn.style.display = 'block';
                resetarBotao();
            }
        } else {
            if (btn) {
                btn.style.display = 'none';
            }
        }
    }

    monitorar();

    const observer = new MutationObserver(() => {
        monitorar();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    console.log('✅ Motor Liberar Stealth pronto');
}
