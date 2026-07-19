document.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const tabs = document.querySelectorAll('.tab-content');
    const formTypeInput = document.getElementById('form-type');
    const newsFields = document.querySelector('.newsletter-fields');
    const siteFields = document.querySelector('.site-fields');
    
    // Character counter for newsletter text
    const textoAnuncio = document.getElementById('texto_anuncio');
    const charCounter = document.getElementById('charCounter');

    if (textoAnuncio && charCounter) {
        textoAnuncio.addEventListener('input', () => {
            const currentLength = textoAnuncio.value.length;
            charCounter.textContent = `${currentLength} / 280`;
            if (currentLength > 280) {
                charCounter.classList.add('error');
            } else {
                charCounter.classList.remove('error');
            }
        });
    }

    // Toggle Logic
    function switchTab(targetId, updateUrl = true) {
        // Update Buttons
        toggleBtns.forEach(btn => {
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        // Update Content
        tabs.forEach(tab => {
            if (tab.id === `${targetId}-tab`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update Form Fields
        formTypeInput.value = targetId;
        if (targetId === 'site') {
            newsFields.style.display = 'none';
            siteFields.style.display = 'block';
        } else {
            newsFields.style.display = 'block';
            siteFields.style.display = 'none';
        }

        // Update URL state
        if (updateUrl) {
            const url = new URL(window.location);
            url.searchParams.set('tipo', targetId);
            window.history.pushState({}, '', url);
        }
    }

    // Listeners for toggles
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.target);
        });
    });

    // Initial check from URL
    const urlParams = new URLSearchParams(window.location.search);
    const initialType = urlParams.get('tipo');
    if (initialType === 'site' || initialType === 'newsletter') {
        switchTab(initialType, false);
    }

    // Form Submission
    const form = document.getElementById('adRequestForm');
    const submitBtn = document.getElementById('submitAdBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const successMessage = document.getElementById('successMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Extra client-side validation
        if (formTypeInput.value === 'newsletter' && textoAnuncio.value.length > 280) {
            alert('O texto do anúncio para a newsletter deve ter no máximo 280 caracteres.');
            return;
        }

        // Build payload
        const payload = {
            tipo: formTypeInput.value,
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            empresa: document.getElementById('empresa').value,
            site_url: document.getElementById('site_url').value,
            formato: formTypeInput.value === 'newsletter' 
                ? document.getElementById('formato_news').value 
                : document.getElementById('formato_site').value,
            orcamento: document.getElementById('orcamento').value,
            descricao: document.getElementById('descricao').value,
            link_destino: document.getElementById('link_destino') ? document.getElementById('link_destino').value : '',
            texto_anuncio: document.getElementById('texto_anuncio') ? document.getElementById('texto_anuncio').value : ''
        };

        // UI Loading
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            // Using Supabase Edge Functions
            const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
            const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
            
            // Wait, we need to invoke the function. We can use the global supabase client if available, 
            // but since we only have anon key in script.js, let's just make a fetch call.
            const response = await fetch(`${SUPABASE_URL}/functions/v1/submit_ad_request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar solicitação');
            }

            // Success
            form.querySelectorAll('.input-group, .form-row, button, h3, .newsletter-fields, .site-fields').forEach(el => el.style.display = 'none');
            successMessage.style.display = 'block';

        } catch (error) {
            console.error('Submission error:', error);
            alert('Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente ou nos envie um e-mail diretamente.');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });
});
