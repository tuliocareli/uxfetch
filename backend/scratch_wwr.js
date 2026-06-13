const https = require('https');

https.get('https://weworkremotely.com/categories/remote-design-jobs.rss', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            // Very naive XML parsing
            const items = data.split('<item>');
            items.shift(); // Remove the header part before the first <item>
            
            console.log(`Total design jobs found in feed: ${items.length}`);
            
            let matchCount = 0;
            const allowedRegions = ["anywhere", "worldwide", "latin america", "americas", "brazil"];
            
            items.forEach((item, index) => {
                const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'Unknown Title';
                
                const regionMatch = item.match(/<region>(.*?)<\/region>/);
                const region = regionMatch ? regionMatch[1] : '';
                
                const companyMatch = item.match(/<title>(.*?):.*?<\/title>/); // usually "Company: Title"
                const company = companyMatch ? companyMatch[1] : 'Unknown Company';
                
                const isMatch = allowedRegions.some(loc => region.toLowerCase().includes(loc) || title.toLowerCase().includes(loc));
                
                if (isMatch) {
                    matchCount++;
                    console.log(`\n- Title: ${title}`);
                    console.log(`  Region: ${region}`);
                }
            });
            
            console.log(`\nJobs matching our region profile: ${matchCount}`);
        } catch (e) {
            console.error('Error parsing XML', e);
        }
    });
}).on('error', err => {
    console.error('Error fetching data:', err.message);
});
