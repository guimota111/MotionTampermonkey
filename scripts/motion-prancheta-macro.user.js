// ==UserScript==
// @name         Motion DASA - Copiar Títulos de Macro
// @namespace    https://motionap.dasa.com.br/
// @version      1.1
// @description  Ícone de prancheta que copia os títulos das topografias da macro para a área de transferência
// @author       Guilherme
// @match        https://motionap.dasa.com.br/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-prancheta-macro.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-prancheta-macro.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('✅ Copiar Títulos de Macro Iniciado');

    // ─── CONFIG ──────────────────────────────────────────────────────────────────
    const CONFIG = {
        RMACRO_SELECTOR: 'div.tituloTesteNome',
        RMACRO_TEXT: 'RMACRO',
        TEXTAREA_SELECTOR: 'textarea.areaResultadoOriginalText'
    };

    // ─── ESTILOS ────────────────────────────────────────────────────────────────
    GM_addStyle(`
        #motion-copy-btn {
            display: inline-block;
            margin-left: 5px;
            margin-top: 0;
            margin-bottom: 0;
            padding: 0;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            vertical-align: text-top;
            transition: all 0.2s;
            white-space: nowrap;
        }

        #motion-copy-btn:hover {
            transform: scale(1.2);
        }

        #motion-copy-btn:active {
            transform: scale(0.95);
        }
    `);

    // ─── HELPERS ─────────────────────────────────────────────────────────────────
    function temRMACRO() {
        const elementos = document.querySelectorAll(CONFIG.RMACRO_SELECTOR);
        return Array.from(elementos).some(el => el.textContent.trim() === CONFIG.RMACRO_TEXT);
    }

    function encontrarTextarea() {
        return document.querySelector(CONFIG.TEXTAREA_SELECTOR);
    }

    function encontrarRMACROElement() {
        const elementos = document.querySelectorAll(CONFIG.RMACRO_SELECTOR);
        return Array.from(elementos).find(el => el.textContent.trim() === CONFIG.RMACRO_TEXT);
    }

    // ─── FRASES DE ABERTURA (NÃO SÃO TÍTULOS) ────────────────────────────────────
    // A macro costuma começar com uma frase de apresentação do material, que
    // também termina em ":" — ex.: "Recebido para exame dois frascos, com o
    // material a seguir:". Ela é frequente, mas nem sempre está presente, então
    // é reconhecida por padrão e descartada em vez de ser pulada por posição.
    const PADROES_INTRODUCAO = [
        /^recebid[oa]s?\b/i,
        /^recebe(?:mos|-se)\b/i,
        /^(?:foi|foram)\s+recebid[oa]s?\b/i,
        /^(?:enviad|encaminhad|remetid)[oa]s?\b/i,
        /^(?:chega|chegam|chegaram)\b/i,
        /^trata-se\b/i,
        /^o\s+material\b/i,
        /\bpara\s+exame\b/i,
        /\bfrascos?\b/i,
        /\brecipientes?\b/i,
        /(?:a\s+seguir|abaixo|discriminad[oa]s?|relacionad[oa]s?|seguintes?|identificad[oa]s?\s+como)\s*:\s*$/i
    ];

    function ehFraseIntroducao(linha) {
        return PADROES_INTRODUCAO.some((padrao) => padrao.test(linha));
    }

    // ─── EXTRAIR TÍTULOS ─────────────────────────────────────────────────────────
    function extrairTitulos(texto) {
        const linhas = String(texto || '')
            .split('\n')
            .map((linha) => linha.trim())
            .filter(Boolean);

        // 1ª passada — títulos por frasco: "A) Mama direita:", "AB) Linfonodo:".
        // Quando existem, a frase de abertura nunca é um título.
        const titulos = [];
        linhas.forEach((linha) => {
            const match = linha.match(/^[A-Z]+\)[^:]*:/);
            if (match) titulos.push(match[0]);
        });
        if (titulos.length > 0) return titulos;

        // 2ª passada — macro de frasco único, sem letra: o título é a primeira
        // linha terminada em ":" que não seja frase de abertura.
        for (const linha of linhas) {
            if (ehFraseIntroducao(linha)) continue;
            const match = linha.match(/^[A-ZÀ-Ý][^:]*:/);
            if (match) return [match[0]];
        }

        return [];
    }

    // ─── COPIAR TÍTULOS ──────────────────────────────────────────────────────────
    function copiarTitulos() {
        const textarea = encontrarTextarea();
        if (!textarea) {
            console.warn('⚠️ Textarea não encontrado');
            return;
        }

        const texto = textarea.value;
        const titulos = extrairTitulos(texto);

        if (titulos.length === 0) {
            console.warn('⚠️ Nenhum título encontrado');
            alert('⚠️ Nenhum título encontrado na macro');
            return;
        }

        const textoBotao = titulos.join('\n');

        navigator.clipboard.writeText(textoBotao).then(() => {
            console.log('✅ Títulos copiados para clipboard:');
            console.log(textoBotao);
        }).catch(err => {
            console.error('❌ Erro ao copiar:', err);
            alert('❌ Erro ao copiar para clipboard');
        });
    }

    // ─── CRIAR BOTÃO ─────────────────────────────────────────────────────────────
    function criarBotao() {
        const rmacroEl = encontrarRMACROElement();
        if (!rmacroEl) return;

        // Verificar se já existe
        if (document.getElementById('motion-copy-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'motion-copy-btn';
        btn.textContent = '📋';
        btn.type = 'button';
        btn.title = 'Copiar títulos da macro';

        btn.addEventListener('click', copiarTitulos);

        rmacroEl.parentNode.insertBefore(btn, rmacroEl.nextSibling);

        console.log('✅ Botão COPIAR TÍTULOS criado');
    }

    // ─── MONITORAR ───────────────────────────────────────────────────────────────
    function monitorar() {
        if (temRMACRO()) {
            criarBotao();
        }
    }

    monitorar();

    // Observer para mudanças dinâmicas
    const observer = new MutationObserver(monitorar);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Script pronto - Botão copia títulos da macro');
})();
