// ==UserScript==
// @name         Motion DASA - Extrator de Links de Lâminas (Por Host + Counter)
// @namespace    http://tampermonkey.net/
// @version      3.3.1
// @description  Uma URL por host + contador de lâminas + data mais recente em destaque + fecha popup ao clicar
// @author       Guilherme
// @match        https://motionap.dasa.com.br/PopupImagens*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dasa.com.br
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-extrator-links-laminas.user.js
// @downloadURL  https://raw.githubusercontent.com/guimota111/MotionTampermonkey/main/scripts/motion-extrator-links-laminas.user.js
// ==/UserScript==
(function() {
    'use strict';

    console.log('✅ Script de Extração de Lâminas (Com Contador + Data Recente) Iniciado');

    // Aguardar o DOM e o React renderizar
    setTimeout(() => {
        try {
            // 1. Encontrar componente React
            const component = document.querySelector('velab-react-popup-imagem');
            if (!component) {
                console.log('❌ Componente React não encontrado');
                return;
            }

            // 2. Extrair JSON base64
            const jsonBase64 = component.getAttribute('imagenspopup');
            if (!jsonBase64) {
                console.log('❌ Atributo imagenspopup não encontrado');
                return;
            }

            // 3. Decodificar base64
            const jsonString = atob(jsonBase64);
            const data = JSON.parse(jsonString);

            // 4. Extrair URLs, contar por host e agrupar
            const urlsByHost = new Map(); // host -> {url, info, count, latestDate}
            const countByHost = new Map(); // host -> contagem

            if (data.imagens && Array.isArray(data.imagens)) {
                // Primeira passagem: contar URLs por host
                data.imagens.forEach((img) => {
                    if (img.tipo?.value === 'URL' && img.url) {
                        try {
                            const urlObj = new URL(img.url);
                            const host = urlObj.hostname;
                            countByHost.set(host, (countByHost.get(host) || 0) + 1);
                        } catch (e) {
                            // ignorar URLs inválidas
                        }
                    }
                });

                // Segunda passagem: manter primeira URL de cada host + DATA MAIS RECENTE
                data.imagens.forEach((img, imgIndex) => {
                    if (img.tipo?.value === 'URL' && img.url) {
                        try {
                            const urlObj = new URL(img.url);
                            const host = urlObj.hostname;

                            // Manter apenas a PRIMEIRA URL de cada host
                            if (!urlsByHost.has(host)) {
                                console.log(`📍 [${host}] Primeira imagem #${imgIndex}: data = "${img.data}"`);
                                urlsByHost.set(host, {
                                    url: img.url,
                                    id: img.id,
                                    sequencia: img.sequencia,
                                    data: img.data,
                                    equipamento: img.serieImagem?.equipamento || 'Desconhecido',
                                    dono: img.serieImagem?.dono || '',
                                    host: host,
                                    count: countByHost.get(host),
                                    latestDate: img.data  // Inicializar com primeira data
                                });
                            } else {
                                // Atualizar para a data mais recente
                                const current = urlsByHost.get(host);
                                const comparison = compareDate(img.data, current.latestDate);
                                console.log(`📍 [${host}] Imagem #${imgIndex}: "${img.data}" vs latestDate "${current.latestDate}" = ${comparison > 0 ? '🆕 NOVA!' : '🔄 anterior'}`);

                                if (comparison > 0) {
                                    console.log(`✅ [${host}] Atualizando latestDate para: "${img.data}"`);
                                    current.latestDate = img.data;
                                }
                            }
                        } catch (e) {
                            console.error('Erro ao parsear URL:', img.url, e);
                        }
                    }
                });
            }

            console.log(`✅ Encontradas ${urlsByHost.size} hosts únicos com ${countByHost.size} hosts totais`);
            console.log(`📊 Detalhes:`, countByHost);

            if (urlsByHost.size === 0) {
                console.log('⚠️ Nenhuma URL encontrada');
                return;
            }

            // 5. Criar painel de links
            createLinksPanel(urlsByHost, data.requisicaoId);

        } catch (error) {
            console.error('❌ Erro ao processar JSON:', error);
        }
    }, 500);

    /**
     * Compara duas datas - funciona com DD/MM/YYYY, DD/MM/YYYY HH:mm, ou ISO
     * Retorna: 1 se date1 > date2, -1 se date1 < date2, 0 se iguais
     */
    function compareDate(date1, date2) {
        try {
            // Converter para timestamp
            let d1 = parseDate(date1);
            let d2 = parseDate(date2);

            console.log(`🔍 Comparando: "${date1}" (${d1}) vs "${date2}" (${d2})`);

            if (d1 > d2) return 1;
            if (d1 < d2) return -1;
            return 0;
        } catch (e) {
            console.error('❌ Erro ao comparar datas:', date1, date2, e);
            return 0;
        }
    }

    /**
     * Parse de data - tenta vários formatos
     */
    function parseDate(dateStr) {
        if (!dateStr) return 0;

        // Formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
        if (dateStr.includes('-') && dateStr.includes('T')) {
            return new Date(dateStr).getTime();
        }

        // Formato DD/MM/YYYY HH:mm ou DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ');
            const datePart = parts[0]; // DD/MM/YYYY
            const timePart = parts[1] || '00:00'; // HH:mm (opcional)

            const [day, month, year] = datePart.split('/');
            const [hour, minute] = timePart.split(':');

            const dateObj = new Date(year, month - 1, day, hour || 0, minute || 0);
            return dateObj.getTime();
        }

        // Tenta direto
        return new Date(dateStr).getTime();
    }

    /**
     * Cria painel flutuante com os links (um por host + contador + data recente)
     */
    function createLinksPanel(urlsByHostMap, requisicaoId) {
        // Criar container do painel
        const panel = document.createElement('div');
        panel.id = 'motion-links-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 420px;
            max-height: 90vh;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            color: #e0e0e0;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 99999;
            box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 15px;
            font-weight: 600;
            font-size: 14px;
            border-bottom: 2px solid #3d8b40;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🔗 Lâminas Digitalizadas (${urlsByHostMap.size} hosts)</span>
            <button id="motion-panel-close" style="
                background: rgba(255,255,255,0.3);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.2s;
            ">✕</button>
        `;
        panel.appendChild(header);

        // Lista de links
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0;
        `;

        // Adicionar cada URL como item clicável (uma por host)
        let index = 1;
        urlsByHostMap.forEach((info, host) => {
            const item = document.createElement('a');
            item.href = info.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';

            const label = extractSystemLabel(info.equipamento);

            item.style.cssText = `
                display: flex;
                flex-direction: column;
                padding: 15px 15px;
                border-bottom: 1px solid #404040;
                text-decoration: none;
                color: #4CAF50;
                cursor: pointer;
                transition: all 0.2s;
                gap: 0;
            `;

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 600; color: #00ff88; font-size: 13px;">
                        ${index}. ${label}
                    </div>
                    <div style="color: #00ff88; font-size: 12px; font-weight: 600;">
                        ${info.count} lâmina${info.count > 1 ? 's' : ''}
                    </div>
                </div>
                <div style="font-size: 18px; color: #FFD54F; font-weight: 600;">
                    ${info.latestDate}
                </div>
            `;

            item.onmouseover = () => {
                item.style.background = 'rgba(76, 175, 80, 0.15)';
                item.style.color = '#00ff88';
                item.style.paddingLeft = '20px';
            };

            item.onmouseout = () => {
                item.style.background = 'transparent';
                item.style.color = '#4CAF50';
                item.style.paddingLeft = '15px';
            };

            // ⭐ Fechar popup ao clicar no link
            item.onclick = (e) => {
                console.log('✅ Link clicado. Fechando popup em 500ms...');
                setTimeout(() => {
                    window.close();
                }, 500);
            };

            listContainer.appendChild(item);
            index++;
        });

        panel.appendChild(listContainer);

        // Footer com info
        const footer = document.createElement('div');
        footer.style.cssText = `
            background: #1a1a1a;
            border-top: 1px solid #404040;
            padding: 8px 15px;
            font-size: 9px;
            color: #666;
            text-align: center;
        `;
        footer.textContent = `Req: ${requisicaoId}`;
        panel.appendChild(footer);

        // Adicionar ao body
        document.body.appendChild(panel);

        // Event: fechar painel
        document.getElementById('motion-panel-close').onclick = (e) => {
            e.preventDefault();
            panel.remove();
        };

        // Event: fechar ao apertar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('motion-links-panel')) {
                panel.remove();
            }
        });

        console.log(`✅ Painel criado com ${urlsByHostMap.size} hosts únicos!`);
    }

    /**
     * Extrai label do equipamento/sistema
     */
    function extractSystemLabel(equipamento) {
        if (!equipamento) return 'Lâmina Digitalizada';

        const mapping = {
            'Philips DPS': '📊 Philips DPS',
            'Philips SP': '📊 Philips SP',
            'Philips Go': '📊 Philips Go',
            'Leica': '🔍 Leica',
            'Navify': '🗺️ Navify',
            'Philips RJ': '📊 Philips RJ'
        };

        for (const [key, label] of Object.entries(mapping)) {
            if (equipamento.includes(key)) {
                return label;
            }
        }

        return `📄 ${equipamento.substring(0, 30)}`;
    }

    console.log('✅ Script pronto. Aguardando dados...');
})();