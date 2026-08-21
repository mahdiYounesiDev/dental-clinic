/* ==================== Stats Animated Counter ==================== */

document.addEventListener('DOMContentLoaded', () => {
    const statNumbers = document.querySelectorAll('.c-stats__number');
    let hasAnimated = false;

    const animateNumbers = () => {
        statNumbers.forEach(num => {
            const target = +num.getAttribute('data-target');
            const duration = 1500; // میلی ثانیه
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    num.textContent = target;
                    clearInterval(timer);
                } else {
                    num.textContent = Math.ceil(current);
                }
            }, stepTime);
        });
    };

    // اجرای انیمیشن فقط زمانی که بخش آمار در دید کاربر قرار گیرد
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                animateNumbers();
                hasAnimated = true;
            }
        }, { threshold: 0.4 });

        observer.observe(statsSection);
    }
});
