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
    const acceptsHybridCheck = document.getElementById('accepts_hybrid');

    // IBGE Selects
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    if (stateSelect && citySelect) {
        // Carrega Estados
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(states => {
                states.forEach(state => {
                    const option = document.createElement('option');
                    option.value = state.sigla;
                    option.textContent = state.sigla;
                    stateSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Erro ao carregar estados do IBGE:', err));

        // Ao selecionar um estado, carrega as cidades
        stateSelect.addEventListener('change', (e) => {
            const uf = e.target.value;
            citySelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
            citySelect.disabled = true;

            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
                .then(res => res.json())
                .then(cities => {
                    citySelect.innerHTML = '<option value="" disabled selected>Selecione a Cidade</option>';
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.nome;
                        option.textContent = city.nome;
                        citySelect.appendChild(option);
                    });
                    citySelect.disabled = false;
                })
                .catch(err => {
                    console.error('Erro ao carregar cidades:', err);
                    citySelect.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
                });
        });
    }

    // Lógica de exclusão mútua dos checkboxes
    onlyRemoteCheck.addEventListener('change', (e) => {
        if(e.target.checked) {
            acceptOtherCheck.checked = false;
            acceptRemoteCheck.checked = false;
            acceptsHybridCheck.checked = false;
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

    acceptsHybridCheck.addEventListener('change', (e) => {
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
        let finalCityString = '';
        if (stateSelect && citySelect) {
            finalCityString = `${citySelect.value} - ${stateSelect.value}`;
        }

        // Capture Turnstile Token
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

        if (!turnstileToken) {
            alert('Por favor, aguarde a verificação de segurança (Anti-Spam) terminar antes de enviar.');
            return;
        }

        const payload = {
            email: document.getElementById('email').value,
            city: finalCityString,
            accept_other_cities: acceptOtherCheck.checked,
            accept_remote: acceptRemoteCheck.checked,
            only_remote: onlyRemoteCheck.checked,
            accepts_hybrid: acceptsHybridCheck.checked,
            turnstileToken: turnstileToken
        };

        // UI Feedback: Loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');

        // Real Supabase API Call (via Edge Function)
        try {
            const { data, error } = await supabase.functions.invoke('subscribe', {
                body: payload
            });

            if (error) {
                throw error;
            }
            
            // On success of STEP 1
            const step1Container = document.getElementById('step1-container');
            if (step1Container) {
                step1Container.classList.add('hidden');
            } else {
                form.style.display = 'none'; // Fallback for other pages
            }

            // Fill hidden email in step 2
            const prefEmailInput = document.getElementById('pref-email');
            if (prefEmailInput) prefEmailInput.value = payload.email;

            // Show Step 2
            const step2Container = document.getElementById('step2-container');
            if (step2Container) {
                step2Container.classList.remove('hidden');
                
                // Change Hero Text
                const heroText = document.querySelector('.hero-text');
                if (heroText) {
                    heroText.innerHTML = '<h1>Só mais um passo! Filtre o radar para o <span class="relative-inline">seu perfil<img src="assets/linha.svg" class="linha-svg" alt=""></span>.</h1><p>Para enviarmos apenas as vagas ideais, precisamos saber qual o seu momento atual de carreira.</p>';
                }
            } else {
                // If we are on a page without step 2, just show success
                if (successMessage) successMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            alert('Ops! Ocorreu um erro ao salvar sua inscrição. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });

    // Preferences Form Submission Logic (STEP 2)
    const prefForm = document.getElementById('preferences-form');
    if (prefForm) {
        prefForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitPrefBtn = document.getElementById('submit-pref-btn');
            const prefBtnText = submitPrefBtn.querySelector('.btn-text');
            const prefLoader = submitPrefBtn.querySelector('.loader');
            
            const email = document.getElementById('pref-email').value;
            
            // Build Roles Array
            const roles = [];
            if (document.getElementById('role_ux_ui') && document.getElementById('role_ux_ui').checked) roles.push('ux_ui');
            if (document.getElementById('role_leadership') && document.getElementById('role_leadership').checked) roles.push('leadership');
            if (document.getElementById('role_graphic') && document.getElementById('role_graphic').checked) roles.push('graphic');
            if (document.getElementById('role_others') && document.getElementById('role_others').checked) roles.push('others');
            
            // Build Seniorities Array
            const seniorities = [];
            if (document.getElementById('sen_junior') && document.getElementById('sen_junior').checked) seniorities.push('junior');
            if (document.getElementById('sen_pleno') && document.getElementById('sen_pleno').checked) seniorities.push('pleno');
            if (document.getElementById('sen_senior') && document.getElementById('sen_senior').checked) seniorities.push('senior');
            if (document.getElementById('sen_especialista') && document.getElementById('sen_especialista').checked) seniorities.push('especialista');
            
            submitPrefBtn.disabled = true;
            if(prefBtnText) prefBtnText.classList.add('hidden');
            if(prefLoader) prefLoader.classList.remove('hidden');
            
            try {
                const { data, error } = await supabase.functions.invoke('update_preferences', {
                    body: {
                        email: email,
                        preferred_roles: roles,
                        preferred_seniorities: seniorities
                    }
                });

                if (error) throw error;
                
                // Final Success
                prefForm.style.display = 'none';
                const successMsg = document.getElementById('success-message');
                if (successMsg) successMsg.classList.remove('hidden');
                
            } catch (error) {
                console.error('Erro ao salvar preferências:', error);
                alert('Ops! Ocorreu um erro ao salvar. Tente novamente.');
            } finally {
                submitPrefBtn.disabled = false;
                if(prefBtnText) prefBtnText.classList.remove('hidden');
                if(prefLoader) prefLoader.classList.add('hidden');
            }
        });
    }
});


// --- MENU MOBILE LOGIC ---
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileMenuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');

if (mobileBtn && mobileOverlay && closeMenuBtn) {
    mobileBtn.addEventListener('click', () => {
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevents scrolling behind the menu
    });

    closeMenuBtn.addEventListener('click', () => {
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

// --- VAGAS PAGE LOGIC ---
if (window.location.pathname.includes('/vagas') || window.location.pathname.includes('vagas.html')) {
    const jobsGrid = document.getElementById('jobsGrid');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Filters DOM
    // Filters DOM
    const filterPills = document.querySelectorAll('.filter-pill');
    const stateSelect = document.getElementById('vagas-state');
    const citySelect = document.getElementById('vagas-city');

    let allJobsCache = [];
    
    // Active Filter Sets
    let activeAreas = new Set();
    let activeSeniorities = new Set();
    let activeFormats = new Set();

    let filteredJobsCache = [];
    let currentPage = 1;
    const jobsPerPage = 21;

    // Load IBGE Locations for Filters
    if (stateSelect && citySelect) {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(states => {
                states.forEach(state => {
                    const option = document.createElement('option');
                    option.value = state.sigla;
                    option.textContent = state.sigla;
                    stateSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Erro ao carregar estados do IBGE:', err));

        stateSelect.addEventListener('change', (e) => {
            const uf = e.target.value;
            citySelect.innerHTML = '<option value="" selected>Todas as Cidades</option>';
            
            if (!uf) {
                citySelect.disabled = true;
                applyFilters();
                return;
            }
            
            citySelect.disabled = true;
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
                .then(res => res.json())
                .then(cities => {
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.nome;
                        option.textContent = city.nome;
                        citySelect.appendChild(option);
                    });
                    citySelect.disabled = false;
                    applyFilters();
                })
                .catch(err => console.error('Erro ao carregar cidades:', err));
        });

        citySelect.addEventListener('change', () => applyFilters());
    }

    // Toggle Pills Logic
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const filterType = pill.getAttribute('data-filter');
            let group = '';
            
            if (filterType.startsWith('area_')) group = 'area';
            else if (filterType.startsWith('sen_')) group = 'sen';
            else group = 'format'; // format_all, remoto, hibrido, presencial, internacional

            if (filterType === 'area_all' || filterType === 'sen_all' || filterType === 'format_all') {
                // Turn OFF all specific pills in this group
                filterPills.forEach(p => {
                    const ft = p.getAttribute('data-filter');
                    if (group === 'area' && ft.startsWith('area_') && ft !== 'area_all') {
                        p.classList.remove('active');
                        activeAreas.delete(ft.replace('area_', ''));
                    }
                    if (group === 'sen' && ft.startsWith('sen_') && ft !== 'sen_all') {
                        p.classList.remove('active');
                        activeSeniorities.delete(ft.replace('sen_', ''));
                    }
                    if (group === 'format' && ['remoto', 'hibrido', 'presencial', 'internacional'].includes(ft)) {
                        p.classList.remove('active');
                        activeFormats.delete(ft);
                    }
                });
                pill.classList.add('active');
            } else {
                // It's a specific pill
                pill.classList.toggle('active');
                
                let activeSet;
                let allPillId;
                let val = filterType;
                
                if (group === 'area') {
                    activeSet = activeAreas;
                    allPillId = 'area_all';
                    val = filterType.replace('area_', '');
                } else if (group === 'sen') {
                    activeSet = activeSeniorities;
                    allPillId = 'sen_all';
                    val = filterType.replace('sen_', '');
                } else {
                    activeSet = activeFormats;
                    allPillId = 'format_all';
                }

                if (pill.classList.contains('active')) {
                    activeSet.add(val);
                    // Turn off the 'ALL' pill
                    const allPill = document.querySelector(`.filter-pill[data-filter="${allPillId}"]`);
                    if (allPill) allPill.classList.remove('active');
                } else {
                    activeSet.delete(val);
                    // If empty, turn ON the 'ALL' pill
                    if (activeSet.size === 0) {
                        const allPill = document.querySelector(`.filter-pill[data-filter="${allPillId}"]`);
                        if (allPill) allPill.classList.add('active');
                    }
                }
            }
            
            applyFilters();
        });
    });

    function applyFilters() {
        let filtered = [...allJobsCache];

        // 1. Filter by Area
        if (activeAreas.size > 0) {
            filtered = filtered.filter(job => {
                const t = job.title.toLowerCase();
                
                const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|motion|3d|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital|v[ií]deo|videomaker|audiovisual)\b/i.test(t);
                
                const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);
                
                const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
                const isUxUi = isUxUiProduct;
                
                const isGraphic = /\b(graphic|gr[aá]fico|visual|brand|marketing|arte|social media|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t) || (!isPlusExplicit && !isLeadership && !isUxUiProduct);
                
                const isOthers = /\b(motion|3d|ilustra|game|cad|moda|interiores|embalagem|t[êe]xtil|v[ií]deo|videomaker|audiovisual)\b/i.test(t);
                
                if (activeAreas.has('leadership') && isLeadership) return true;
                if (activeAreas.has('graphic') && isGraphic) return true;
                if (activeAreas.has('others') && isOthers) return true;
                if (activeAreas.has('ux_ui') && isUxUi) return true;
                return false;
            });
        }

        // 2. Filter by Seniority
        if (activeSeniorities.size > 0) {
            filtered = filtered.filter(job => {
                const t = job.title.toLowerCase();
                const isJunior = /\b(est[áa]gio|trainee|j[úu]nior|junior|jr\.?)\b/i.test(t);
                const isPleno = /\b(pleno|pl\.?|mid[\s-]?level)\b/i.test(t);
                const isEspecialista = /\b(lead|head|staff|principal|especialista|manager|diretor)\b/i.test(t);
                const isSenior = /\b(s[êe]nior|senior|sr\.?)\b/i.test(t);
                const isUnspecified = !isJunior && !isPleno && !isEspecialista && !isSenior;
                
                if (activeSeniorities.has('junior') && isJunior) return true;
                if (activeSeniorities.has('pleno') && (isPleno || isUnspecified)) return true;
                if (activeSeniorities.has('senior') && (isSenior || isUnspecified)) return true;
                if (activeSeniorities.has('especialista') && isEspecialista) return true;
                return false;
            });
        }

        // 3. Filter by Work Model (Formats)
        if (activeFormats.size > 0) {
            filtered = filtered.filter(job => {
                const matchesInternacional = !!job.is_international;
                const matchesRemoto = job.work_mode === 'remote' || (job.is_remote && !job.work_mode) || (job.is_international && !job.work_mode);
                const matchesHibrido = job.work_mode === 'hybrid';
                const matchesPresencial = !matchesRemoto && !matchesHibrido;

                if (activeFormats.has('internacional') && matchesInternacional) return true;
                if (activeFormats.has('remoto') && matchesRemoto) return true;
                if (activeFormats.has('hibrido') && matchesHibrido) return true;
                if (activeFormats.has('presencial') && matchesPresencial) return true;

                return false;
            });
        }

        // 4. Filter by Location (IBGE)
        const selectedState = stateSelect ? stateSelect.value : '';
        const selectedCity = citySelect && !citySelect.disabled ? citySelect.value : '';

        if (selectedState) {
            filtered = filtered.filter(job => {
                const loc = job.location || '';
                if (selectedState && !loc.includes(selectedState)) return false;
                if (selectedCity && !loc.toLowerCase().includes(selectedCity.toLowerCase())) return false;
                return true;
            });
        }

        filteredJobsCache = filtered;
        currentPage = 1; // Reset to page 1 on new filter
        renderJobs();
    }

    function renderPagination(totalJobs) {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalJobs / jobsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        // Prev Button (vai para a PRIMEIRA página)
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.disabled = currentPage === 1;
        prevBtn.title = 'Primeira página';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage = 1;
                renderJobs();
                window.scrollTo({ top: document.querySelector('.jobs-hero').offsetTop, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Page Numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            const btn = createPageBtn(1);
            paginationContainer.appendChild(btn);
            if (startPage > 2) {
                const ell = document.createElement('span');
                ell.className = 'page-ellipsis';
                ell.textContent = '...';
                paginationContainer.appendChild(ell);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = createPageBtn(i);
            paginationContainer.appendChild(btn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ell = document.createElement('span');
                ell.className = 'page-ellipsis';
                ell.textContent = '...';
                paginationContainer.appendChild(ell);
            }
            const btn = createPageBtn(totalPages);
            paginationContainer.appendChild(btn);
        }

        // Next Button (vai para a ÚLTIMA página)
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.title = 'Última página';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage = totalPages;
                renderJobs();
                window.scrollTo({ top: document.querySelector('.jobs-hero').offsetTop, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    function createPageBtn(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        if (pageNum === currentPage) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            currentPage = pageNum;
            renderJobs();
            window.scrollTo({ top: document.querySelector('.jobs-hero').offsetTop, behavior: 'smooth' });
        });
        return btn;
    }

    function renderJobs() {
        jobsGrid.innerHTML = '';
        
        if (!filteredJobsCache || filteredJobsCache.length === 0) {
            jobsGrid.style.display = 'block';
            jobsGrid.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px 0;">Nenhuma vaga encontrada com os filtros selecionados.</p>';
            renderPagination(0);
            return;
        }

        jobsGrid.style.display = 'grid';

        // Paginating
        const startIndex = (currentPage - 1) * jobsPerPage;
        const endIndex = startIndex + jobsPerPage;
        const jobsToRender = filteredJobsCache.slice(startIndex, endIndex);

        jobsToRender.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';

            let workModeBadge = '';
            if (job.work_mode === 'remote' || (job.is_remote && !job.work_mode) || (job.is_international && !job.work_mode)) {
                workModeBadge = '<span class="job-badge" style="background:#e0e7ff; color:#0055ff;">REMOTA</span>';
            } else if (job.work_mode === 'hybrid') {
                workModeBadge = '<span class="job-badge" style="background:#f3e8ff; color:#7c3aed;">HÍBRIDA</span>';
            } else {
                workModeBadge = '<span class="job-badge" style="background:#f4f4f5; color:#71717A;">PRESENCIAL</span>';
            }
            
            let sourceBadge = '';
            if(job.source) {
                sourceBadge = `<span class="job-badge" style="background:#e0f2fe; color:#0369a1;">${job.source}</span>`;
            }

            let intlBadge = '';
            if (job.is_international) {
                intlBadge = `<span class="job-badge" style="background:#fef3c7; color:#b45309;">🌍 INTERNACIONAL</span>`;
            }

            let newBadge = '';
            let dateStr = '';
            if(job.created_at) {
                const dateObj = new Date(job.created_at);
                dateStr = dateObj.toLocaleDateString('pt-BR');
                
                // Lógica de Escassez / FOMO Visual
                const diffTime = Math.abs(new Date() - dateObj);
                const diffHours = diffTime / (1000 * 60 * 60); 
                if (diffHours <= 48) {
                    newBadge = `<span class="job-badge" style="background: linear-gradient(90deg, #FF6B6B 0%, #FF4B4B 100%); color: white; border: none; font-weight: 700; box-shadow: 0 2px 4px rgba(255, 75, 75, 0.3);">✨ NOVA</span>`;
                }
            }

            card.innerHTML = `
                <div class="job-badges">
                    ${newBadge}
                    ${intlBadge}
                    ${workModeBadge}
                    ${sourceBadge}
                </div>
                <h3 class="job-title">${job.title}</h3>
                <p class="job-company">${job.company}</p>
                <div class="job-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${job.location}
                </div>
                <p class="job-description">${job.description || 'Vaga encontrada pelo UX Fetch.'}</p>
                <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="job-btn">Ver Vaga Completa</a>
                <div class="job-date">Capturada em ${dateStr}</div>
            `;
            jobsGrid.appendChild(card);
        });
        
        renderPagination(filteredJobsCache.length);
    }

    function injectJobSchema(jobs) {
        // Remove existing dynamic schema if any
        const existing = document.getElementById('dynamic-job-schema');
        if (existing) existing.remove();

        const jobsToSchema = jobs.slice(0, 10); // Limit to top 10 for performance/size
        if (jobsToSchema.length === 0) return;

        const schemaObject = {
            "@context": "https://schema.org",
            "@graph": jobsToSchema.map(job => {
                return {
                    "@type": "JobPosting",
                    "title": job.title,
                    "description": job.description || 'Vaga encontrada pelo radar UX Fetch.',
                    "datePosted": job.created_at ? new Date(job.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    "hiringOrganization": {
                        "@type": "Organization",
                        "name": job.company || 'Empresa Confidencial'
                    },
                    "jobLocation": {
                        "@type": "Place",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": job.location || 'Brasil',
                            "addressCountry": "BR"
                        }
                    },
                    "jobLocationType": job.work_mode === 'remote' || job.is_remote ? "TELECOMMUTE" : undefined,
                    "employmentType": "FULL_TIME",
                    "url": job.url || "https://uxfetch.com.br/vagas.html"
                };
            })
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'dynamic-job-schema';
        script.textContent = JSON.stringify(schemaObject);
        document.head.appendChild(script);
    }

    async function fetchJobs() {
        if (!window.supabase) {
            console.error('Supabase client is not loaded');
            loadingIndicator.innerHTML = '<p style="color:red;">Erro ao carregar o banco de dados.</p>';
            return;
        }

        try {
            const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
            const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
            const localSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: jobs, error } = await localSupabase
                .from('jobs')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            loadingIndicator.style.display = 'none';
            
            // Lógica de Interleaving (Sortimento)
            const rawJobs = jobs || [];
            
            // 1. Função Auxiliar de Categorização (Core vs Plus) - STRICT MODE
            function categorizeJob(job) {
                const t = job.title.toLowerCase();
                
                // 1. Se tem palavra de outra área, é PLUS na hora
                const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|motion|3d|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital|v[ií]deo|videomaker|audiovisual)\b/i.test(t);
                if (isPlusExplicit) return 'plus';
                
                // 2. Verifica se é estritamente de Produto/UX/UI ou Liderança
                const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
                const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);
                
                if (isUxUiProduct || isLeadership) return 'core';
                
                // 3. Qualquer coisa genérica que sobrou (ex: "Designer Jr.") cai no Plus (Design Gráfico)
                return 'plus';
            }

            // 2. Interleave de Core (UX/UI/Produto) vs Plus (Gráfico/Motion) - Proporção 4:1
            function interleaveCorePlus(targetJobs) {
                const core = targetJobs.filter(j => categorizeJob(j) === 'core');
                const plus = targetJobs.filter(j => categorizeJob(j) === 'plus');
                const result = [];
                let cIdx = 0, pIdx = 0;
                while (cIdx < core.length || pIdx < plus.length) {
                    for (let k = 0; k < 4 && cIdx < core.length; k++) {
                        result.push(core[cIdx++]);
                    }
                    if (pIdx < plus.length) {
                        result.push(plus[pIdx++]);
                    }
                }
                return result;
            }

            // 3. Aplica o interleaving por área dentro de cada grupo geográfico
            const interleavedNational = interleaveCorePlus(rawJobs.filter(j => !j.is_international));
            const interleavedIntl = interleaveCorePlus(rawJobs.filter(j => j.is_international));
            
            // 4. Interleaving final Geográfico: 3 Nacionais para 1 Internacional
            const interleaved = [];
            let nIdx = 0, iIdx = 0;
            while (nIdx < interleavedNational.length || iIdx < interleavedIntl.length) {
                // A cada 3 vagas nacionais...
                for (let k = 0; k < 3 && nIdx < interleavedNational.length; k++) {
                    interleaved.push(interleavedNational[nIdx++]);
                }
                // ...injetamos 1 vaga internacional
                if (iIdx < interleavedIntl.length) {
                    interleaved.push(interleavedIntl[iIdx++]);
                }
            }
            
            allJobsCache = interleaved;
            applyFilters(); // Renders initially without any active filters
            injectJobSchema(interleaved);

        } catch (err) {
            console.error('Error fetching jobs:', err);
            loadingIndicator.innerHTML = '<p style="color:red;">Não foi possível carregar as vagas.</p>';
        }
    }

    fetchJobs();
}
