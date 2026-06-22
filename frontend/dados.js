document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loadingData');
    const dashboardEl = document.getElementById('dashboard-content');
    
    if (!loadingEl || !dashboardEl) return;

    let supabase;
    try {
        const SUPABASE_URL = 'https://wxogmhruwhjvhhgmfvrr.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_YP0GmSgpgugyAnjan6I3bQ_Gaf4CSGI';
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
        loadingEl.innerHTML = '<p style="color:red;">Erro ao conectar com o banco de dados.</p>';
        return;
    }

    try {
        // Fetch last 30 days of jobs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Hide loading, show dashboard
        loadingEl.style.display = 'none';
        dashboardEl.style.display = 'grid';

        processAndRenderCharts(jobs || []);

    } catch (err) {
        console.error('Error fetching data:', err);
        loadingEl.innerHTML = '<p style="color:red;">Não foi possível carregar os dados no momento.</p>';
    }
});

function processAndRenderCharts(jobs) {
    document.getElementById('totalJobs').textContent = jobs.length;

    // --- 1. Agregação: Modelo de Trabalho ---
    let countRemote = 0;
    let countHybrid = 0;
    let countInPerson = 0;

    jobs.forEach(job => {
        if (job.work_mode === 'remote' || (job.is_remote && !job.work_mode) || (job.is_international && !job.work_mode)) {
            countRemote++;
        } else if (job.work_mode === 'hybrid') {
            countHybrid++;
        } else {
            countInPerson++;
        }
    });

    const ctxWorkMode = document.getElementById('workModeChart').getContext('2d');
    new Chart(ctxWorkMode, {
        type: 'doughnut',
        data: {
            labels: ['Remoto', 'Híbrido', 'Presencial'],
            datasets: [{
                data: [countRemote, countHybrid, countInPerson],
                backgroundColor: ['#0055ff', '#7c3aed', '#71717A'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });


    // --- 2. Agregação: Senioridade (Regex Estimation) ---
    let countJunior = 0;
    let countPleno = 0;
    let countSenior = 0;

    jobs.forEach(job => {
        const t = job.title.toLowerCase();
        if (/\b(est[áa]gio|trainee|j[úu]nior|junior|jr\.?)\b/i.test(t)) {
            countJunior++;
        } else if (/\b(pleno|pl\.?|mid[\s-]?level)\b/i.test(t)) {
            countPleno++;
        } else if (/\b(s[êe]nior|senior|sr\.?|lead|head|staff|principal|especialista|manager|diretor)\b/i.test(t)) {
            countSenior++;
        }
    });

    const ctxSeniority = document.getElementById('seniorityChart').getContext('2d');
    new Chart(ctxSeniority, {
        type: 'bar',
        data: {
            labels: ['Estágio/Jr', 'Pleno', 'Sênior+'],
            datasets: [{
                label: 'Vagas',
                data: [countJunior, countPleno, countSenior],
                backgroundColor: ['#93c5fd', '#3b82f6', '#1d4ed8'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            }
        }
    });

    // --- 3. Agregação: Nacional vs Internacional ---
    let countNacional = 0;
    let countIntl = 0;

    jobs.forEach(job => {
        if (job.is_international) countIntl++;
        else countNacional++;
    });

    const ctxIntl = document.getElementById('intlChart').getContext('2d');
    new Chart(ctxIntl, {
        type: 'doughnut',
        data: {
            labels: ['Brasil', 'Internacional'],
            datasets: [{
                data: [countNacional, countIntl],
                backgroundColor: ['#10b981', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });

    // --- 4. Agregação: Cadência (Vagas por Dia) ---
    // Group jobs by date
    const dateCounts = {};
    
    // Create an array of the last 14 days to ensure zero-days are shown
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const displayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        last14Days.push({ raw: dateStr, display: displayStr });
        dateCounts[dateStr] = 0;
    }

    jobs.forEach(job => {
        if (job.created_at) {
            const dateStr = job.created_at.split('T')[0];
            if (dateCounts[dateStr] !== undefined) {
                dateCounts[dateStr]++;
            }
        }
    });

    const labelsCadencia = last14Days.map(d => d.display);
    const dataCadencia = last14Days.map(d => dateCounts[d.raw]);

    const ctxCadencia = document.getElementById('cadenciaChart').getContext('2d');
    
    // Create gradient
    let gradient = ctxCadencia.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 85, 255, 0.2)');   
    gradient.addColorStop(1, 'rgba(0, 85, 255, 0)');

    new Chart(ctxCadencia, {
        type: 'line',
        data: {
            labels: labelsCadencia,
            datasets: [{
                label: 'Novas Vagas',
                data: dataCadencia,
                borderColor: '#0055ff',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0055ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 13, family: "'Space Grotesk', sans-serif" },
                    bodyFont: { size: 14, weight: 'bold', family: "'Space Grotesk', sans-serif" },
                    displayColors: false
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}
