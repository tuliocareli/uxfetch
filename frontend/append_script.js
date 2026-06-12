const fs = require('fs');

const codeToAppend = `

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

    async function fetchJobs() {
        if (!window.supabase) {
            console.error('Supabase client is not loaded');
            loadingIndicator.innerHTML = '<p style="color:red;">Erro ao carregar o banco de dados.</p>';
            return;
        }

        try {
            // Usa as variaveis já instanciadas no block principal do script.js
            const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
            const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
            const localSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Calcula a data de 30 dias atrás para filtrar (segurança dupla caso o backend atrase o cleanup)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: jobs, error } = await localSupabase
                .from('jobs')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            loadingIndicator.style.display = 'none';
            jobsGrid.style.display = 'grid';

            if (!jobs || jobs.length === 0) {
                jobsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #718096;">Nenhuma vaga encontrada no radar no momento.</p>';
                return;
            }

            jobs.forEach(job => {
                const card = document.createElement('div');
                card.className = 'job-card';

                const isRemoteBadge = job.is_remote ? '<span class="job-badge">REMOTA</span>' : '<span class="job-badge" style="background:#f4f4f5; color:#71717A;">PRESENCIAL/HÍBRIDO</span>';
                
                let sourceBadge = '';
                if(job.source) {
                    sourceBadge = \`<span class="job-badge" style="background:#e0f2fe; color:#0369a1;">\${job.source}</span>\`;
                }

                // Format date safely
                let dateStr = '';
                if(job.created_at) {
                    const dateObj = new Date(job.created_at);
                    dateStr = dateObj.toLocaleDateString('pt-BR');
                }

                card.innerHTML = \`
                    <div class="job-badges">
                        \${isRemoteBadge}
                        \${sourceBadge}
                    </div>
                    <h3 class="job-title">\${job.title}</h3>
                    <p class="job-company">\${job.company}</p>
                    <div class="job-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        \${job.location}
                    </div>
                    <p class="job-description">\${job.description || 'Vaga encontrada pelo UX Fetch.'}</p>
                    <a href="\${job.url}" target="_blank" rel="noopener noreferrer" class="job-btn">Ver Vaga Completa</a>
                    <div class="job-date">Capturada em \${dateStr}</div>
                \`;

                jobsGrid.appendChild(card);
            });

        } catch (err) {
            console.error('Error fetching jobs:', err);
            loadingIndicator.innerHTML = '<p style="color:red;">Não foi possível carregar as vagas.</p>';
        }
    }

    fetchJobs();
}
`;

fs.appendFileSync('e:/Scraper/frontend/script.js', codeToAppend);
console.log('Appended script logic successfully');
