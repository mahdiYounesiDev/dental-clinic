document.addEventListener('DOMContentLoaded', () => {
    const doctorsData = [
        {
            id: 1,
            name: 'دکتر سارا احمدی',
            specialty: 'متخصص ترمیم و زیبایی',
            avatar: '../../assets/images/p1.jpg',
            rating: '۴.۹',
            reviews: '(۱۲۴)',
            degree: 'بورد تخصصی از دانشگاه تهران',
            code: 'م-۴۵۲۳۱',
            experience: '۱۲ سال',
            patients: '+۲,۵۰۰',
            skills: ['کامپوزیت', 'لمینت', 'بلیچینگ']
        },
        {
            id: 2,
            name: 'دکتر رضا محمدی',
            specialty: 'جراح و متخصص ایمپلنت',
            avatar: '../../assets/images/p2.jpg',
            rating: '۵.۰',
            reviews: '(۱۹۸)',
            degree: 'فلوشیپ ایمپلنتولوژی از آلمان',
            code: 'م-۳۸۹۰۱',
            experience: '۱۵ سال',
            patients: '+۳,۸۰۰',
            skills: ['جراحی فک', 'ایمپلنت فوری', 'پیوند استخوان']
        },
        {
            id: 3,
            name: 'دکتر مریم کاظمی',
            specialty: 'متخصص ارتودنسی',
            avatar: '../../assets/images/p3.jpg',
            rating: '۴.۸',
            reviews: '(۹۶)',
            degree: 'عضو انجمن ارتودنتیست‌های ایران',
            code: 'م-۵۶۱۲۴',
            experience: '۹ سال',
            patients: '+۱,۹۰۰',
            skills: ['ارتودنسی نامرئی', 'ارتودنسی ثابت']
        }
    ];

    const gridWrapper = document.getElementById('js-doctors-grid');

    function renderDoctors(doctors) {
        if (!gridWrapper) return;

        gridWrapper.innerHTML = doctors.map(doc => `
            <article class="c-doctor-card">
                <div class="c-doctor-card__top">
                    <div class="c-doctor-card__status">
                        <span class="c-doctor-card__status-dot"></span>
                        <span>آماده پذیرش</span>
                    </div>

                    <div class="c-doctor-card__avatar-wrapper">
                        <figure class="c-doctor-card__avatar-box">
                            <img class="c-doctor-card__avatar" src="${doc.avatar}" alt="${doc.name}" decoding="async">
                        </figure>
                        <div class="c-doctor-card__rating">
                            <span class="c-doctor-card__star">★</span>
                            <span>${doc.rating}</span>
                        </div>
                    </div>

                    <h3 class="c-doctor-card__name">${doc.name}</h3>
                    <p class="c-doctor-card__specialty">${doc.specialty}</p>

                    <div class="c-doctor-card__tags">
                        ${doc.skills.map(skill => `<span class="c-doctor-card__tag">${skill}</span>`).join('')}
                    </div>
                </div>

                <div class="c-doctor-card__bottom">
                    <div class="c-doctor-card__stats">
                        <div class="c-doctor-card__stat-box">
                            <span class="c-doctor-card__stat-value">${doc.experience}</span>
                            <span class="c-doctor-card__stat-label">سابقه طبابت</span>
                        </div>
                        <div class="c-doctor-card__stat-box">
                            <span class="c-doctor-card__stat-value">${doc.patients}</span>
                            <span class="c-doctor-card__stat-label">درمان موفق</span>
                        </div>
                    </div>

                    <div class="c-doctor-card__meta-group">
                        <div class="c-doctor-card__meta-item">
                            <span class="c-doctor-card__meta-label">مدرک تحصیلی</span>
                            <span>${doc.degree}</span>
                        </div>
                        <div class="c-doctor-card__meta-item">
                            <span class="c-doctor-card__meta-label">کد نظام پزشکی</span>
                            <span>${doc.code}</span>
                        </div>
                    </div>

                    <a href="#appointment" class="c-doctor-card__btn js-doctor-book-btn" data-doctor-name="${doc.name}">
                        <span>رزرو نوبت ویزیت</span>
                    </a>
                </div>
            </article>
        `).join('');

        gridWrapper.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-doctor-book-btn');
            if (!btn) return;

            e.preventDefault();
            const doctorName = btn.dataset.doctorName;

            if (window.AppointmentModal && typeof window.AppointmentModal.openForDoctor === 'function') {
                window.AppointmentModal.openForDoctor(doctorName);
            }
        });
    }

    renderDoctors(doctorsData);
});
