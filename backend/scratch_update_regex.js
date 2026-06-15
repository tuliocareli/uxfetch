const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'scrapers');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Atualizar includeRegex para adicionar design\\s+system
    // Existing regex might be like:
    // const includeRegex = /\b(ux\b|ui\b|...|service\s+design(er)?)/i;
    // We want to replace it. Let's just do a string replacement if it contains 'design\\s+ops' but not 'design\\s+system'
    if (content.includes('includeRegex = /\\b(') && !content.includes('design\\s+system')) {
        content = content.replace(/includeRegex = \/\\b\(([^)]+)\)\/i;/, (match, p1) => {
            return `includeRegex = /\\b(${p1}|design\\s+system)/i;`;
        });
        modified = true;
    }

    // 2. Corrigir o script anterior do queries (se tiver as aspas duplas desnecessárias tipo "'design research'" e corrigir para "design research")
    if (content.includes('\'design research\'') || content.includes('"\'design research\'"')) {
        content = content.replace(/'"design research"'/g, "'design research'");
        content = content.replace(/'"design system"'/g, "'design system'");
        content = content.replace(/'"ux researcher"'/g, "'ux researcher'");
        content = content.replace(/'"ux research"'/g, "'ux research'");
        // And fix cases where I added single quotes inside single quotes:
        content = content.replace(/'\'design research\''/g, "'design research'");
        content = content.replace(/'\'design system\''/g, "'design system'");
        content = content.replace(/'\'ux researcher\''/g, "'ux researcher'");
        content = content.replace(/'\'ux research\''/g, "'ux research'");
        modified = true;
    }

    // 3. For Coodesh or Geekhunter that type 'ux', we should also type the others. But since they are complex paginations, 
    // maybe it's enough to just leave the broad 'ux' or add queries loop if needed. 

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Regex/Queries in: ${file}`);
    }
}
