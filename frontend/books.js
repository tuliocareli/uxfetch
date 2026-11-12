document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('uxf-books-container');
    if (!container) return;

    const carousel = document.getElementById('uxfCarousel');
    const prevBtn = document.getElementById('uxfPrev');
    const nextBtn = document.getElementById('uxfNext');
    const pagination = document.getElementById('uxfPagination');
    
    if(carousel && prevBtn && nextBtn) {
        // Embaralha a ordem dos livros usando CSS order (muito mais performático, 0 CLS e 0 TBT)
        const cards = Array.from(carousel.querySelectorAll('.uxf-card'));
        cards.forEach(card => {
            card.style.order = Math.floor(Math.random() * 100);
        });

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
