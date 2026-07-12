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
        if (session && session.user.email === 'tctulio2009@gmail.com') {
            loginSection.style.display = 'none';
            cmsSection.style.display = 'block';
            logoutBtn.style.display = 'inline-block';
        } else {
            loginSection.style.display = 'block';
            cmsSection.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    }
    
    checkUser();

    // Logar (Fluxo OTP / Código de Email)
    if (loginForm) {
        let isCodeSent = false;
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginBtn.disabled = true;
            statusMsg.style.display = 'none';

            const email = document.getElementById('adminEmail').value;

            if (!isCodeSent) {
                // ETAPA 1: Solicitar o código OTP
                loginBtn.textContent = 'Enviando...';
                try {
                    const { data, error } = await supabase.auth.signInWithOtp({
                        email: email
                    });

                    if (error) throw error;

                    statusMsg.textContent = 'Código enviado! Verifique seu e-mail (e a caixa de spam).';
                    statusMsg.className = 'status-msg success';
                    statusMsg.style.display = 'block';
                    
                    document.getElementById('emailGroup').style.display = 'none';
                    document.getElementById('codeGroup').style.display = 'block';
                    document.getElementById('adminCode').required = true;
                    
                    loginBtn.textContent = 'Autenticar Código';
                    isCodeSent = true;
                } catch (err) {
                    statusMsg.textContent = 'Erro ao enviar código: ' + err.message;
                    statusMsg.className = 'status-msg error';
                    statusMsg.style.display = 'block';
                } finally {
                    loginBtn.disabled = false;
                }
            } else {
                // ETAPA 2: Validar o código de 6 dígitos
                loginBtn.textContent = 'Autenticando...';
                const token = document.getElementById('adminCode').value;
                
                try {
                    const { data, error } = await supabase.auth.verifyOtp({
                        email: email,
                        token: token,
                        type: 'email'
                    });

                    if (error) throw error;

                    if (data.user && data.user.email !== 'tctulio2009@gmail.com') {
                        throw new Error("Acesso negado. Usuário não autorizado.");
                    }

                    statusMsg.textContent = 'Login efetuado com sucesso!';
                    statusMsg.className = 'status-msg success';
                    statusMsg.style.display = 'block';
                    checkUser();
                } catch (err) {
                    statusMsg.textContent = 'Código inválido: ' + err.message;
                    statusMsg.className = 'status-msg error';
                    statusMsg.style.display = 'block';
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Autenticar Código';
                }
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
});
