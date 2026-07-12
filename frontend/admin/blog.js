document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginSection = document.getElementById('loginSection');
    const cmsSection = document.getElementById('cmsSection');
    const loginForm = document.getElementById('loginForm');
    const postForm = document.getElementById('postForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const statusMsg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');
    const loginBtn = document.getElementById('loginBtn');

    // Verifica Sessão Atual
    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && (session.user.email === 'tctulio2009@gmail.com' || session.user.email === 'contato@uxfetch.com.br')) {
            loginSection.style.display = 'none';
            cmsSection.style.display = 'block';
            logoutBtn.style.display = 'inline-block';
            loadPosts(); // Carregar posts quando o usuário for validado
        } else {
            loginSection.style.display = 'block';
            cmsSection.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    }
    
    checkUser();

    // Logar (Fluxo Direto de Email e Senha)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginBtn.disabled = true;
            loginBtn.textContent = 'Autenticando...';
            statusMsg.style.display = 'none';

            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                const allowedEmails = ['tctulio2009@gmail.com', 'contato@uxfetch.com.br'];
                if (!allowedEmails.includes(data.user.email)) {
                    throw new Error("Acesso negado. Usuário não autorizado.");
                }

                statusMsg.textContent = 'Login efetuado com sucesso!';
                statusMsg.className = 'status-msg success';
                statusMsg.style.display = 'block';
                checkUser();
            } catch (err) {
                statusMsg.textContent = 'Erro ao logar: ' + err.message;
                statusMsg.className = 'status-msg error';
                statusMsg.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Entrar no CMS';
            }
        });
    }

    // Deslogar
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            statusMsg.style.display = 'none';
            checkUser();
        });
    }

    if (!postForm) return;

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
        statusMsg.className = 'status-msg';
        statusMsg.textContent = '';

        const payload = {
            titulo: document.getElementById('titulo').value,
            slug: document.getElementById('slug').value,
            imagem_capa: document.getElementById('imagem_capa').value || null,
            resumo: document.getElementById('resumo').value,
            conteudo: document.getElementById('conteudo').value,
            status: document.getElementById('status').value
        };

        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .upsert([payload], { onConflict: 'slug' });

            if (error) throw error;

            statusMsg.textContent = 'Post salvo com sucesso!';
            statusMsg.classList.add('success');
            
            if(payload.status === 'published') {
                postForm.reset();
            }
            submitBtn.textContent = 'Salvar Novo Post';
            loadPosts(); // recarrega a lista
        } catch (error) {
            console.error(error);
            statusMsg.textContent = 'Erro ao salvar: ' + error.message;
            statusMsg.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Post';
        }
    });

    // Auto-gerar slug a partir do título
    const tituloInput = document.getElementById('titulo');
    const slugInput = document.getElementById('slug');

    if (tituloInput && slugInput) {
        tituloInput.addEventListener('blur', () => {
            if (!slugInput.value) {
                slugInput.value = tituloInput.value
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
                    .replace(/[^\w\s-]/g, '') // remove especiais
                    .trim()
                    .replace(/\s+/g, '-');
            }
        });
    }

    // --- LÓGICA DA LISTAGEM DE POSTS --- //
    async function loadPosts() {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;
        postsList.innerHTML = '<p style="color: #718096;">Carregando artigos...</p>';
        
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('titulo, slug, status, created_at, resumo, imagem_capa, conteudo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                postsList.innerHTML = '<p style="color: #718096;">Nenhum artigo encontrado.</p>';
                return;
            }

            postsList.innerHTML = '';
            data.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                
                const isPub = post.status === 'published';
                const statusClass = isPub ? 'status-published' : 'status-draft';
                const statusText = isPub ? 'Publicado' : 'Rascunho';

                card.innerHTML = `
                    <div class="post-info">
                        <h3>${post.titulo}</h3>
                        <span class="${statusClass}">${statusText}</span>
                        <span style="color: #64748b; font-size: 0.85rem; margin-left: 8px;">/blog/${post.slug}</span>
                    </div>
                    <div class="post-actions">
                        <button class="btn-edit" onclick="editPost('${post.slug}')">Editar</button>
                        <button class="btn-delete" onclick="deletePost('${post.slug}')">Excluir</button>
                    </div>
                `;
                postsList.appendChild(card);
            });
            window.blogPostsData = data; 
        } catch (error) {
            postsList.innerHTML = '<p style="color: #ef4444;">Erro ao carregar artigos.</p>';
            console.error(error);
        }
    }

    const refreshBtn = document.getElementById('refreshPostsBtn');
    if(refreshBtn) refreshBtn.addEventListener('click', loadPosts);

    window.editPost = (slug) => {
        const post = window.blogPostsData?.find(p => p.slug === slug);
        if (!post) return;
        
        document.getElementById('titulo').value = post.titulo;
        document.getElementById('slug').value = post.slug;
        document.getElementById('imagem_capa').value = post.imagem_capa || '';
        document.getElementById('resumo').value = post.resumo;
        document.getElementById('conteudo').value = post.conteudo;
        document.getElementById('status').value = post.status;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        submitBtn.textContent = 'Atualizar Post';
    };

    window.deletePost = async (slug) => {
        if(!confirm('Tem certeza que deseja excluir este artigo permanentemente?')) return;
        
        try {
            const { error } = await supabase.from('blog_posts').delete().eq('slug', slug);
            if (error) throw error;
            loadPosts(); 
        } catch(error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };
});
