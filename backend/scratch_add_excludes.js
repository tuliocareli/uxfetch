const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'scrapers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

const newWords = "'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'";

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Procura o final do array excludeKeywords (geralmente termina com ] ou ];)
    content = content.replace(/(const excludeKeywords = \[[\s\S]*?)\];?/, `$1, ${newWords}\n        ];`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added negative filters to ${file}`);
});
