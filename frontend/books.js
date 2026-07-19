const uxfBooksHTML = `
        <section class="container" style="margin-bottom: 60px;">
            <div class="uxf-section">
                <div class="uxf-header">
                    <div class="uxf-header-text">
                        <span class="uxf-tag">Recomendações</span>
                        <h2 class="uxf-title">Biblioteca UXfetch</h2>
                        <p class="uxf-subtitle">Minha curadoria com os livros definitivos para elevar o seu nível no design.</p>
                    </div>
                    
                    <!-- Controls (Top Right) -->
                    <div class="uxf-controls">
                        <span class="uxf-pagination" id="uxfPagination">1 de 6</span>
                        <button class="uxf-control-btn" id="uxfPrev" aria-label="Anterior">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <button class="uxf-control-btn" id="uxfNext" aria-label="Próximo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>

                <div class="uxf-carousel-wrapper">
                    <div class="uxf-carousel" id="uxfCarousel">
                        <!-- Livro Novo 1 -->
                        <a href="https://link.amazon/B011bkdRg" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8539660024.01._SL300_.jpg" alt="UX/UI design: experiências e interfaces do usuário nos processos de design" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">UX/UI design: experiências</h3><p class="uxf-book-desc">"Aspectos Importantes da área"</p></div>
                        </a>
                        <!-- Livro Novo 2 -->
                        <a href="https://link.amazon/B0f7IM1kc" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8566250486.01._SL300_.jpg" alt="Introdução e Boas Práticas em UX Design" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Introdução e Boas Práticas</h3><p class="uxf-book-desc">"Bom livro de introdução para área"</p></div>
                        </a>
                        <!-- Livro Novo 3 -->
                        <a href="https://link.amazon/B0bf6BxzE" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8575223666.01._SL300_.jpg" alt="Design Centrado no Usuário" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Design Centrado no Usuário</h3><p class="uxf-book-desc">"Práticas para projetar com foco"</p></div>
                        </a>
                        <!-- Livro Novo 4 -->
                        <a href="https://link.amazon/B031Maeks" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/6500563859.01._SL300_.jpg" alt="Enviesados" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Enviesados</h3><p class="uxf-book-desc">"Psicologia e Vieses Cognitivos"</p></div>
                        </a>
                        <!-- Livro 1 -->
                        <a href="https://amzn.to/4a9PDDO" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/6555324473.01._SL300_.jpg" alt="O design do dia a dia" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">O design do dia a dia</h3><p class="uxf-book-desc">"A bíblia do design centrado no usuário"</p></div>
                        </a>
                        <!-- Livro 2 -->
                        <a href="https://link.amazon/B0aaaI0Q5" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                            <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                            <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/0321965515.01._SL300_.jpg" alt="Não me faça pensar" width="250" height="250" loading="lazy"></div>
                            <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Não me faça pensar</h3><p class="uxf-book-desc">"Usabilidade sem enrolação"</p></div>
                        </a>
                    <!-- Livro 3 -->
                    <a href="https://amzn.to/4vYL0F0" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8575228331.01._SL300_.jpg" alt="Lean UX" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Lean UX</h3><p class="uxf-book-desc">"Design ágil que entrega resultado"</p></div>
                    </a>
                    <!-- Livro 4 -->
                    <a href="https://amzn.to/4w43nsh" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/B08VJLLFTN.01._SL300_.jpg" alt="Hooked (Engajado)" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Hooked</h3><p class="uxf-book-desc">"Como criar produtos formadores de hábitos"</p></div>
                    </a>
                    <!-- Livro 5 -->
                    <a href="https://amzn.to/4ei1m5H" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/1118766571.01._SL300_.jpg" alt="About Face" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">About Face</h3><p class="uxf-book-desc">"O manual definitivo de interação"</p></div>
                    </a>
                    <!-- Livro 6 -->
                    <a href="https://amzn.to/4oy6q9m" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/6586057655.01._SL300_.jpg" alt="Estratégia de UX" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Estratégia de UX</h3><p class="uxf-book-desc">"Entre Experiência e negócios"</p></div>
                    </a>
                    <!-- Livro 7 -->
                    <a href="https://link.amazon/B0hD9tsdX" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/0307887898.01._SL300_.jpg" alt="A Startup Enxuta" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">A Startup Enxuta</h3><p class="uxf-book-desc">"O ciclo que valida ideias antes de construir demais"</p></div>
                    </a>
                    <!-- Livro 8 -->
                    <a href="https://link.amazon/B0ij2dDmw" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8575228129.01._SL300_.jpg" alt="Redação Estratégica para UX" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Redação Estratégica</h3><p class="uxf-book-desc">"Palavra é interface também"</p></div>
                    </a>
                    <!-- Livro 9 -->
                    <a href="https://link.amazon/B0hCM5AvW" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8551001523.01._SL300_.jpg" alt="Sprint" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Sprint</h3><p class="uxf-book-desc">"Valide ideia em 5 dias, não 5 meses"</p></div>
                    </a>
                    <!-- Livro 10 -->
                    <a href="https://link.amazon/B03ncfDcH" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8550819867.01._SL300_.jpg" alt="Gestão de Produto na Prática" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Gestão de Produto</h3><p class="uxf-book-desc">"O manual que ninguém te dá no 1º dia de PM"</p></div>
                    </a>
                    <!-- Livro 11 -->
                    <a href="https://link.amazon/B0bDbC2Ua" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/B0DT79P2PF.01._SL300_.jpg" alt="Product Design" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Product Design</h3><p class="uxf-book-desc">"Psicologia de produto que vende sem esforço"</p></div>
                    </a>
                    <!-- Livro 12 -->
                    <a href="https://link.amazon/B05Fy51IZ" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/1491904909.01._SL300_.jpg" alt="Mapeamento da história do usuário" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Story Mapping</h3><p class="uxf-book-desc">"Veja o produto inteiro antes de construir telas"</p></div>
                    </a>
                    <!-- Livro 13 -->
                    <a href="https://link.amazon/B09vxtg7C" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/1492079227.01._SL300_.jpg" alt="Articulando Decisões de Design" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Articulando Decisões</h3><p class="uxf-book-desc">"Defenda seu design sem depender de 'eu acho'"</p></div>
                    </a>
                    <!-- Livro 14 -->
                    <a href="https://link.amazon/B04HQzuSr" target="_blank" rel="nofollow sponsored noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/149205531X.01._SL300_.jpg" alt="Leis da Psicologia Aplicadas a UX" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Leis da Psicologia UX</h3><p class="uxf-book-desc">"A ciência de porquê a interface funciona (ou não)"</p></div>
                    </a>
                    <!-- Livro 15 -->
                    <a href="https://link.amazon/B07Td2XmA" target="_blank" rel="noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/B096Y8X2BF.01._SL300_.jpg" alt="Design de Produto: Uma visão Product-Led" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Product-Led Design</h3><p class="uxf-book-desc">"Design que se prova com dado, não só intuição"</p></div>
                    </a>
                    <!-- Livro 16 -->
                    <a href="https://link.amazon/B0cgQjVAC" target="_blank" rel="noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/8575229052.01._SL300_.jpg" alt="UX para Empresas" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">UX para Empresas</h3><p class="uxf-book-desc">"UX que justifica orçamento, não só boa interface"</p></div>
                    </a>
                    <!-- Livro 17 -->
                    <a href="https://link.amazon/B0j4Fd2B6" target="_blank" rel="noopener noreferrer" class="uxf-card" title="Abrir na Amazon">
                        <div class="uxf-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>
                        <div class="uxf-card-img-wrapper"><img class="uxf-card-img" src="https://images-na.ssl-images-amazon.com/images/P/6586057213.01._SL300_.jpg" alt="Storytelling no Design de Produto" width="250" height="250" loading="lazy"></div>
                        <div class="uxf-card-content"><div class="uxf-stars">★★★★★</div><h3 class="uxf-book-title">Storytelling no Design</h3><p class="uxf-book-desc">"Toda boa interface esconde uma história por trás"</p></div>
                    </a>
                </div>
            </div>

            <div class="uxf-disclaimer">
                Como Participante Associados da Amazon, ganho por compras qualificadas. Comprando pelos links acima você apoia o projeto UXfetch a arcar com os custos de hospedagem e envio de e-mails, sem pagar nada a mais por isso.
            </div>
            </div>
        </section>
`;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('uxf-books-container');
    if (!container) return;

    container.innerHTML = uxfBooksHTML;

    const carousel = document.getElementById('uxfCarousel');
    const prevBtn = document.getElementById('uxfPrev');
    const nextBtn = document.getElementById('uxfNext');
    const pagination = document.getElementById('uxfPagination');
    
    if(carousel && prevBtn && nextBtn) {
        // Embaralha a ordem dos livros (Randomize)
        const cards = Array.from(carousel.querySelectorAll('.uxf-card'));
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        cards.forEach(card => carousel.appendChild(card));

        const getScrollAmount = () => {
            const card = carousel.querySelector('.uxf-card');
            if (!card) return 304;
            const style = window.getComputedStyle(carousel);
            const gap = parseInt(style.gap) || 24;
            return card.offsetWidth + gap;
        };

        const updatePagination = () => {
            if (!pagination) return;
            const scrollAmount = getScrollAmount();
            const total = carousel.querySelectorAll('.uxf-card').length;
            if (scrollAmount <= 0) return;
            
            let index = Math.round(carousel.scrollLeft / scrollAmount) + 1;
            if (index > total) index = total;
            if (index < 1) index = 1;
            
            pagination.textContent = `${index} de ${total}`;
        };

        nextBtn.addEventListener('click', () => carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
        prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
        
        carousel.addEventListener('scroll', () => {
            window.requestAnimationFrame(updatePagination);
        });
        
        // Initialize pagination
        updatePagination();
    }
});
