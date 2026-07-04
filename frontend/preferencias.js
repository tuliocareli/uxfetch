document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const tokenParam = urlParams.get('token'); // SEGURANÇA: token necessário para validar identidade na Edge Function
    const emailInput = document.getElementById('email');
    const form = document.getElementById('preferences-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = document.getElementById('loader');

    // Validação da URL
    if (emailParam && emailInput) {
        emailInput.value = emailParam;
    } else {
        alert("E-mail não encontrado na URL. Por favor, acesse esta página através do link no rodapé dos e-mails do UX Fetch.");
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    }

    // SEGURANÇA: bloqueia a página se o token estiver ausente (link direto sem e-mail)
    if (!tokenParam) {
        form.style.display = 'none';
        const errorDiv = document.createElement('p');
        errorDiv.style.cssText = 'text-align:center; color:#718096; padding: 40px 0;';
        errorDiv.textContent = 'Link inválido. Acesse esta página pelo link de preferências no rodapé dos e-mails do UX Fetch.';
        form.parentNode.insertBefore(errorDiv, form);
    }

    // Inicialização do Supabase
    let supabase;
    try {
        const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
    }

    // Submit do form de Preferências
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!emailInput.value || !emailInput.value.includes('@')) {
            alert("E-mail inválido.");
            return;
        }

        if(!supabase) {
            alert('Sistema temporariamente indisponível.');
            return;
        }

        // Build Roles Array
        const roles = [];
        if (document.getElementById('role_ux_ui').checked) roles.push('ux_ui');
        if (document.getElementById('role_leadership').checked) roles.push('leadership');
        if (document.getElementById('role_graphic').checked) roles.push('graphic');
        if (document.getElementById('role_others').checked) roles.push('others');
        
        // Build Seniorities Array
        const seniorities = [];
        if (document.getElementById('sen_junior').checked) seniorities.push('junior');
        if (document.getElementById('sen_pleno').checked) seniorities.push('pleno');
        if (document.getElementById('sen_senior').checked) seniorities.push('senior');
        if (document.getElementById('sen_especialista').checked) seniorities.push('especialista');

        // UI Loading State
        submitBtn.disabled = true;
        if(btnText) btnText.classList.add('hidden');
        if(loader) loader.classList.remove('hidden');

        try {
            const { data, error } = await supabase.functions.invoke('update_preferences', {
                body: {
                    email: emailInput.value,
                    preferred_roles: roles,
                    preferred_seniorities: seniorities,
                    token: tokenParam  // SEGURANÇA: envia o token para que a Edge Function valide a identidade
                }
            });

            if (error) throw error;
            
            // Sucesso
            form.style.display = 'none';
            document.getElementById('success-message').classList.remove('hidden');
            
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            alert('Ops! Ocorreu um erro ao salvar as suas preferências. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
            if(btnText) btnText.classList.remove('hidden');
            if(loader) loader.classList.add('hidden');
        }
    });
});
