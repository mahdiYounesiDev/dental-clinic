document.addEventListener('DOMContentLoaded', async () => {
    const servicesGrid = document.getElementById('js-services-grid');
    const doctorsGrid = document.getElementById('js-doctors-grid');

    // Helper: فرمت قیمت‌ها
    function formatMoney(amount) {
        if (!amount && amount !== 0) return '۰';
        return Number(amount).toLocaleString('fa-IR');
    }

    // آیکون‌های مدرن برای سرویس‌ها
    const defaultIcons = [
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 6 4 6 7c0 2.5 1.5 4.5 3 6v2h6v-2c1.5-1.5 3-3.5 3-6 0-3-2-5-6-5z"/><path d="M9 15v2m6-2v2m-6 2v2m6-2v2m-4.5 1v2"/></svg>`,
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M8 13c1 2.5 3.5 3.5 4 3.5s3-.8 4-3.5"/><circle cx="9" cy="9" r="1.25" fill="currentColor"/><circle cx="15" cy="9" r="1.25" fill="currentColor"/></svg>`,
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 18h16"/><rect x="7" y="4" width="3" height="4" rx="1"/><rect x="14" y="4" width="3" height="4" rx="1"/><rect x="7" y="16" width="3" height="4" rx="1"/><rect x="14" y="16" width="3" height="4" rx="1"/><path d="M8.5 8v8m7-8v8"/></svg>`,
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 2 7 3.5 7 6.5c0 3 1.5 5 2 8s.5 7.5 3 7.5 2.5-4.5 3-7.5 2-5 2-8S15 2 12 2z"/><path d="M12 6v6m0 4v2"/></svg>`,
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 0-5 1.5-5 4.5 0 2.5 1 4 1.5 6.5S9 20 12 20s3.5-3.5 3.5-6c.5-2.5 1.5-4 1.5-6.5C17 4.5 15 3 12 3z"/><path d="M19 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/><path d="M4 11l.75 1.5L6 13l-1.25.5L4 15l-.5-1.5L2 13l1.5-.5L4 11z"/></svg>`,
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`
    ];

    const renderServices = async () => {
        if (!servicesGrid) return;
        try {
            const services = await window.servicesService.getAllServices();

            // جایگزینی با کلاس شبکه جدید
            servicesGrid.className = 'premium-services-grid';

            if (!services || services.length === 0) {
                servicesGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#64748b; font-size: 13px;">هیچ خدمتی یافت نشد.</p>';
                return;
            }

            servicesGrid.innerHTML = services.map((service, index) => {
                const iconSvg = defaultIcons[index % defaultIcons.length];
                const numStr = (index + 1).toString().padStart(2, '0');

                // باکس تیره و پیشرفته قیمت
                const priceHtml = service.price > 0
                    ? `<div class="svc-finance-box">
                         <div class="svc-finance-row svc-finance-row--total">
                            <span>هزینه کل درمان:</span>
                            <strong>${formatMoney(service.price)} <small style="font-weight:normal; font-size:10px;">تومان</small></strong>
                         </div>
                         <div class="svc-finance-row svc-finance-row--prepay">
                            <span><i class="fas fa-check-circle" style="margin-left:4px;"></i> پیش‌پرداخت رزرو:</span>
                            <span>${formatMoney(service.prepayment)} <small style="font-weight:normal; font-size:10px;">تومان</small></span>
                         </div>
                       </div>`
                    : `<div class="svc-finance-box" style="display:flex; justify-content:center; align-items:center; color:#94a3b8; padding: 18px 10px;">
                         <i class="fas fa-info-circle" style="margin-left:6px;"></i> هزینه دقیق پس از معاینه مشخص می‌شود
                       </div>`;

                return `
                <article class="svc-card-pro js-service-book-btn" data-service-id="${service.id}">
                    <div class="svc-icon-wrapper">
                        <div class="svc-icon">${iconSvg}</div>
                        <div class="svc-number">${numStr}</div>
                    </div>

                    <h3 class="svc-title">${service.serviceName || service.title}</h3>
                    <p class="svc-desc">${service.serviceDescription || service.desc || 'ارائه بهترین خدمات تخصصی دندان‌پزشکی با بالاترین کیفیت و تکنولوژی روز دنیا.'}</p>

                    ${priceHtml}

                    <button type="button" class="svc-action-btn">
                        <span>ثبت نوبت و مشاوره</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </button>
                </article>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching services:', error);
            servicesGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#ef4444; font-size: 13px;">خطا در دریافت لیست خدمات.</p>';
        }
    };

    const renderDoctors = async () => {
        if (!doctorsGrid) return;
        try {
            const doctors = await window.doctorsService.getAllDoctors();
            if (!doctors || doctors.length === 0) {
                doctorsGrid.innerHTML = '<p class="c-doctors__empty">پزشکی یافت نشد.</p>';
                return;
            }

            doctorsGrid.innerHTML = doctors.map(doc => {
                let specs = [];
                try {
                    specs = JSON.parse(doc.doctorSpecializations);
                } catch(e) {
                    if (typeof doc.doctorSpecializations === 'string') {
                        specs = doc.doctorSpecializations.split(',').map(s => s.trim());
                    }
                }
                if (!Array.isArray(specs)) specs = [];

                return `
                <article class="c-doctor-card">
                    <div class="c-doctor-card__top">
                        <div class="c-doctor-card__status">
                            <span class="c-doctor-card__status-dot"></span>
                            <span>آماده پذیرش</span>
                        </div>

                        <div class="c-doctor-card__avatar-wrapper">
                            <figure class="c-doctor-card__avatar-box">
                                ${doc.avatarUrl
                                    ? `<img src="${doc.avatarUrl}" alt="دکتر ${doc.doctorName}${doc.doctorFamily}" class="c-doctor-card__avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`
                                    : `<div class="c-doctor-card__avatar-placeholder">${doc.doctorName ? doc.doctorName.charAt(0) : 'د'}</div>`
                                }
                            </figure>
                        </div>

                        <h3 class="c-doctor-card__name">دکتر ${doc.doctorName || ''} ${doc.doctorFamily || ''}</h3>
                        <p class="c-doctor-card__specialty">${doc.doctorDegree || ''}</p>

                        <div class="c-doctor-card__tags">
                            ${specs.map(spec => `<span class="c-doctor-card__tag">${spec}</span>`).join('')}
                        </div>
                    </div>

                    <div class="c-doctor-card__bottom">
                        <div class="c-doctor-card__stats">
                            <div class="c-doctor-card__stat-box">
                                <span class="c-doctor-card__stat-value">${doc.doctorWorkExperience || 0} سال</span>
                                <span class="c-doctor-card__stat-label">سابقه طبابت</span>
                            </div>
                        </div>

                        <div class="c-doctor-card__meta-group">
                            <div class="c-doctor-card__meta-item">
                                <span class="c-doctor-card__meta-label">شماره تماس</span>
                                <span>${doc.doctorPhone || 'نامشخص'}</span>
                            </div>
                        </div>

                        <a href="#appointment" class="c-doctor-card__btn js-doctor-book-btn" data-doctor-id="${doc.id}">
                            <span>رزرو نوبت ویزیت</span>
                        </a>
                    </div>
                </article>
            `;
            }).join('');
        } catch (error) {
            console.error('Error fetching doctors:', error);
            doctorsGrid.innerHTML = '<p class="c-doctors__error">خطا در دریافت لیست پزشکان از سرور.</p>';
        }
    };

    await Promise.all([renderServices(), renderDoctors()]);

    if (servicesGrid) {
        servicesGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-service-book-btn');
            if (!btn) return;

            e.preventDefault();
            const serviceId = btn.dataset.serviceId;

            if (window.AppointmentModal && typeof window.AppointmentModal.openForService === 'function') {
                window.AppointmentModal.openForService(serviceId);
            }
        });
    }

    if (doctorsGrid) {
        doctorsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-doctor-book-btn');
            if (!btn) return;

            e.preventDefault();
            const doctorId = btn.dataset.doctorId;
            const card = btn.closest('.c-doctor-card');
            const doctorName = card ? card.querySelector('.c-doctor-card__name')?.textContent.trim() : 'پزشک منتخب';

            if (window.AppointmentModal && typeof window.AppointmentModal.openForDoctor === 'function') {
                window.AppointmentModal.openForDoctor(doctorName, doctorId);
            }
        });
    }
});
