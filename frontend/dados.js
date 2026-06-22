let chartWorkMode, chartSeniority, chartIntl, chartCadencia;

document.addEventListener('DOMContentLoaded', () => {
    const periodFilter = document.getElementById('periodFilter');
    if (!periodFilter) return;

    // Gerar meses a partir de Junho de 2025
    const startYear = 2025;
    const startMonth = 5; // Junho (0-indexed)
    const currentDate = new Date();
    let currY = currentDate.getFullYear();
    let currM = currentDate.getMonth();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    let tempY = currY;
    let tempM = currM;
    while (tempY > startYear || (tempY === startYear && tempM >= startMonth)) {
        const value = `${tempY}-${String(tempM + 1).padStart(2, '0')}`;
        const text = `${monthNames[tempM]} ${tempY}`;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        periodFilter.appendChild(option);
        
        tempM--;
        if (tempM < 0) { tempM = 11; tempY--; }
    }

    periodFilter.addEventListener('change', () => {
        loadDashboardData(periodFilter.value);
    });

    loadDashboardData('last30');
});

async function loadDashboardData(period) {
    const loadingEl = document.getElementById('loadingData');
    const dashboardEl = document.getElementById('dashboard-content');
    
    if (!loadingEl || !dashboardEl) return;

    loadingEl.style.display = 'flex';
    dashboardEl.style.display = 'none';

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
        let query = supabase.from('jobs').select('*');

        if (period === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query = query.gte('created_at', thirtyDaysAgo.toISOString());
        } else {
            // period format is "YYYY-MM"
            const [year, month] = period.split('-');
            const startDate = new Date(year, parseInt(month) - 1, 1);
            const endDate = new Date(year, parseInt(month), 0, 23, 59, 59); // Last day of month
            
            query = query
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
        }

        const { data: jobs, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;

        loadingEl.style.display = 'none';
        dashboardEl.style.display = 'grid';

        processAndRenderCharts(jobs || [], period);

    } catch (err) {
        console.error('Error fetching data:', err);
        loadingEl.innerHTML = '<p style="color:red;">Não foi possível carregar os dados no momento.</p>';
    }
}

function processAndRenderCharts(jobs, period) {
    document.getElementById('totalJobs').textContent = jobs.length;

    // Destruir gráficos anteriores
    if (chartWorkMode) chartWorkMode.destroy();
    if (chartSeniority) chartSeniority.destroy();
    if (chartIntl) chartIntl.destroy();
    if (chartCadencia) chartCadencia.destroy();

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
    chartWorkMode = new Chart(ctxWorkMode, {
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
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
            cutout: '70%'
        }
    });

    // --- 2. Agregação: Senioridade (Regex) ---
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
    chartSeniority = new Chart(ctxSeniority, {
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
            plugins: { legend: { display: false } },
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
    chartIntl = new Chart(ctxIntl, {
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
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
            cutout: '70%'
        }
    });

    // --- 4. Agregação: Cadência ---
    const dateCounts = {};
    let labelsCadencia = [];
    let dataCadencia = [];

    if (period === 'last30') {
        // Last 14 days logic
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            labelsCadencia.push({ raw: dateStr, display: displayStr });
            dateCounts[dateStr] = 0;
        }
    } else {
        // Entire month logic
        const [year, month] = period.split('-');
        const daysInMonth = new Date(year, parseInt(month), 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, parseInt(month) - 1, i);
            const dateStr = d.toISOString().split('T')[0];
            const displayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            labelsCadencia.push({ raw: dateStr, display: displayStr });
            dateCounts[dateStr] = 0;
        }
    }

    jobs.forEach(job => {
        if (job.created_at) {
            const dateStr = job.created_at.split('T')[0];
            if (dateCounts[dateStr] !== undefined) {
                dateCounts[dateStr]++;
            }
        }
    });

    const finalLabels = labelsCadencia.map(d => d.display);
    const finalData = labelsCadencia.map(d => dateCounts[d.raw]);

    const ctxCadencia = document.getElementById('cadenciaChart').getContext('2d');
    let gradient = ctxCadencia.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 85, 255, 0.2)');   
    gradient.addColorStop(1, 'rgba(0, 85, 255, 0)');

    chartCadencia = new Chart(ctxCadencia, {
        type: 'line',
        data: {
            labels: finalLabels,
            datasets: [{
                label: 'Novas Vagas',
                data: finalData,
                borderColor: '#0055ff',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0055ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { size: 13, family: "'Space Grotesk', sans-serif" }, bodyFont: { size: 14, weight: 'bold', family: "'Space Grotesk', sans-serif" }, displayColors: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 15 } }
            },
            interaction: { intersect: false, mode: 'index' },
        }
    });
}
