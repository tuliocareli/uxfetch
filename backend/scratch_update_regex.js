const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'scrapers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

const newRegex = "const includeRegex = /\\b(ux\\b|ui\\b|product\\s+design(er)?|design\\s+de\\s+produto(s)?|designer\\s+de\\s+produto(s)?|design\\s+ops|designops|staff\\s+design(er)?|design\\s+engineer|ux\\s+research(er)?|design\\s+research(er)?|user\\s+experience|user\\s+interface|service\\s+design(er)?|lead\\s+design(er)?|head\\s+de\\s+design|design\\s+manager|diretor\\s+de\\s+design|graphic\\s+design(er)?|design(er)?\\s+gr[aá]fico|visual\\s+design(er)?|motion\\s+design(er)?|3d\\s+design(er)?|ilustrador(a)?|ux\\s+writer|designer\\b)/i;";

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace includeRegex
    content = content.replace(/const includeRegex = \/\\b\(ux\\b\|ui\\b.*?\)\/i;?/g, newRegex);
    content = content.replace(/const includeRegex = \/\\b\(ux\\b\|ui\\b.*?\)\\b\/i;?/g, newRegex); // for ilegra.js

    // Replace queries array to append new areas
    // Example: const queries = ['product design', 'ux', 'ui'];
    // We want to add 'graphic design', 'motion design', '3d', 'ux writer' if not present
    if (content.includes('const queries = [')) {
        content = content.replace(/(const queries = \[[^\]]+)\];?/g, (match, p1) => {
            if (!p1.includes('graphic design')) {
                return p1 + ", 'graphic design', 'motion design', '3d', 'ux writer', 'head de design'];";
            }
            return match;
        });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
