const fs = require('fs');
const path = './backend/scrapers';
const files = fs.readdirSync(path);

const oldR = /const includeRegex = \/\\b\(ux\\b\|ui\\b\|product\\s\+design\(er\)\?\|design\\s\+de\\s\+produto\(s\)\?\|designer\\s\+de\\s\+produto\(s\)\?\|design\\s\+ops\|designops\|staff\\s\+design\(er\)\?\|design\\s\+engineer\|ux\\s\+research\(er\)\?\|design\\s\+research\(er\)\?\|user\\s\+experience\|user\\s\+interface\|service\\s\+design\(er\)\?\|lead\\s\+design\(er\)\?\|head\\s\+de\\s\+design\|design\\s\+manager\|diretor\\s\+de\\s\+design\|graphic\\s\+design\(er\)\?\|design\(er\)\?\\s\+gr\[aá\]fico\|visual\\s\+design\(er\)\?\|motion\\s\+design\(er\)\?\|motion\\s\+graphics\|3d\\s\+design\(er\)\?\|ilustrador\(a\)\?\|ux\\s\+writer\|designer\\b\|videomaker\|editor\(a\)\?\\s\+de\\s\+v\[ií\]deo\|audiovisual\|edi\[çc\]\[ãa\]o\\s\+de\\s\+v\[ií\]deo\)\/i;/;

const newR = "const includeRegex = /\\b(ux\\b|ui\\b|product\\s+design(er)?|design\\s+de\\s+produto(s)?|designer\\s+de\\s+produto(s)?|design\\s+ops|designops|staff\\s+design(er)?|design\\s+engineer|ux\\s+research(er)?|design\\s+research(er)?|user\\s+experience|user\\s+interface|service\\s+design(er)?|lead\\s+design(er)?|head\\s+de\\s+design|design\\s+manager|diretor\\s+de\\s+design|diretor\\s+de\\s+arte|graphic\\s+design(er)?|design(er)?\\s+gr[aá]fico|visual\\s+design(er)?|motion\\s+design(er)?|motion\\s+graphics|3d\\s+design(er)?|ilustrador(a)?|ux\\s+writer|designer\\b|videomaker|editor(a)?\\s+de\\s+v[ií]deo|audiovisual|edi[çc][ãa]o\\s+de\\s+v[ií]deo)/i;";

files.forEach(f => {
    if (!f.endsWith('.js')) return;
    const p = path + '/' + f;
    let c = fs.readFileSync(p, 'utf-8');
    if (c.match(oldR)) {
        fs.writeFileSync(p, c.replace(oldR, newR));
        console.log('Updated', f);
    } else {
        console.log('Not found in', f);
    }
});
