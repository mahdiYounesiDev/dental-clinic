/* ==================== Advanced Dental Services Data ==================== */

const dentalServices = [
    {
        id: '01',
        title: 'ایمپلنت تخصصی دندان',
        desc: 'جایگزینی دائمی دندان‌های از دست رفته با فکسچر‌های تیتانیومی و روکش‌های سرامیکی سه بعدی با ظاهری ۱۰۰٪ طبیعی.',
        // Dedicated Dental Implant Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 6 4 6 7c0 2.5 1.5 4.5 3 6v2h6v-2c1.5-1.5 3-3.5 3-6 0-3-2-5-6-5z"/><path d="M9 15v2m6-2v2m-6 2v2m6-2v2m-4.5 1v2"/></svg>`,
        link: '#'
    },
    {
        id: '02',
        title: 'طراحی تخصصی لبخند',
        desc: 'اصلاح فرم، رنگ و ناهماهنگی دندان‌ها با لمینت سرامیکی و کامپوزیت ونیر مطابق با استاندارد زیباشناسی چهره.',
        // Dedicated Smile / Aesthetics Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M8 13c1 2.5 3.5 3.5 4 3.5s3-.8 4-3.5"/><circle cx="9" cy="9" r="1.25" fill="currentColor"/><circle cx="15" cy="9" r="1.25" fill="currentColor"/></svg>`,
        link: '#'
    },
    {
        id: '03',
        title: 'ارتودنسی و تراز دندان',
        desc: 'مرتب‌سازی تخصصی دندان‌های نامنظم با سیستم‌های مرئی و الاینرهای نامرئی شفاف بدون محدودیت سنی.',
        // Dedicated Orthodontics / Align Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 18h16"/><rect x="7" y="4" width="3" height="4" rx="1"/><rect x="14" y="4" width="3" height="4" rx="1"/><rect x="7" y="16" width="3" height="4" rx="1"/><rect x="14" y="16" width="3" height="4" rx="1"/><path d="M8.5 8v8m7-8v8"/></svg>`,
        link: '#'
    },
    {
        id: '04',
        title: 'درمان ریشه (عصب‌کشی)',
        desc: 'پاک‌سازی کامل کانال‌های عفونی ریشه تحت میکروسکوپ و تجهیزات روتاری دیجیتال بدون احساس کوچک‌ترین درد.',
        // Dedicated Tooth Root / Endodontics Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 2 7 3.5 7 6.5c0 3 1.5 5 2 8s.5 7.5 3 7.5 2.5-4.5 3-7.5 2-5 2-8S15 2 12 2z"/><path d="M12 6v6m0 4v2"/></svg>`,
        link: '#'
    },
    {
        id: '05',
        title: 'بلیچینگ و سفیدکنندگی',
        desc: 'برطرف کردن عمیق‌ترین رنگ‌دانه‌ها و جرم‌های دندانی با تکنولوژی لیزر و متریال درجه یک آلمانی.',
        // Dedicated Sparkle / Whitening Tooth Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 0-5 1.5-5 4.5 0 2.5 1 4 1.5 6.5S9 20 12 20s3.5-3.5 3.5-6c.5-2.5 1.5-4 1.5-6.5C17 4.5 15 3 12 3z"/><path d="M19 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/><path d="M4 11l.75 1.5L6 13l-1.25.5L4 15l-.5-1.5L2 13l1.5-.5L4 11z"/></svg>`,
        link: '#'
    },
    {
        id: '06',
        title: 'جراحی و ترمیم پیشرفته',
        desc: 'ترمیم‌های همرنگ دندان با مواد نانوکامپوزیت، جراحی دندان عقل و پریودنتولوژی (درمان لثه).',
        // Dedicated Care / Protection Icon
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
        link: '#'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const servicesGrid = document.getElementById('js-services-grid');

    if (servicesGrid) {
        servicesGrid.innerHTML = dentalServices.map(service => `
            <article class="c-services__card">
                <span class="c-services__card-bg-num">${service.id}</span>
                <div class="c-services__card-body">
                    <div class="c-services__icon-wrapper">
                        ${service.icon}
                    </div>
                    <h3 class="c-services__card-title">${service.title}</h3>
                    <p class="c-services__card-desc">${service.desc}</p>
                </div>
                <div class="c-services__card-footer">
                    <a href="${service.link}" class="c-services__card-link">
                        <span>مشاهده جزئیات و نوبت‌دهی</span>
                        <div class="c-services__link-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        </div>
                    </a>
                </div>
            </article>
        `).join('');
    }
});
