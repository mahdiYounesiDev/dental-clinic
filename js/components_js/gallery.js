document.addEventListener('DOMContentLoaded', () => {
    // Gallery Data Source
    const galleryData = [
        {
            id: 1,
            title: 'ترمیم کامل خط لبخند',
            desc: 'اصلاح ناهماهنگی و فرم دندان‌ها با تکنیک کامپوزیت ونیر.',
            beforeImg: '../../assets/images/b1.jpg',
            afterImg: '../../assets/images/a1.jpg'
        },
        {
            id: 2,
            title: 'بلیچینگ و سفیدکردن',
            desc: 'رفع تیرگی و زردی دندان‌ها تنها در یک جلسه با لیزر.',
            beforeImg: '../../assets/images/b2.jpg',
            afterImg: '../../assets/images/a2.jpg'
        },
        {
            id: 3,
            title: 'ایمپلنت تخصصی',
            desc: 'جایگزینی دندان از دست رفته بدون آسیب به دندان‌های مجاور.',
            beforeImg: '../../assets/images/b3.jpg',
            afterImg: '../../assets/images/a3.jpg'
        },
        {
            id: 4,
            title: 'لمینت سرامیکی',
            desc: 'اصلاح طرح لبخند به سبک طبیعی با ماندگاری بالا.',
            beforeImg: '../../assets/images/a1.jpg',
            afterImg: '../../assets/images/a4.jpg'
        }
    ];

    const galleryWrapper = document.getElementById('js-gallery-wrapper');

    // Dynamic Slide Renderer
    function renderGallery(items) {
        if (!galleryWrapper) return;

        galleryWrapper.innerHTML = items.map(item => `
            <div class="swiper-slide">
                <article class="c-gallery-card">
                    <figure class="c-gallery-card__figure">
                        <div class="c-gallery-card__img-box">
                            <img class="c-gallery-card__img" src="${item.beforeImg}" alt="قبل از درمان ${item.title}" loading="lazy" decoding="async" draggable="false">
                            <span class="c-gallery-card__label">قبل</span>
                        </div>
                        <div class="c-gallery-card__img-box">
                            <img class="c-gallery-card__img" src="${item.afterImg}" alt="بعد از درمان ${item.title}" loading="lazy" decoding="async" draggable="false">
                            <span class="c-gallery-card__label">بعد</span>
                        </div>
                    </figure>
                    <div class="c-gallery-card__content">
                        <h3 class="c-gallery-card__title">${item.title}</h3>
                        <p class="c-gallery-card__desc">${item.desc}</p>
                        <div class="c-gallery-card__footer">
                            <span class="c-gallery-card__tag">LumiDent Clinic</span>
                        </div>
                    </div>
                </article>
            </div>
        `).join('');
    }

    renderGallery(galleryData);

    // Optimized Swiper Initialization
    if (typeof Swiper !== 'undefined') {
        new Swiper('.js-gallery-slider', {
            slidesPerView: 1.15,
            spaceBetween: 16,
            loop: false,
            grabCursor: true,
            speed: 400,

            // Fix drag/drop freeze issues
            threshold: 8, // حداقل ۸ پیکسل جابجایی برای تشخیص درگ
            touchEventsTarget: 'container',
            preventClicks: true,
            preventClicksPropagation: true,
            simulateTouch: true,
            shortSwipes: true,
            longSwipes: true,
            followFinger: true,

            navigation: {
                nextEl: '.js-gallery-next',
                prevEl: '.js-gallery-prev'
            },
            pagination: {
                el: '.c-gallery__pagination',
                clickable: true
            },
            breakpoints: {
                576: { slidesPerView: 1.8, spaceBetween: 20 },
                768: { slidesPerView: 2.3, spaceBetween: 24 },
                1024: { slidesPerView: 3, spaceBetween: 28 }
            }
        });
    }
});
