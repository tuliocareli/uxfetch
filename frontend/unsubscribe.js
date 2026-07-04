document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('unsubscribe-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const reasonInput = document.getElementById('reason');

    // Extrair token da URL (ex: unsubscribe.html?token=b3f1-...)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        form.style.display = 'none';
        errorMessage.innerText = 'Token não encontrado. Link de descadastro inválido.';
        errorMessage.classList.remove('hidden');
        return;
    }

    // Inicialização do Supabase Client
    let supabase;
    try {
        const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.warn('Supabase SDK não carregou.');
        }
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
    }

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if(!supabase) {
            alert('Sistema de banco de dados não disponível no momento.');
            return;
        }

        const reason = reasonInput.value.trim();

        // UI Feedback: Loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        errorMessage.classList.add('hidden');

        try {
            // 1. Opcional: Salvar o feedback anonimamente (limitado a 500 chars por segurança)
            if (reason) {
                const safeReason = reason.slice(0, 500);
                await supabase.from('unsubscribes_feedback').insert([{ reason: safeReason }]);
            }

            // 2. DESTRUIR os dados do usuário via função segura (RPC)
            const { error } = await supabase.rpc('unsubscribe_by_token', { secret_token: token });

            if (error) {
                throw error;
            }
            
            // On success
            form.style.display = 'none';
            successMessage.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao excluir do Supabase:', error);
            errorMessage.classList.remove('hidden');
            
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });
});
