document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('subscribe-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const successMessage = document.getElementById('success-message');
    
    // Checkboxes
    const onlyRemoteCheck = document.getElementById('only_remote');
    const acceptOtherCheck = document.getElementById('accept_other_cities');
    const acceptRemoteCheck = document.getElementById('accept_remote');

    // Lógica de exclusão mútua dos checkboxes
    onlyRemoteCheck.addEventListener('change', (e) => {
        if(e.target.checked) {
            acceptOtherCheck.checked = false;
            acceptRemoteCheck.checked = false;
        }
    });

    acceptOtherCheck.addEventListener('change', (e) => {
        if(e.target.checked) {
            onlyRemoteCheck.checked = false;
        }
    });

    acceptRemoteCheck.addEventListener('change', (e) => {
        if(e.target.checked) {
            onlyRemoteCheck.checked = false;
        }
    });

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

        // Capture data according to our database model
        const payload = {
            email: document.getElementById('email').value,
            city: document.getElementById('city').value,
            accept_other_cities: acceptOtherCheck.checked,
            accept_remote: acceptRemoteCheck.checked,
            only_remote: onlyRemoteCheck.checked
        };

        // UI Feedback: Loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');

        // Real Supabase API Call
        try {
            const { data, error } = await supabase
                .from('subscribers')
                .insert([payload]);

            if (error) {
                if (error.code === '23505') {
                    console.log('Usuário já inscrito.');
                } else {
                    throw error;
                }
            }
            
            // On success
            form.style.display = 'none';
            successMessage.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            alert('Ops! Ocorreu um erro ao salvar sua inscrição. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });
});
