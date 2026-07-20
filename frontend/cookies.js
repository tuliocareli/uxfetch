/**
 * cookies.js - Gerenciador de Consentimento de Cookies (LGPD)
 * Lógica: Microsoft Clarity e Google Analytics (GA4) SÓ são carregados
 * após o usuário aceitar. A escolha é salva no localStorage.
 */

const CLARITY_TAG = 'x6g9oba41h';
const GA_TAG = 'G-VC8JDMERM6';
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

function loadGoogleAnalytics() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TAG}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_TAG, { anonymize_ip: true });
}

function loadAnalytics() {
    loadClarity();
    loadGoogleAnalytics();
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
    loadAnalytics();
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
                Usamos cookies analíticos via Microsoft Clarity (mapas de calor) e Google Analytics (origem do tráfego) para melhorar o radar.
                Nenhum dado sensível é coletado.
                <a href="termos.html" class="cookie-banner__link">Saiba mais</a>
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
        // Usuário já aceitou antes: carrega ambas as ferramentas silenciosamente
        loadAnalytics();
    } else if (consent === 'declined') {
        // Usuário já recusou: não faz nada
    } else {
        // Primeira visita: exibe o banner
        renderBanner();
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initCookieConsent);
