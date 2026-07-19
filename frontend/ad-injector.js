// UXfetch Ad Injector (Vanilla JS)
document.addEventListener('DOMContentLoaded', async () => {
    const adSlot = document.getElementById('uxf-ad-slot');
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
            if (!document.getElementById('uxf-ad-styles')) {
                const style = document.createElement('style');
                style.id = 'uxf-ad-styles';
                style.textContent = `
                    .ad-wrapper { width: 100%; display: flex; justify-content: center; margin: 40px 0; }
                    .native-ad-image-link { position: relative; display: inline-block; border-radius: 12px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
                    .native-ad-image-link:hover { transform: translateY(-3px); box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1); }
                    .native-ad-image-link img { display: block; max-width: 100%; width: 300px; height: 250px; object-fit: cover; }
                    .ad-badge-floating { position: absolute; top: 12px; left: 12px; z-index: 10; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #1e293b; background-color: rgba(255, 255, 255, 0.85); backdrop-filter: blur(4px); padding: 0.25rem 0.6rem; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); pointer-events: none; }
                `;
                document.head.appendChild(style);
            }

            adSlot.innerHTML = `
                <aside class="ad-wrapper">
                    <a href="${redirectUrl}" class="native-ad-image-link" target="_blank" rel="sponsored noopener">
                        <span class="ad-badge-floating">Patrocinado</span>
                        <img src="${banner.image_url}" alt="${banner.alt_text}" width="300" height="250" loading="lazy">
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
