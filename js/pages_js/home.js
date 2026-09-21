document.addEventListener('DOMContentLoaded', async () => {
    const servicesGrid = document.getElementById('js-services-grid');
    const doctorsGrid = document.getElementById('js-doctors-grid');

    function formatMoney(amount) {
        if (!amount && amount !== 0) return '۰';
        return Number(amount).toLocaleString('fa-IR');
    }

    const renderServices = async () => {
        if (!servicesGrid) return;
        try {
            const services = await window.servicesService.getAllServices();
            if (!services || services.length === 0) {
                servicesGrid.innerHTML = '<p class="c-services__empty">هیچ خدمتی یافت نشد.</p>';
                return;
            }

            servicesGrid.innerHTML = services.map((service, index) => {
                const priceHtml = service.price > 0
                    ? `<div style="margin-top:15px; padding-top:15px; border-top:1px dashed #e2e8f0; text-align:right;">
                         <div style="font-size:13px; color:#64748b;">هزینه کل: <strong style="color:#0f172a; font-size:15px;">${formatMoney(service.price)}</strong> تومان</div>
                         <div style="font-size:12px; color:#10b981; margin-top:5px; font-weight:bold;"><i class="fas fa-check-circle"></i> پیش‌پرداخت رزرو: ${formatMoney(service.prepayment)} تومان</div>
                       </div>`
                    : `<div style="margin-top:15px; padding-top:15px; border-top:1px dashed #e2e8f0; font-size:13px; color:#64748b; text-align:right;">هزینه پس از معاینه مشخص می‌شود</div>`;

                return `
                <article class="c-services__card">
                    <span class="c-services__card-bg-num">0${index + 1}</span>
                    <div class="c-services__card-body">
                        <div class="c-services__icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </div>
                        <h3 class="c-services__card-title">${service.serviceName || service.title}</h3>
                        <p class="c-services__card-desc">${service.serviceDescription || service.desc}</p>
                        ${priceHtml}
                    </div>
                    <div class="c-services__card-footer">
                        <a href="#appointment" class="c-services__card-link js-service-book-btn" data-service-id="${service.id}">
                            <span>مشاهده جزئیات و نوبت‌دهی</span>
                        </a>
                    </div>
                </article>
            `}).join('');
        } catch (error) {
            console.error('Error fetching services:', error);
            servicesGrid.innerHTML = '<p class="c-services__error">خطا در دریافت لیست خدمات از سرور.</p>';
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
                // استخراج هوشمند تخصص‌ها (چه به صورت آرایه JSON باشد چه متن ساده)
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
