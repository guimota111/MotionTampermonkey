// ==UserScript==
// @name         Botão de liberação new
// @namespace    https://motionap.dasa.com.br/
// @version      1.0
// @description  Botão stealth para liberar com assinatura digital (Akamai safe). A lógica fica num motor genérico buscado ao vivo do GitHub — atualiza sozinha sem nunca sobrescrever a senha configurada aqui.
// @author       Guilherme
// @match        https://motionap.dasa.com.br/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      raw.githubusercontent.com
// ==/UserScript==
//
// NÃO tem @updateURL/@downloadURL de propósito: este arquivo é pessoal (leva a
// senha de assinatura de cada usuário). Se ele fosse auto-atualizado a partir
// de um arquivo genérico no GitHub, a atualização apagaria esse dado. Só o
// motor (motion-liberar-stealth-engine.js) é buscado do GitHub — e isso é
// feito ao vivo, a cada execução, pelo código abaixo.

(function() {
    'use strict';

    // ─── CONFIG (dado pessoal deste usuário) ──────────────────────────────────
    const CONFIG = {
        ASSINATURA_VALOR: 'INSERIR SENHA'
    };

    // ─── MOTOR (genérico, buscado ao vivo do GitHub) ──────────────────────────
    const ENGINE_URL = 'https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-liberar-stealth-engine.js';
    const CACHE_KEY = 'motionLiberarStealth:engineCache:v1';

    function executarMotor(codigoMotor) {
        try {
            const fabricar = new Function('CONFIG', 'GM_addStyle',
                codigoMotor + '\n;iniciarMotorLiberarStealth(CONFIG, GM_addStyle);');
            fabricar(CONFIG, GM_addStyle);
        } catch (e) {
            console.error('❌ Liberar Stealth: falha ao executar o motor buscado do GitHub', e);
        }
    }

    function usarCache(motivo) {
        const codigoCache = GM_getValue(CACHE_KEY, null);
        if (codigoCache) {
            console.warn('⚠️ Liberar Stealth: usando motor em cache (' + motivo + ')');
            executarMotor(codigoCache);
        } else {
            console.error('❌ Liberar Stealth: motor indisponível — sem internet e sem cache local (' + motivo + ')');
        }
    }

    GM_xmlhttpRequest({
        method: 'GET',
        url: ENGINE_URL,
        onload: function(res) {
            if (res.status >= 200 && res.status < 300 && res.responseText) {
                GM_setValue(CACHE_KEY, res.responseText);
                executarMotor(res.responseText);
            } else {
                usarCache('HTTP ' + res.status);
            }
        },
        onerror: function() {
            usarCache('erro de conexão');
        }
    });
})();
