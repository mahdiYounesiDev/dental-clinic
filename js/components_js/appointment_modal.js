document.addEventListener('DOMContentLoaded', () => {

    const servicesData = [
        {
            id: 1,
            title: 'ایمپلنت تخصصی دندان',
            doctor: 'دکتر رضا محمدی'
        },
        {
            id: 2,
            title: 'طراحی تخصصی لبخند و کامپوزیت',
            doctor: 'دکتر سارا احمدی'
        },
        {
            id: 3,
            title: 'ارتودنسی و تراز دندان',
            doctor: 'دکتر مریم کاظمی'
        },
        {
            id: 4,
            title: 'عصب‌کشی میکروسکوپی',
            doctor: 'دکتر رضا محمدی'
        },
        {
            id: 5,
            title: 'بلیچینگ و سفیدکردن دندان',
            doctor: 'دکتر سارا احمدی'
        },
        {
            id: 6,
            title: 'دندان‌پزشکی کودکان',
            doctor: 'دکتر مریم کاظمی'
        }
    ];

    const timeSlotsData = [
        { time: '۰۹:۰۰ - ۱۰:۰۰', available: true },
        { time: '۱۰:۰۰ - ۱۱:۰۰', available: false },
        { time: '۱۱:۰۰ - ۱۲:۰۰', available: true },
        { time: '۱۶:۰۰ - ۱۷:۰۰', available: true },
        { time: '۱۷:۰۰ - ۱۸:۰۰', available: false },
        { time: '۱۸:۰۰ - ۱۹:۰۰', available: true }
    ];

    const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
        'مرداد', 'شهریور', 'مهر', 'آبان',
        'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const currentRealYear = 1405;
    const currentRealMonth = 4;
    const currentRealDay = 30;

    let calendarYear = currentRealYear;
    let calendarMonth = currentRealMonth;

    const baseYear = 1405;
    const baseMonth = 4;
    const baseMonthStartDay = 5;

    const fullyBookedDays = [];

    let bookingState = {
        service: null,
        doctor: null,
        date: null,
        timeSlot: null
    };

    let userAppointments = [];

    const appointmentModal = document.getElementById('js-appointment-modal');
    const calendarModal = document.getElementById('js-calendar-modal');
    const timeModal = document.getElementById('js-time-modal');
    const myAppointmentsModal = document.getElementById('js-my-appointments-modal');
    const servicesListContainer = document.getElementById('js-appointment-services-list');
    const calendarDaysGrid = document.getElementById('js-calendar-days-grid');
    const calendarMonthLabel = document.getElementById('js-calendar-month-label');
    const prevMonthBtn = document.getElementById('js-prev-month');
    const nextMonthBtn = document.getElementById('js-next-month');
    const timeSlotsGrid = document.getElementById('js-time-slots-grid');
    const bookingSummary = document.getElementById('js-booking-summary');
    const bookingForm = document.getElementById('js-booking-form');
    const myAppointmentsList = document.getElementById('js-my-appointments-list');

    function isPersianLeapYear(year) {
        const leapYears = [
            1395, 1399, 1403, 1408, 1412, 1416, 1420, 1424, 1428,
            1433, 1437, 1441, 1445, 1449, 1453, 1458, 1462, 1466,
            1470, 1474, 1479, 1483, 1487, 1491, 1495
        ];
        return leapYears.includes(year);
    }

    function getPersianMonthDays(year, month) {
        if (month >= 0 && month <= 5) return 31;
        if (month >= 6 && month <= 10) return 30;
        return isPersianLeapYear(year) ? 30 : 29;
    }

    function getMonthStartDay(year, month) {
        let startDay = baseMonthStartDay;
        let currentYear = baseYear;
        let currentMonth = baseMonth;

        while (currentYear < year || (currentYear === year && currentMonth < month)) {
            const daysInCurrentMonth = getPersianMonthDays(currentYear, currentMonth);
            startDay = (startDay + daysInCurrentMonth) % 7;
            currentMonth++;

            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        while (currentYear > year || (currentYear === year && currentMonth > month)) {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            const daysInPreviousMonth = getPersianMonthDays(currentYear, currentMonth);
            startDay = (startDay - (daysInPreviousMonth % 7) + 7) % 7;
        }

        return startDay;
    }

    function toPersianNumber(value) {
        const numbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/\d/g, digit => numbers[digit]);
    }

    function renderMyAppointments() {
        if (!myAppointmentsList) return;

        if (userAppointments.length === 0) {
            myAppointmentsList.innerHTML = `
                <div style="text-align: center; padding: 30px 10px;">
                    <i class="far fa-calendar-times" style="font-size: 48px; color: #a0aec0; margin-bottom: 15px;"></i>
                    <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">شما هیچ نوبت فعالی ندارید</h4>
                    <p style="font-size: 13px; color: #718096;">برای ثبت نوبت می‌توانید از بخش خدمات یا پزشکان اقدام کنید.</p>
                </div>
            `;
        } else {
            myAppointmentsList.innerHTML = userAppointments.map(app => `
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 12px; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #2d3748; font-size: 15px;">${app.service}</strong>
                        <span style="background: #e6fffa; color: #234e52; font-size: 12px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">${app.status}</span>
                    </div>
                    <div style="font-size: 13px; color: #4a5568; line-height: 1.8;">
                        <div><i class="fas fa-user-md" style="margin-left: 6px; color: #3182ce;"></i> پزشک: <strong>${app.doctor}</strong></div>
                        <div><i class="far fa-calendar-alt" style="margin-left: 6px; color: #3182ce;"></i> تاریخ: ${app.date}</div>
                        <div><i class="far fa-clock" style="margin-left: 6px; color: #3182ce;"></i> ساعت: ${app.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    const openFirstModal = (e) => {
        if (e) e.preventDefault();
        renderServices(servicesData);
        if (appointmentModal) appointmentModal.showModal();
    };

    const navAppointmentsBtn = document.getElementById('js-nav-appointments');
    if (navAppointmentsBtn) {
        navAppointmentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderMyAppointments();
            if (myAppointmentsModal) myAppointmentsModal.showModal();
        });
    }

    const heroBookingBtns = document.querySelectorAll('.c-hero-card__btn, .js-hero-booking');
    heroBookingBtns.forEach(btn => {
        btn.addEventListener('click', openFirstModal);
    });

    document.querySelectorAll('.js-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (appointmentModal) appointmentModal.close();
            if (calendarModal) calendarModal.close();
            if (timeModal) timeModal.close();
            if (myAppointmentsModal) myAppointmentsModal.close();
        });
    });

    document.getElementById('js-calendar-back')?.addEventListener('click', () => {
        calendarModal.close();
        appointmentModal.showModal();
    });

    document.getElementById('js-time-back')?.addEventListener('click', () => {
        timeModal.close();
        calendarModal.showModal();
    });

    function renderServices(dataToRender = servicesData) {
        if (!servicesListContainer) return;

        servicesListContainer.innerHTML = dataToRender
            .map(item => `
                <li class="c-appointment-item">
                    <div class="c-appointment-item__info">
                        <h3 class="c-appointment-item__title">${item.title}</h3>
                        <p class="c-appointment-item__doctor">
                            <i class="fas fa-user-md"></i>
                            ${item.doctor}
                        </p>
                    </div>

                    <button type="button" class="c-appointment-item__btn" data-id="${item.id}">
                        <span>انتخاب و نوبت‌گیری</span>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </li>
            `).join('');

        servicesListContainer.querySelectorAll('.c-appointment-item__btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = parseInt(e.currentTarget.dataset.id, 10);
                const selected = servicesData.find(service => service.id === serviceId);

                if (!selected) return;

                bookingState.service = selected.title;
                bookingState.doctor = selected.doctor;

                appointmentModal.close();
                renderCalendar();
                calendarModal.showModal();
            });
        });
    }

    window.AppointmentModal = {
        openForService: (serviceIdStr) => {
            const index = parseInt(serviceIdStr, 10) - 1;
            const targetService = servicesData[index] || servicesData[0];

            if (targetService) {
                bookingState.service = targetService.title;
                bookingState.doctor = targetService.doctor;

                renderCalendar();
                if (calendarModal) calendarModal.showModal();
            }
        },

        openForDoctor: (doctorName) => {
            const filteredServices = servicesData.filter(s => s.doctor === doctorName);
            renderServices(filteredServices.length ? filteredServices : servicesData);
            if (appointmentModal) appointmentModal.showModal();
        }
    };

    function renderCalendar() {
        if (!calendarDaysGrid || !calendarMonthLabel) return;

        calendarMonthLabel.textContent = `${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;

        const isCurrentOrPastMonth = (calendarYear < currentRealYear) ||
            (calendarYear === currentRealYear && calendarMonth <= currentRealMonth);

        if (prevMonthBtn) {
            prevMonthBtn.disabled = isCurrentOrPastMonth;
        }

        const totalDays = getPersianMonthDays(calendarYear, calendarMonth);
        const startDayOfWeek = getMonthStartDay(calendarYear, calendarMonth);

        let daysHTML = '';

        for (let i = 0; i < startDayOfWeek; i++) {
            daysHTML += `<div class="c-calendar-day c-calendar-day--empty"></div>`;
        }

        for (let day = 1; day <= totalDays; day++) {
            const isPast = (calendarYear < currentRealYear) ||
                (calendarYear === currentRealYear && calendarMonth < currentRealMonth) ||
                (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day < currentRealDay);

            const isFullyBooked = !isPast &&
                calendarYear === currentRealYear &&
                calendarMonth === currentRealMonth &&
                fullyBookedDays.includes(day);

            let statusClass = '';
            let disabledAttr = '';
            let titleAttr = '';

            if (isPast) {
                statusClass = 'c-calendar-day--past';
                disabledAttr = 'disabled';
                titleAttr = 'تاریخ گذشته';
            } else if (isFullyBooked) {
                statusClass = 'c-calendar-day--booked';
                disabledAttr = 'disabled';
                titleAttr = 'ظرفیت تکمیل است';
            }

            daysHTML += `
                <button type="button" class="c-calendar-day ${statusClass}" ${disabledAttr} title="${titleAttr}" data-day="${day}">
                    <span>${toPersianNumber(day)}</span>
                </button>
            `;
        }

        calendarDaysGrid.innerHTML = daysHTML;

        calendarDaysGrid.querySelectorAll('.c-calendar-day:not([disabled]):not(.c-calendar-day--empty)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.currentTarget.dataset.day, 10);

                bookingState.date = `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;

                calendarModal.close();
                renderTimeSlots();
                timeModal.showModal();
            });
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderCalendar();
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            const isCurrentOrPastMonth = (calendarYear < currentRealYear) ||
                (calendarYear === currentRealYear && calendarMonth <= currentRealMonth);

            if (!isCurrentOrPastMonth) {
                calendarMonth--;
                if (calendarMonth < 0) {
                    calendarMonth = 11;
                    calendarYear--;
                }
                renderCalendar();
            }
        });
    }

    function renderTimeSlots() {
        if (!timeSlotsGrid || !bookingSummary) return;

        bookingSummary.innerHTML = `
            <div class="c-booking-summary__item">
                <span class="c-booking-summary__label">خدمت:</span>
                <span class="c-booking-summary__value">${bookingState.service}</span>
            </div>
            <div class="c-booking-summary__item">
                <span class="c-booking-summary__label">پزشک:</span>
                <span class="c-booking-summary__value">${bookingState.doctor}</span>
            </div>
            <div class="c-booking-summary__item">
                <span class="c-booking-summary__label">تاریخ:</span>
                <span class="c-booking-summary__value">${bookingState.date}</span>
            </div>
        `;

        timeSlotsGrid.innerHTML = timeSlotsData.map(slot => `
            <button type="button" class="c-time-slot-btn ${!slot.available ? 'c-time-slot-btn--disabled' : ''}" ${!slot.available ? 'disabled' : ''} data-time="${slot.time}">
                <i class="far fa-clock"></i>
                <span>${slot.time}</span>
            </button>
        `).join('');

        bookingState.timeSlot = null;

        timeSlotsGrid.querySelectorAll('.c-time-slot-btn:not(.c-time-slot-btn--disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeSlotsGrid.querySelectorAll('.c-time-slot-btn').forEach(button => button.classList.remove('c-time-slot-btn--active'));
                e.currentTarget.classList.add('c-time-slot-btn--active');
                bookingState.timeSlot = e.currentTarget.dataset.time;
            });
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!bookingState.timeSlot) {
                alert('لطفاً یک ساعت کاری خالی را انتخاب کنید.');
                return;
            }

            userAppointments.push({
                id: Date.now(),
                service: bookingState.service,
                doctor: bookingState.doctor,
                date: bookingState.date,
                time: bookingState.timeSlot,
                status: 'تایید شده'
            });

            alert(`نوبت شما با موفقیت رزرو شد!`);

            bookingForm.reset();
            bookingState = { service: null, doctor: null, date: null, timeSlot: null };
            timeModal.close();
        });
    }

});
