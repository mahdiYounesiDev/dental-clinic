document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroVideo = document.querySelector('.c-hero__video');
    const heroCard = document.querySelector('.c-hero-card');
    const heroSupport = document.querySelector('.c-hero__support');
    const scrollBtn = document.getElementById('js-scroll-btn');
    const gallerySection = document.getElementById('gallerySection');

    // Smooth Scroll to Gallery
    if (scrollBtn && gallerySection) {
        scrollBtn.addEventListener('click', (e) => {
            e.preventDefault();
            gallerySection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Performance Optimization: Pause Video when Gallery is Visible
    if (heroVideo && gallerySection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.pause();
                } else {
                    heroVideo.play().catch(() => {});
                }
            });
        }, { threshold: 0.2 });

        observer.observe(gallerySection);
    }

    // Scroll Animations (Parallax Effect)
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const heroHeight = window.innerHeight;

                if (scrolled <= heroHeight) {
                    const progress = scrolled / heroHeight;

                    // Video Translate
                    if (heroVideo) {
                        heroVideo.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
                    }

                    // Card Animation
                    if (heroCard) {
                        const translateY = scrolled * -0.15;
                        const opacity = 1 - (progress * 0.7);
                        const scale = 1 - (progress * 0.03);

                        heroCard.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
                        heroCard.style.opacity = Math.max(opacity, 0);
                    }

                    // Support Button Animation
                    if (heroSupport) {
                        const translateX = scrolled * 0.15;
                        const opacity = 1 - progress;

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
