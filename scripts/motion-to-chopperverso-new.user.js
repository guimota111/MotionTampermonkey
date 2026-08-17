// ==UserScript==
// @name         Motion To Chopperverso new
// @namespace    https://motionap.dasa.com.br/
// @version      1.0
// @description  Coleta FAP, Lâminas, Pontos e Tipo(s) e envia ao Chopperverso. A lógica fica num motor genérico buscado ao vivo do GitHub — atualiza sozinha sem nunca sobrescrever o endpoint/senha/tipos configurados aqui.
// @author       Guilherme
// @match        https://motionap.dasa.com.br/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      raw.githubusercontent.com
// ==/UserScript==
//
// NÃO tem @updateURL/@downloadURL de propósito: este arquivo é pessoal (leva o
// endpoint, a senha e os tipos de cada usuário). Se ele fosse auto-atualizado
// a partir de um arquivo genérico no GitHub, a atualização apagaria esses
// dados. Só o motor (motion-chopperverso-engine.js) é buscado do GitHub — e
// isso é feito ao vivo, a cada execução, pelo código abaixo.

(function() {
    'use strict';

    // ─── CONFIG (dados pessoais deste usuário) ────────────────────────────────
    const CONFIG = {
        ENDPOINT: 'INSERIR ENDPOINT GERADO NO CHOPPER',
        ASSINATURA_VALOR: 'INSERIR SENHA',
        TIPOS_DISPONIVEIS: [
            // { id: 'AP',  label: 'Anátomo Patológico' },
            // { id: 'HEAP', label: 'Heap' },
            // INSERIR TITULOS DISPONIVEIS
        ]
    };

    // ─── MOTOR (genérico, buscado ao vivo do GitHub) ──────────────────────────
    const ENGINE_URL = 'https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-chopperverso-engine.js';
    const CACHE_KEY = 'motionChopperverso:engineCache:v1';

    function executarMotor(codigoMotor) {
        try {
            const fabricar = new Function('CONFIG', 'GM_addStyle', 'GM_xmlhttpRequest',
                codigoMotor + '\n;iniciarMotorChopperverso(CONFIG, GM_addStyle, GM_xmlhttpRequest);');
            fabricar(CONFIG, GM_addStyle, GM_xmlhttpRequest);
        } catch (e) {
            console.error('❌ Motion To Chopperverso: falha ao executar o motor buscado do GitHub', e);
        }
    }

    function usarCache(motivo) {
        const codigoCache = GM_getValue(CACHE_KEY, null);
        if (codigoCache) {
            console.warn('⚠️ Motion To Chopperverso: usando motor em cache (' + motivo + ')');
            executarMotor(codigoCache);
        } else {
            console.error('❌ Motion To Chopperverso: motor indisponível — sem internet e sem cache local (' + motivo + ')');
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
