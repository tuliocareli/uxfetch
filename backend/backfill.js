const supabase = require('./utils/supabase');

async function run() {
    const { data, error } = await supabase.from('email_events').select('*');
    if (error) {
        console.error('Erro ao buscar', error);
        return;
    }
    
    const events = data || [];
    const uniqueOpens = new Set(events.filter(e => e.event_type === 'email.opened').map(e => e.email)).size;
    const uniqueClicks = new Set(events.filter(e => e.event_type === 'email.clicked').map(e => e.email)).size;
    const deliveries = events.filter(e => e.event_type === 'email.delivered').length;
    const bounces = events.filter(e => e.event_type === 'email.bounced').length;
    
    const opensToAdd = Math.max(0, 254 - uniqueOpens);
    const clicksToAdd = Math.max(0, 63 - uniqueClicks);
    const deliveriesToAdd = Math.max(0, 709 - deliveries);
    const bouncesToAdd = Math.max(0, 2 - bounces);
    
    console.log(`Faltam: Opens=${opensToAdd}, Clicks=${clicksToAdd}, Deliveries=${deliveriesToAdd}, Bounces=${bouncesToAdd}`);
    
    const rows = [];
    
    // Assegura que usamos o mesmo email "dummy" para entregas, aberturas e cliques,
    // de modo que o DISTINCT funcione perfeitamente sem inflar os números.
    
    for (let i = 1; i <= deliveriesToAdd; i++) {
        rows.push({ email: `historico_resend_${i}@dummy.com`, event_type: 'email.delivered' });
    }
    
    for (let i = 1; i <= opensToAdd; i++) {
        rows.push({ email: `historico_resend_${i}@dummy.com`, event_type: 'email.opened' });
    }
    
    for (let i = 1; i <= clicksToAdd; i++) {
        rows.push({ email: `historico_resend_${i}@dummy.com`, event_type: 'email.clicked' });
    }
    
    for (let i = 1; i <= bouncesToAdd; i++) {
        rows.push({ email: `bounce_${i}@dummy.com`, event_type: 'email.bounced' });
    }
    
    if (rows.length === 0) {
        console.log('Nada a adicionar.');
        return;
    }

    // Insert in batches of 200
    for (let i = 0; i < rows.length; i += 200) {
        const batch = rows.slice(i, i + 200);
        const { error: insError } = await supabase.from('email_events').insert(batch);
        if (insError) {
            console.error('Erro no insert:', insError);
        } else {
            console.log(`Inserido lote de ${i} a ${i + batch.length}`);
        }
    }
    console.log('Backfill completo!');
}
run();
