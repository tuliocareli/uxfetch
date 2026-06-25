const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'scrapers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

// Palavras para remover do excludeKeywords
const toRemove = [
    "'gráfico'", "'grafico'", "'graphic'", "'motion'", "'video'", "'vídeo'", "'audiovisual'", "'3d'", "'marketing'", "'social media'"
];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove as palavras do array de exclusão, ignorando vírgulas extras
    toRemove.forEach(word => {
        // Ex: 'gráfico', ou 'gráfico'
        const regex1 = new RegExp(word + '\\s*,?', 'g');
        content = content.replace(regex1, '');
    });

    // Remove vírgulas presas ou duplas que podem ter sobrado no array
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/\[\s*,/g, '[');
    content = content.replace(/,\s*\]/g, ']');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated excludes in ${file}`);
});
