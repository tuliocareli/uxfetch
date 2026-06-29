const t = 'Produtor de Vídeo'.toLowerCase();
const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
console.log('Produtor de Vídeo isUxUiProduct:', isUxUiProduct);
