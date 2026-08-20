/* ==================== Footer Interactive Features ==================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Scroll Progress & Back to Top Logic
    const backToTopBtn = document.getElementById('js-back-to-top');
    const progressPath = backToTopBtn ? backToTopBtn.querySelector('.c-footer__progress-circle path') : null;

    if (progressPath) {
        const pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
        progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';

        const updateProgress = () => {
            const scroll = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progress = pathLength - (scroll * pathLength / height);
            progressPath.style.strokeDashoffset = progress;
        };

        window.addEventListener('scroll', updateProgress);
        updateProgress();
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 2. Real-time Clinic Working Hours Indicator
    const statusTextEl = document.getElementById('js-clinic-status-text');
    const statusDotEl = document.querySelector('.c-footer__status-dot');

    function checkClinicStatus() {
        if (!statusTextEl || !statusDotEl) return;

        const now = new Date();
        const hour = now.getHours();

        // Clinic Open Hours: 09:00 to 20:00
        if (hour >= 9 && hour < 20) {
            statusTextEl.textContent = 'کلینیک فعال است';
            statusDotEl.style.background = '#10b981';
            statusDotEl.style.boxShadow = '0 0 10px #10b981';
        } else {
            statusTextEl.textContent = 'کلینیک تعطیل است (پذیرش فردا)';
            statusDotEl.style.background = '#ef4444';
            statusDotEl.style.boxShadow = '0 0 10px #ef4444';
        }
    }

    checkClinicStatus();
});
