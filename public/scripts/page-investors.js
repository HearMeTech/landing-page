// public/scripts/page-investors.js

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('deck-slider');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');

    if (!slider || !prevBtn || !nextBtn) return;

    const getScrollAmount = () => {
        const firstCard = slider.querySelector('.snap-start');
        if (!firstCard) return slider.clientWidth * 0.8; 
        return firstCard.offsetWidth + 24; 
    };

    function updateArrows() {
        const scrollLeft = Math.ceil(slider.scrollLeft);
        const maxScroll = Math.floor(slider.scrollWidth - slider.clientWidth);
        
        prevBtn.disabled = scrollLeft <= 0;
        nextBtn.disabled = scrollLeft >= maxScroll - 2;
    }

    prevBtn.addEventListener('click', () => {
        const currentPos = Math.round(slider.scrollLeft);
        slider.scrollTo({ left: currentPos - getScrollAmount(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        const currentPos = Math.round(slider.scrollLeft);
        slider.scrollTo({ left: currentPos + getScrollAmount(), behavior: 'smooth' });
    });

    slider.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    updateArrows();
});
