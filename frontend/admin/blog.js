document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginSection = document.getElementById('loginSection');
    const cmsSection = document.getElementById('cmsSection');
    const hubView = document.getElementById('hubView');
    const editorView = document.getElementById('editorView');
    const loginForm = document.getElementById('loginForm');
    const postForm = document.getElementById('postForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const statusMsg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');
    const loginBtn = document.getElementById('loginBtn');
    const btnNewPost = document.getElementById('btnNewPost');
    const btnBackToHub = document.getElementById('btnBackToHub');

    // Inicialização do Quill Editor (Rich Text)
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ],
                handlers: {
                    image: function() {
                        const url = prompt('Por favor, cole a URL da imagem (Ex: Imgur):');
                        if (url) {
                            const range = this.quill.getSelection();
                            this.quill.insertEmbed(range.index, 'image', url);
                        }
                    }
                }
            }
        },
        placeholder: 'Escreva o artigo com estilo...'
    });

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
            conteudo: quill.root.innerHTML,
            status: document.getElementById('status').value
        };

        if (quill.getText().trim().length === 0) {
            statusMsg.textContent = 'O conteúdo do artigo não pode estar vazio.';
            statusMsg.classList.add('error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Post';
            return;
        }

        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .upsert([payload], { onConflict: 'slug' });

            if (error) throw error;

            if(payload.status === 'published') {
                postForm.reset();
            }
            statusMsg.textContent = 'Post salvo com sucesso!';
            statusMsg.classList.add('success');
            
            // Voltar pro Hub
            setTimeout(() => {
                editorView.style.display = 'none';
                hubView.style.display = 'block';
                loadPosts();
            }, 1000);
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
                postsList.innerHTML = '<p style="color: #718096;">Nenhum artigo encontrado. Crie seu primeiro post!</p>';
                return;
            }

            postsList.innerHTML = '';
            data.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                
                const isPub = post.status === 'published';
                
                card.innerHTML = `
                    <div class="post-info" style="flex: 1;">
                        <h3>${post.titulo}</h3>
                        <span style="color: #64748b; font-size: 0.85rem;">/blog/${post.slug}</span>
                    </div>
                    <div class="post-actions" style="display: flex; gap: 8px; align-items: center;">
                        <select onchange="updatePostStatus('${post.slug}', this.value)" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; cursor: pointer; background: ${isPub ? '#dcfce7' : '#f1f5f9'}; color: ${isPub ? '#166534' : '#475569'}; outline: none;">
                            <option value="draft" ${!isPub ? 'selected' : ''}>Rascunho</option>
                            <option value="published" ${isPub ? 'selected' : ''}>Publicado</option>
                        </select>
                        <button class="btn-edit" onclick="editPost('${post.slug}')">Editar</button>
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

    if (btnNewPost) {
        btnNewPost.addEventListener('click', () => {
            postForm.reset();
            quill.setContents([]);
            document.getElementById('slug').readOnly = false;
            submitBtn.textContent = 'Salvar Post';
            statusMsg.className = 'status-msg';
            statusMsg.textContent = '';
            
            hubView.style.display = 'none';
            editorView.style.display = 'block';
        });
    }

    if (btnBackToHub) {
        btnBackToHub.addEventListener('click', () => {
            editorView.style.display = 'none';
            hubView.style.display = 'block';
            loadPosts();
        });
    }

    window.updatePostStatus = async (slug, newStatus) => {
        try {
            const { error } = await supabase.from('blog_posts').update({ status: newStatus }).eq('slug', slug);
            if (error) throw error;
            // Cor do select atualiza via recarga rápida
            loadPosts();
        } catch (err) {
            alert('Erro ao atualizar status: ' + err.message);
        }
    };

    window.editPost = (slug) => {
        const post = window.blogPostsData?.find(p => p.slug === slug);
        if (!post) return;
        
        document.getElementById('titulo').value = post.titulo;
        document.getElementById('slug').value = post.slug;
        document.getElementById('imagem_capa').value = post.imagem_capa || '';
        document.getElementById('resumo').value = post.resumo;
        quill.root.innerHTML = post.conteudo;
        document.getElementById('status').value = post.status;
        
        submitBtn.textContent = 'Atualizar Post';
        statusMsg.className = 'status-msg';
        statusMsg.textContent = '';
        
        hubView.style.display = 'none';
        editorView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
