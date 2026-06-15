const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'scrapers');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.js'));

const newTerms = ["'design research'", "'design system'", "'ux researcher'", "'ux research'"];

for (const file of files) {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find the queries array declaration like: const queries = ['ux', 'product design'];
    // We can use a regex to find an array of strings assigned to 'queries'
    const queryRegex = /(const|let)\s+queries\s*=\s*\[([^\]]+)\]/g;
    
    let modified = false;
    content = content.replace(queryRegex, (match, p1, p2) => {
        // p2 is the content inside the brackets
        const existingTerms = p2.split(',').map(s => s.trim());
        const termsToAdd = newTerms.filter(t => !existingTerms.includes(t) && !existingTerms.includes(t.replace(/'/g, '"')));
        
        if (termsToAdd.length > 0) {
            modified = true;
            return `${p1} queries = [${p2}, ${termsToAdd.join(', ')}]`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${file}`);
    } else {
        console.log(`No changes needed or queries not found: ${file}`);
    }
}
