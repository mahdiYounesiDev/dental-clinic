import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const galleryWrapper = document.getElementById('js-gallery-wrapper');

    async function fetchAndRenderGallery() {
        if (!galleryWrapper) return;

        try {
            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                galleryWrapper.innerHTML = '<div class="swiper-slide"><p style="text-align:center; padding: 40px; color:#64748b;">عکسی در گالری موجود نیست.</p></div>';
                return;
            }

            galleryWrapper.innerHTML = data.map(item => {
                const doctorTag = item.doctor_name
                    ? `<span class="c-gallery-card__tag" style="background:#f1f5f9; color:#475569;"><i class="fas fa-user-md" style="margin-left:5px;"></i>${item.doctor_name}</span>`
                    : `<span class="c-gallery-card__tag" style="background:#f1f5f9; color:#475569;">LumiDent Clinic</span>`;

                const hashtagTag = item.hashtag
                    ? `<span class="c-gallery-card__tag" style="background:var(--color-sky); color:var(--color-primary); font-weight:bold;">${item.hashtag}</span>`
                    : '';

                return `
                <div class="swiper-slide">
                    <article class="c-gallery-card">
                        <figure class="c-gallery-card__figure">
                            <div class="c-gallery-card__img-box">
                                <img class="c-gallery-card__img" src="${item.before_image_url}" alt="قبل از درمان ${item.title}" decoding="async" draggable="false">
                                <span class="c-gallery-card__label">قبل</span>
                            </div>
                            <div class="c-gallery-card__img-box">
                                <img class="c-gallery-card__img" src="${item.after_image_url}" alt="بعد از درمان ${item.title}" decoding="async" draggable="false">
                                <span class="c-gallery-card__label">بعد</span>
                            </div>
                        </figure>
                        <div class="c-gallery-card__content">
                            <h3 class="c-gallery-card__title">${item.title}</h3>
                            <div class="c-gallery-card__footer" style="display:flex; flex-wrap:wrap; gap:8px;">
                                ${doctorTag}
                                ${hashtagTag}
                            </div>
                        </div>
                    </article>
                </div>
            `}).join('');

            initSwiper();

        } catch (err) {
            console.error('Error fetching gallery:', err);
        }
    }

    function initSwiper() {
        if (typeof Swiper !== 'undefined') {
            new Swiper('.js-gallery-slider', {
                slidesPerView: 1.15,
                spaceBetween: 16,
                loop: false,
                grabCursor: true,
                speed: 400,
                threshold: 8,
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
    }

    await fetchAndRenderGallery();
});
