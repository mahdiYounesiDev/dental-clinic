document.addEventListener('DOMContentLoaded', async () => {
    const servicesGrid = document.getElementById('js-services-grid');
    const doctorsGrid = document.getElementById('js-doctors-grid');

    const renderServices = async () => {
        if (!servicesGrid) return;
        try {
            const services = await window.servicesService.getAllServices();
            if (!services || services.length === 0) {
                servicesGrid.innerHTML = '<p class="c-services__empty">هیچ خدمتی یافت نشد.</p>';
                return;
            }

            servicesGrid.innerHTML = services.map((service, index) => `
                <article class="c-services__card">
                    <span class="c-services__card-bg-num">0${index + 1}</span>
                    <div class="c-services__card-body">
                        <div class="c-services__icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </div>
                        <h3 class="c-services__card-title">${service.serviceName}</h3>
                        <p class="c-services__card-desc">${service.serviceDescription}</p>
                    </div>
                    <div class="c-services__card-footer">
                        <a href="#appointment" class="c-services__card-link js-service-book-btn" data-service-id="${service.id}">
                            <span>مشاهده جزئیات و نوبت‌دهی</span>
                        </a>
                    </div>
                </article>
            `).join('');
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

            doctorsGrid.innerHTML = doctors.map(doc => `
                <article class="c-doctor-card">
                    <div class="c-doctor-card__top">
                        <div class="c-doctor-card__status">
                            <span class="c-doctor-card__status-dot"></span>
                            <span>آماده پذیرش</span>
                        </div>

                        <div class="c-doctor-card__avatar-wrapper">
                            <figure class="c-doctor-card__avatar-box">
                                ${doc.avatarUrl
                                    ? `<img src="${doc.avatarUrl}" alt="دکتر ${doc.doctorName} ${doc.doctorFamily}" class="c-doctor-card__avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`
                                    : `<div class="c-doctor-card__avatar-placeholder">${doc.doctorName ? doc.doctorName.charAt(0) : 'د'}</div>`
                                }
                            </figure>
                        </div>

                        <h3 class="c-doctor-card__name">دکتر ${doc.doctorName} ${doc.doctorFamily}</h3>
                        <p class="c-doctor-card__specialty">${doc.doctorDegree}</p>

                        <div class="c-doctor-card__tags">
                            ${(doc.doctorSpecializations || []).map(spec => `<span class="c-doctor-card__tag">${spec}</span>`).join('')}
                        </div>
                    </div>

                    <div class="c-doctor-card__bottom">
                        <div class="c-doctor-card__stats">
                            <div class="c-doctor-card__stat-box">
                                <span class="c-doctor-card__stat-value">${doc.doctorWorkExperience} سال</span>
                                <span class="c-doctor-card__stat-label">سابقه طبابت</span>
                            </div>
                        </div>

                        <div class="c-doctor-card__meta-group">
                            <div class="c-doctor-card__meta-item">
                                <span class="c-doctor-card__meta-label">ایمیل تماس</span>
                                <span>${doc.doctorEmail}</span>
                            </div>
                        </div>

                        <a href="#appointment" class="c-doctor-card__btn js-doctor-book-btn" data-doctor-id="${doc.id}">
                            <span>رزرو نوبت ویزیت</span>
                        </a>
                    </div>
                </article>
            `).join('');
        } catch (error) {
            console.error('Error fetching doctors:', error);
            doctorsGrid.innerHTML = '<p class="c-doctors__error">خطا در دریافت لیست پزشکان از سرور.</p>';
        }
    };

    await Promise.all([renderServices(), renderDoctors()]);
});
