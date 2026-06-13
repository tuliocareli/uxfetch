const https = require('https');

https.get('https://remotive.com/api/remote-jobs?category=design', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            const jobs = parsedData.jobs || [];
            console.log(`Total design jobs found: ${jobs.length}`);
            
            // Checking for locations that usually include Brazil
            const allowedLocations = ["worldwide", "brazil", "americas", "latin america", "global"];
            
            const matchingJobs = jobs.filter(job => {
                if (!job.candidate_required_location) return false;
                const loc = job.candidate_required_location.toLowerCase();
                return allowedLocations.some(allowed => loc.includes(allowed));
            });
            
            console.log(`Jobs matching 'Worldwide', 'Brazil', 'Americas', 'Latin America', 'Global': ${matchingJobs.length}`);
            
            matchingJobs.slice(0, 10).forEach(job => {
                console.log(`\n- Title: ${job.title}`);
                console.log(`  Company: ${job.company_name}`);
                console.log(`  Location: ${job.candidate_required_location}`);
                console.log(`  Job Type: ${job.job_type}`);
                console.log(`  URL: ${job.url}`);
            });
            
            if (matchingJobs.length > 10) {
                console.log(`\n...and ${matchingJobs.length - 10} more.`);
            }
        } catch (e) {
            console.error('Error parsing JSON', e);
        }
    });
}).on('error', err => {
    console.error('Error fetching data:', err.message);
});
