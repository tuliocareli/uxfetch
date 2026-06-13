/**
 * cookies.js - Gerenciador de Consentimento de Cookies (LGPD)
 * Lógica: O Microsoft Clarity SÓ é carregado após o usuário aceitar.
 * Se o usuário recusar, o Clarity não roda. A escolha é salva no localStorage.
 */

const CLARITY_TAG = 'x6g9oba41h';
const CONSENT_KEY = 'uxfetch_cookie_consent';

function loadClarity() {
    (function(c, l, a, r, i, t, y) {
        c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_TAG);
}

function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('cookie-banner--hidden');
        setTimeout(() => banner.remove(), 400);
    }
}

function handleAccept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    loadClarity();
    hideBanner();
}

function handleDecline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    hideBanner();
}

function renderBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-banner__content">
            <p class="cookie-banner__text">
                🎨 <strong>Como bom designer, adoro ver como a interface performa.</strong>
                Usamos cookies de mapa de calor via Microsoft Clarity para entender como você usa o radar e melhorar o site.
                Nenhum dado sensível é coletado e ninguém vai te perseguir com anúncios.
                <a href="lgpd.html" class="cookie-banner__link">Saiba mais</a>
            </p>
            <div class="cookie-banner__actions">
                <button id="cookie-decline" class="cookie-btn cookie-btn--secondary">Apenas os essenciais</button>
                <button id="cookie-accept" class="cookie-btn cookie-btn--primary">Topo ajudar! 👍</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', handleAccept);
    document.getElementById('cookie-decline').addEventListener('click', handleDecline);
}

function initCookieConsent() {
    const consent = localStorage.getItem(CONSENT_KEY);

    if (consent === 'accepted') {
        // Usuário já aceitou antes: carrega Clarity silenciosamente
        loadClarity();
    } else if (consent === 'declined') {
        // Usuário já recusou: não faz nada
    } else {
        // Primeira visita: exibe o banner
        renderBanner();
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initCookieConsent);
