// UXfetch Partner Showcase Injector (Vanilla JS)
const initPartnerShowcase = async () => {
    const adSlot = document.getElementById('uxf-partner-slot');
    if (!adSlot || adSlot.dataset.loaded) return; // Prevent double injection

    try {
        const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
        
        // Fetch the active banner
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ad_banners?status=eq.active&select=*&order=updated_at.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const banner = data[0];
            const redirectUrl = `/ad-redirect.html?id=${banner.id}&dest=${encodeURIComponent(banner.target_url)}`;
            
            
            
            // Add CSS styles if not already present
            if (!document.getElementById('uxf-partner-styles')) {
                const style = document.createElement('style');
                style.id = 'uxf-partner-styles';
                style.textContent = `
                    .partner-wrapper { width: 100%; display: flex; justify-content: center; margin: 40px 0; }
                    .native-partner-link { position: relative; display: block; border-radius: 12px; transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid var(--border-color, #B7CFFF); box-shadow: 0 4px 12px rgba(0, 85, 255, 0.05); }
                    .native-partner-link:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 85, 255, 0.15); border-color: var(--primary, #0055FF); }
                    .partner-badge-floating { position: absolute; top: -12px; left: 24px; background: var(--white, #fff); color: #4A5568; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color, #B7CFFF); z-index: 10; }
                    .native-partner-link img { display: block; width: 300px; max-width: 100%; height: auto; border-radius: 12px; }
                    
                    /* Position fixo lateral no Desktop (1536px+) para TODAS as páginas */
                    @media (min-width: 1536px) {
                        .partner-wrapper { position: fixed; top: 120px; right: 40px; margin: 0; width: auto; z-index: 100; }
                    }
                `;
                document.head.appendChild(style);
            }

            const mobileSource = banner.image_mobile_url 
                ? `<source media="(max-width: 768px)" srcset="${banner.image_mobile_url}">` 
                : '';
                
            const isDesktop = window.innerWidth >= 1536;
            const imgAttributes = isDesktop ? 'fetchpriority="high"' : 'loading="lazy"';

            adSlot.innerHTML = `
                <aside class="partner-wrapper">
                    <a href="${redirectUrl}" class="native-partner-link" target="_blank" rel="sponsored noopener">
                        <span class="partner-badge-floating">Patrocinado</span>
                        <picture>
                            ${mobileSource}
                            <img src="${banner.image_url}" alt="${banner.alt_text}" ${imgAttributes}>
                        </picture>
                    </a>
                </aside>
            `;
            adSlot.dataset.loaded = 'true';
            
            // Track Impression via RPC
            fetch(`${SUPABASE_URL}/rest/v1/rpc/track_banner_view`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_banner_id: banner.id })
            }).catch(e => console.error('Ad tracking failed', e));
        }
    } catch (e) {
        console.error('Ad load failed', e);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPartnerShowcase);
} else {
    initPartnerShowcase();
}
