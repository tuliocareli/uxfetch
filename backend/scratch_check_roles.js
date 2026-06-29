const supabase = require('./utils/supabase');
require('dotenv').config();

async function checkRoles() {
    const { data, error } = await supabase.rpc('get_distinct_roles');
    // since we might not have that RPC, let's just fetch some subscribers
    const { data: subs, error: subError } = await supabase.from('subscribers').select('preferred_roles').not('preferred_roles', 'is', null).limit(100);
    
    if (subs) {
        const roles = new Set();
        subs.forEach(s => s.preferred_roles.forEach(r => roles.add(r)));
        console.log('Distinct roles in DB:', Array.from(roles));
    }
}
checkRoles();
