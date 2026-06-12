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
        let finalCityString = '';
        if (stateSelect && citySelect) {
            finalCityString = `${citySelect.value} - ${stateSelect.value}`;
        }

        const payload = {
            email: document.getElementById('email').value,
            city: finalCityString,
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
if (window.location.pathname.includes('vagas.html')) {
    const jobsGrid = document.getElementById('jobsGrid');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Filters DOM
    const filterPills = document.querySelectorAll('.filter-pill');
    const stateSelect = document.getElementById('vagas-state');
    const citySelect = document.getElementById('vagas-city');

    let allJobsCache = [];
    let activeWorkModels = new Set(); // 'remoto', 'hibrido', 'presencial'

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
            pill.classList.toggle('active');
            const filterType = pill.getAttribute('data-filter');
            
            if (activeWorkModels.has(filterType)) {
                activeWorkModels.delete(filterType);
            } else {
                activeWorkModels.add(filterType);
            }
            applyFilters();
        });
    });

    function applyFilters() {
        let filtered = [...allJobsCache];

        // 1. Filter by Work Model (Pills)
        if (activeWorkModels.size > 0) {
            filtered = filtered.filter(job => {
                const isRemote = job.is_remote;
                const locLower = (job.location || '').toLowerCase();
                
                let matchesRemoto = false;
                let matchesHibrido = false;
                let matchesPresencial = false;

                if (isRemote || locLower.includes('remoto')) {
                    matchesRemoto = true;
                }
                if (locLower.includes('híbrido') || locLower.includes('hibrido')) {
                    matchesHibrido = true;
                }
                if (!matchesRemoto && !matchesHibrido) {
                    matchesPresencial = true;
                }

                if (activeWorkModels.has('remoto') && matchesRemoto) return true;
                if (activeWorkModels.has('hibrido') && matchesHibrido) return true;
                if (activeWorkModels.has('presencial') && matchesPresencial) return true;

                return false;
            });
        }

        // 2. Filter by Location (IBGE)
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

        // Prev Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
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

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
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

            const isRemoteBadge = job.is_remote ? '<span class="job-badge">REMOTA</span>' : '<span class="job-badge" style="background:#f4f4f5; color:#71717A;">PRESENCIAL/HÍBRIDO</span>';
            
            let sourceBadge = '';
            if(job.source) {
                sourceBadge = `<span class="job-badge" style="background:#e0f2fe; color:#0369a1;">${job.source}</span>`;
            }

            let dateStr = '';
            if(job.created_at) {
                const dateObj = new Date(job.created_at);
                dateStr = dateObj.toLocaleDateString('pt-BR');
            }

            card.innerHTML = `
                <div class="job-badges">
                    ${isRemoteBadge}
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
            allJobsCache = jobs || [];
            applyFilters(); // Renders initially without any active filters

        } catch (err) {
            console.error('Error fetching jobs:', err);
            loadingIndicator.innerHTML = '<p style="color:red;">Não foi possível carregar as vagas.</p>';
        }
    }

    fetchJobs();
}
