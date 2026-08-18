document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.querySelector('.c-hero__video');
    const heroCard = document.querySelector('.c-hero-card');
    const heroSupport = document.querySelector('.c-hero__support');
    const scrollBtn = document.getElementById('js-scroll-btn');

    /* Smooth scroll for scroll-down button */
    if (scrollBtn) {
        scrollBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        });
    }

    /* Advanced Multi-layer Parallax on Scroll */
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const heroHeight = window.innerHeight;

                if (scrolled <= heroHeight) {
                    /* Layer 1: Background Video (moves slower) */
                    if (heroVideo) {
                        heroVideo.style.transform = `translate3d(0, ${scrolled * 0.4}px, 0)`;
                    }

                    /* Layer 2: Hero Glass Card (moves upward faster with scale/fade out) */
                    if (heroCard) {
                        const progress = scrolled / heroHeight;
                        const translateY = scrolled * -0.25;
                        const scale = 1 - (progress * 0.08);
                        const opacity = 1 - (progress * 1.2);

                        heroCard.style.transform = `translate3d(0, ${translateY}px, 0) scale(${Math.max(scale, 0.9)})`;
                        heroCard.style.opacity = Math.max(opacity, 0);
                    }

                    /* Layer 3: Support Button (moves sideways & fades out) */
                    if (heroSupport) {
                        const progress = scrolled / heroHeight;
                        const translateX = scrolled * 0.3;
                        const opacity = 1 - (progress * 1.5);

                        heroSupport.style.transform = `translate3d(${translateX}px, 0, 0)`;
                        heroSupport.style.opacity = Math.max(opacity, 0);
                    }
                }

                ticking = false;
            });

            ticking = true;
        }
    });
});
