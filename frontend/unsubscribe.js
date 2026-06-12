document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('unsubscribe-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const reasonInput = document.getElementById('reason');

    // Extrair email da URL (ex: unsubscribe.html?email=test@test.com)
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    if (!email) {
        form.style.display = 'none';
        errorMessage.innerText = 'Nenhum e-mail fornecido. Link inválido.';
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
            // 1. Opcional: Salvar o feedback anonimamente
            if (reason) {
                await supabase.from('unsubscribes_feedback').insert([{ reason: reason }]);
            }

            // 2. DESTRUIR os dados do usuário respeitando a LGPD
            const { data, error } = await supabase
                .from('subscribers')
                .delete()
                .eq('email', email);

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
