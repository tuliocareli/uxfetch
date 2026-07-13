const fs = require('fs');
const path = require('path');

module.exports = async function(req, res) {
    const { slug } = req.query;
    const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';

    let html = '';

    // 1. Tentar ler o template post.html
    try {
        html = fs.readFileSync(path.join(process.cwd(), 'post.html'), 'utf8');
    } catch(err1) {
        try {
            html = fs.readFileSync(path.join(__dirname, '..', 'post.html'), 'utf8');
        } catch(err2) {
            // Fallback: Busca via requisição HTTP se não achar localmente na Vercel
            try {
                const host = req.headers.host || 'www.uxfetch.com.br';
                const protocol = host.includes('localhost') ? 'http' : 'https';
                const resp = await fetch(`${protocol}://${host}/post.html`);
                html = await resp.text();
            } catch(e) {
                return res.status(500).send('Erro ao carregar o template do artigo.');
            }
        }
    }

    // 2. Buscar os dados e injetar as meta tags
    try {
        if(slug) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&select=titulo,resumo,imagem_capa`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const post = data[0];
                const cover = post.imagem_capa || 'https://www.uxfetch.com.br/assets/og-image.png';
                
                const ogTags = `
    <title>${post.titulo} | UX Fetch</title>
    <meta property="og:title" content="${post.titulo} | UX Fetch">
    <meta property="og:description" content="${post.resumo}">
    <meta property="og:image" content="${cover}">
    <meta property="og:url" content="https://www.uxfetch.com.br/artigo/${slug}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.titulo} | UX Fetch">
    <meta name="twitter:description" content="${post.resumo}">
    <meta name="twitter:image" content="${cover}">`;

                // Substitui a tag <title> genérica pelo bloco inteiro de OG Tags
                html = html.replace('<title>UX Fetch | Blog</title>', ogTags);
            }
        }
        
        // 3. Retorna o HTML com Cache de 1 hora na CDN (stale-while-revalidate permite servir cache antigo enquanto atualiza)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(html);
        
    } catch (error) {
        // Se der erro no Supabase, retorna o HTML original sem quebrar a página
        console.error('Erro na Vercel Function:', error);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    }
};
