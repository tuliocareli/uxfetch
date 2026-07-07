require('dotenv').config();
const supabase = require('./utils/supabase');

async function main() {
  const { data: jobs, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  const inhireJobsByUrl = jobs.filter(j => j.url && j.url.toLowerCase().includes('inhire'));
  
  console.log(`Total vagas com inhire na URL: ${inhireJobsByUrl.length}`);
  
  const sources = {};
  for(const j of inhireJobsByUrl) {
     const s = j.source || 'Unknown';
     sources[s] = (sources[s] || 0) + 1;
  }
  
  console.log('Fontes das vagas do inhire (por URL):', sources);

  const inhireJobsBySource = jobs.filter(j => j.source && j.source.toLowerCase().includes('inhire'));
  console.log(`Total vagas com inhire no Source: ${inhireJobsBySource.length}`);

}
main();
