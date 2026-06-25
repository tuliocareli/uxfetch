require('dotenv').config();
const supabase = require('./utils/supabase');

async function checkSubscribers() {
    console.log('Checking subscribers...');
    const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*');

    if (subscribersError) {
        console.error('Error fetching subscribers:', subscribersError);
        return;
    }

    console.log(`Total subscribers in DB: ${subscribers.length}`);
    const activeSubscribers = subscribers.filter(u => u.active !== false);
    const inactiveSubscribers = subscribers.filter(u => u.active === false);
    console.log(`Active subscribers: ${activeSubscribers.length}`);
    console.log(`Inactive subscribers: ${inactiveSubscribers.length}`);

    if (inactiveSubscribers.length > 0) {
        console.log('\nInactive subscribers:');
        console.table(inactiveSubscribers.map(s => ({ id: s.id, email: s.email, active: s.active })));
    }

    const { data: unsubscribes, error: unsubscribesError } = await supabase
        .from('unsubscribes_feedback')
        .select('*');
        
    if (unsubscribesError) {
        console.error('Error fetching unsubscribes:', unsubscribesError);
    } else {
        console.log(`\nTotal unsubscribe feedback entries: ${unsubscribes.length}`);
        if (unsubscribes.length > 0) {
            console.table(unsubscribes);
        }
    }
}

checkSubscribers().catch(console.error);
