// UXfetch Partner Showcase Injector (Vanilla JS)
document.addEventListener('DOMContentLoaded', async () => {
    const adSlot = document.getElementById('uxf-partner-slot');
    if (!adSlot) return;

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
                    .native-partner-link { position: relative; display: inline-block; border-radius: 12px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
                    .native-partner-link:hover { transform: translateY(-3px); box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1); }
                    .native-partner-link img { display: block; width: 100%; max-width: 300px; height: auto; object-fit: cover; }
                    .partner-badge-floating { position: absolute; top: 12px; left: 12px; z-index: 10; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #1e293b; background-color: rgba(255, 255, 255, 0.85); backdrop-filter: blur(4px); padding: 0.25rem 0.6rem; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); pointer-events: none; }
                    
                    @media (min-width: 1200px) {
                        .partner-wrapper {
                            position: fixed;
                            top: 140px;
                            right: 40px;
                            width: auto;
                            margin: 0;
                            z-index: 900;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            const mobileSource = banner.image_mobile_url 
                ? `<source media="(max-width: 768px)" srcset="${banner.image_mobile_url}">` 
                : '';

            adSlot.innerHTML = `
                <aside class="partner-wrapper">
                    <a href="${redirectUrl}" class="native-partner-link" target="_blank" rel="sponsored noopener">
                        <span class="partner-badge-floating">Patrocinado</span>
                        <picture>
                            ${mobileSource}
                            <img src="${banner.image_url}" alt="${banner.alt_text}" loading="lazy">
                        </picture>
                    </a>
                </aside>
            `;
            
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
});
