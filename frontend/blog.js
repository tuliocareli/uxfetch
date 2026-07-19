document.addEventListener('DOMContentLoaded', async () => {
    // Esse script lida com a exibição do carrossel na Home (index.html)
    const blogCarouselContainer = document.getElementById('blog-carousel-section');
    if (!blogCarouselContainer) return;

    const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
    
    try {
        let supabase = window.appSupabase;
        if (!supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.appSupabase = supabase;
        }

        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('titulo, slug, imagem_capa, imagem_capa_alt, resumo')
            .eq('status', 'published')
            .order('data_publicacao', { ascending: false })
            .limit(6);

        if (error) throw error;

        // Fallback: Se não houver posts publicados, mantemos oculto
        if (!posts || posts.length === 0) {
            blogCarouselContainer.style.display = 'none';
            return;
        }

        const carousel = document.getElementById('blogCarousel');
        if (!carousel) return;

        // Revela a seção agora que temos conteúdo
        blogCarouselContainer.style.display = 'block';
        carousel.innerHTML = ''; // Limpa estado de carregamento

        posts.forEach(post => {
            const card = document.createElement('a');
            card.href = `https://uxfetch.com.br/blog/${post.slug}`;
            card.className = 'uxf-card'; // Reaproveitando estilos do carrossel existente
            
            const img = post.imagem_capa || 'assets/og-image.png'; // Fallback
            
            card.innerHTML = `
                <div class="uxf-card-img-wrapper" style="padding: 0; height: 170px;">
                    <img class="uxf-card-img" style="object-fit: cover; width: 100%; height: 100%; border-radius: 20px 20px 0 0;" src="${img}" alt="${post.imagem_capa_alt || post.titulo}">
                </div>
                <div class="uxf-card-content" style="height: 210px; position: relative; justify-content: flex-start; padding: 20px; border-top: none;">
                    <div class="uxf-tag" style="margin-bottom: 12px; width: fit-content;">Artigo</div>
                    <h3 class="uxf-book-title" style="font-size: 1.1rem; margin-bottom: 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${post.titulo}</h3>
                    <p class="uxf-book-desc" style="font-size: 0.85rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${post.resumo}</p>
                </div>
            `;
            carousel.appendChild(card);
        });

        // Lógica dos controles do carrossel do blog
        const prevBtn = document.getElementById('blogPrev');
        const nextBtn = document.getElementById('blogNext');
        
        if(prevBtn && nextBtn) {
            const getScrollAmount = () => {
                const card = carousel.querySelector('.uxf-card');
                if (!card) return 304;
                const style = window.getComputedStyle(carousel);
                const gap = parseInt(style.gap) || 24;
                return card.offsetWidth + gap;
            };

            nextBtn.addEventListener('click', () => carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
            prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
        }

    } catch (err) {
        console.error('Erro ao buscar posts do blog:', err);
        blogCarouselContainer.style.display = 'none'; // Esconde em caso de erro
    }
});
