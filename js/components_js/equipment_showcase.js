/* ==================== Equipment Section Logic ==================== */

// Dental Equipment Data
const equipmentData = [
    {
        id: 1,
        title: 'اسکنر داخل دهانی سه بعدی (Intraoral Scanner)',
        desc: 'جایگزین قالب‌گیری سنتی با قابلیت اسکن دیجیتال و ثبت تصویر ۳D از فک و دندان‌ها در چند ثانیه، با بالاترین دقت جهت ساخت روکش و ایمپلنت.',
        spec: 'تکنولوژی CAD/CAM | ساخت سوئیس (۲۰۲۵)',
        img: '../../assets/images/equipments/Intraoral Scanner_11zon.webp'
    },
    {
        id: 2,
        title: 'لیزر دندان‌پزشکی کم‌توان و پرتوان (Dental Laser)',
        desc: 'ابزار پیشرفته جهت جراحی‌های بدون خونریزی و درد لثه، سفید کردن تخصصی دندان‌ها (بلیچینگ) و ضدعفونی‌سازی عمیق کانال ریشه.',
        spec: 'طول موج دوگانه | جراحی و زیبایی',
        img: '../../assets/images/equipments/Dental Laser_11zon.webp'
    },
    {
        id: 3,
        title: 'میکروسکوپ تخصصی درمان ریشه (Endodontic Microscope)',
        desc: 'ارائه‌دهنده بزرگنمایی تا ۳۰ برابر به همراه نور خنک LED برای تشخیص کانال‌های پنهان ریشه و انجام عصب‌کشی‌های بسیار پیچیده.',
        spec: 'اپتیک Zeiss آلمان | سیستم زوم پیوسته',
        img: '../../assets/images/equipments/Endodontic Microscope_11zon.webp'
    },
    {
        id: 4,
        title: 'دستگاه اسکیلر اولتراسونیک پیئزوالکتریک',
        desc: 'جرم‌گیری فوق‌پیشرفته و بدون آسیب به مینای دندان با نوسانات امواج صوتی و سیستم آبرسانی هوشمند جهت کاهش حساسیست دندان.',
        spec: 'فرکانس ۳۲ کیلوهرتز | مد انحصاری Soft',
        img: '../../assets/images/equipments/Piezoelectric ultrasonic scaler_11zon.webp'
    },
    {
        id: 5,
        title: 'موتور ایمپلنت و جراحی هوشمند (Physiodispenser)',
        desc: 'دستگاه کنترل هوشمند گشتاور و سرعت برای سوراخ‌کاری استخوان فک و کاشت دقیق پایه‌های ایمپلنت بدون ایجاد آسیب حرارتی.',
        spec: 'گشتاور ۸۰ نیوتن‌سانتی‌متر | صفحه لمسی',
        img: '../../assets/images/equipments/Physiodispenser_11zon.webp'
    },
    {
        id: 6,
        title: 'دستگاه روتاری و اپکس‌لوکیتور ترکیبی',
        desc: 'سیستم هوشمند پاک‌سازی کانال ریشه با قابلیت اندازه‌گیری هم‌زمان طول ریشه و متوقف‌سازی خودکار جهت جلوگیری از انحراف فایل.',
        spec: 'موتور بی‌سیم Brushless | تکنولوژی هوش مصنوعی',
        img: '../../assets/images/equipments/Combined rotary and apex locator unit_11zon.jpeg'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const mainImg = document.getElementById('js-equipment-main-img');
    const titleEl = document.getElementById('js-equipment-title');
    const descEl = document.getElementById('js-equipment-desc');
    const specEl = document.getElementById('js-equipment-spec');
    const thumbsContainer = document.getElementById('js-equipment-thumbs');

    let activeEquipmentIndex = 0;

    function renderEquipmentThumbs() {
        if (!thumbsContainer) return;

        thumbsContainer.innerHTML = equipmentData.map((item, index) => `
            <button type="button" class="c-equipment__thumb-card ${index === activeEquipmentIndex ? 'is-active' : ''}" data-index="${index}" aria-label="${item.title}">
                <img src="${item.img}" alt="${item.title}">
            </button>
        `).join('');

        attachEquipmentEvents();
    }

    function updateActiveEquipment(index) {
        activeEquipmentIndex = index;
        const selected = equipmentData[index];

        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = selected.img;
                mainImg.alt = selected.title;
                mainImg.style.opacity = '1';
            }, 200);
        }

        if (titleEl) titleEl.textContent = selected.title;
        if (descEl) descEl.textContent = selected.desc;
        if (specEl) specEl.textContent = selected.spec;

        const cards = thumbsContainer.querySelectorAll('.c-equipment__thumb-card');
        cards.forEach((card, idx) => {
            card.classList.toggle('is-active', idx === index);
        });
    }

    function attachEquipmentEvents() {
        const cards = thumbsContainer.querySelectorAll('.c-equipment__thumb-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.getAttribute('data-index'), 10);
                updateActiveEquipment(idx);
            });
        });
    }

    // Initial render call
    renderEquipmentThumbs();
});
