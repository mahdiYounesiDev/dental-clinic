document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // Services and Doctors Mock Data
    // =========================================================

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


    // =========================================================
    // Available Time Slots Data
    // =========================================================

    const timeSlotsData = [
        {
            time: '۰۹:۰۰ - ۱۰:۰۰',
            available: true
        },
        {
            time: '۱۰:۰۰ - ۱۱:۰۰',
            available: false
        },
        {
            time: '۱۱:۰۰ - ۱۲:۰۰',
            available: true
        },
        {
            time: '۱۶:۰۰ - ۱۷:۰۰',
            available: true
        },
        {
            time: '۱۷:۰۰ - ۱۸:۰۰',
            available: false
        },
        {
            time: '۱۸:۰۰ - ۱۹:۰۰',
            available: true
        }
    ];


    // =========================================================
    // Persian Months
    // =========================================================

    const persianMonths = [
        'فروردین',
        'اردیبهشت',
        'خرداد',
        'تیر',
        'مرداد',
        'شهریور',
        'مهر',
        'آبان',
        'آذر',
        'دی',
        'بهمن',
        'اسفند'
    ];


    // =========================================================
    // Current Real Persian Date
    // 30 Mordad 1405 - Friday
    // =========================================================

    const currentRealYear = 1405;
    const currentRealMonth = 4;
    const currentRealDay = 30;


    // =========================================================
    // Calendar State
    // =========================================================

    let calendarYear = currentRealYear;
    let calendarMonth = currentRealMonth;


    // =========================================================
    // Persian Weekday
    //
    // 0 = Saturday
    // 1 = Sunday
    // 2 = Monday
    // 3 = Tuesday
    // 4 = Wednesday
    // 5 = Thursday
    // 6 = Friday
    //
    // 1 Mordad 1405 = Wednesday = 4
    // =========================================================

const baseYear = 1405;
const baseMonth = 4;
const baseMonthStartDay = 5;

    // =========================================================
    // Fully Booked Days
    // =========================================================

    const fullyBookedDays = [];


    // =========================================================
    // Reservation State
    // =========================================================

    let bookingState = {
        service: null,
        doctor: null,
        date: null,
        timeSlot: null
    };


    // =========================================================
    // DOM Elements
    // =========================================================

    const appointmentModal =
        document.getElementById('js-appointment-modal');

    const calendarModal =
        document.getElementById('js-calendar-modal');

    const timeModal =
        document.getElementById('js-time-modal');

    const servicesListContainer =
        document.getElementById('js-appointment-services-list');

    const calendarDaysGrid =
        document.getElementById('js-calendar-days-grid');

    const calendarMonthLabel =
        document.getElementById('js-calendar-month-label');

    const prevMonthBtn =
        document.getElementById('js-prev-month');

    const nextMonthBtn =
        document.getElementById('js-next-month');

    const timeSlotsGrid =
        document.getElementById('js-time-slots-grid');

    const bookingSummary =
        document.getElementById('js-booking-summary');

    const bookingForm =
        document.getElementById('js-booking-form');


    // =========================================================
    // Calendar Helper Functions
    // =========================================================

    /**
     * تشخیص سال کبیسه شمسی
     *
     * این تابع برای محدوده سال‌های پروژه
     * تقویم شمسی را مدیریت می‌کند.
     */
    function isPersianLeapYear(year) {

        const leapYears = [
            1395,
            1399,
            1403,
            1408,
            1412,
            1416,
            1420,
            1424,
            1428,
            1433,
            1437,
            1441,
            1445,
            1449,
            1453,
            1458,
            1462,
            1466,
            1470,
            1474,
            1479,
            1483,
            1487,
            1491,
            1495
        ];

        return leapYears.includes(year);
    }


    /**
     * تعداد روزهای یک ماه شمسی
     *
     * فروردین تا شهریور = 31
     * مهر تا بهمن = 30
     * اسفند = 29 یا 30
     */
    function getPersianMonthDays(year, month) {

        if (month >= 0 && month <= 5) {
            return 31;
        }

        if (month >= 6 && month <= 10) {
            return 30;
        }

        return isPersianLeapYear(year) ? 30 : 29;
    }


    /**
     * تعداد روزهای یک سال شمسی
     */
    function getPersianYearDays(year) {

        return isPersianLeapYear(year) ? 366 : 365;
    }


    /**
     * محاسبه روز شروع یک ماه
     *
     * بر اساس:
     *
     * 1 Mordad 1405 = Wednesday = 4
     *
     * از این نقطه به عقب یا جلو حرکت می‌کنیم.
     */
    function getMonthStartDay(year, month) {

        let startDay = baseMonthStartDay;

        let currentYear = baseYear;
        let currentMonth = baseMonth;


        // -----------------------------------------------------
        // حرکت به سمت آینده
        // -----------------------------------------------------

        while (
            currentYear < year ||
            (
                currentYear === year &&
                currentMonth < month
            )
        ) {

            const daysInCurrentMonth =
                getPersianMonthDays(currentYear, currentMonth);

            startDay =
                (startDay + daysInCurrentMonth) % 7;

            currentMonth++;

            if (currentMonth > 11) {

                currentMonth = 0;
                currentYear++;
            }
        }


        // -----------------------------------------------------
        // حرکت به سمت گذشته
        // -----------------------------------------------------

        while (
            currentYear > year ||
            (
                currentYear === year &&
                currentMonth > month
            )
        ) {

            currentMonth--;

            if (currentMonth < 0) {

                currentMonth = 11;
                currentYear--;
            }

            const daysInPreviousMonth =
                getPersianMonthDays(currentYear, currentMonth);

            startDay =
                (
                    startDay -
                    (daysInPreviousMonth % 7) +
                    7
                ) % 7;
        }


        return startDay;
    }


    /**
     * تبدیل عدد انگلیسی به فارسی
     *
     * برای نمایش بهتر اعداد تقویم
     */
    function toPersianNumber(value) {

        const numbers = [
            '۰',
            '۱',
            '۲',
            '۳',
            '۴',
            '۵',
            '۶',
            '۷',
            '۸',
            '۹'
        ];

        return String(value).replace(
            /\d/g,
            digit => numbers[digit]
        );
    }


    // =========================================================
    // Trigger Modals
    // =========================================================

    const navAppointmentsBtn =
        document.getElementById('js-nav-appointments');

    const heroBookingBtn =
        document.querySelector('.c-hero-card__btn');


    const openFirstModal = (e) => {

        if (e) {
            e.preventDefault();
        }

        renderServices();

        if (appointmentModal) {
            appointmentModal.showModal();
        }
    };


    if (navAppointmentsBtn) {

        navAppointmentsBtn.addEventListener(
            'click',
            openFirstModal
        );
    }


    if (heroBookingBtn) {

        heroBookingBtn.addEventListener(
            'click',
            openFirstModal
        );
    }


    // =========================================================
    // Close Modals
    // =========================================================

    document
        .querySelectorAll('.js-modal-close')
        .forEach(btn => {

            btn.addEventListener('click', () => {

                if (appointmentModal) {
                    appointmentModal.close();
                }

                if (calendarModal) {
                    calendarModal.close();
                }

                if (timeModal) {
                    timeModal.close();
                }
            });
        });


    // =========================================================
    // Back Buttons
    // =========================================================

    document
        .getElementById('js-calendar-back')
        ?.addEventListener('click', () => {

            calendarModal.close();

            appointmentModal.showModal();
        });


    document
        .getElementById('js-time-back')
        ?.addEventListener('click', () => {

            timeModal.close();

            calendarModal.showModal();
        });


    // =========================================================
    // 1. Render Services
    // =========================================================

    function renderServices() {

        if (!servicesListContainer) {
            return;
        }


        servicesListContainer.innerHTML =
            servicesData
                .map(item => `

                    <li class="c-appointment-item">

                        <div class="c-appointment-item__info">

                            <h3 class="c-appointment-item__title">
                                ${item.title}
                            </h3>

                            <p class="c-appointment-item__doctor">

                                <i class="fas fa-user-md"></i>

                                ${item.doctor}

                            </p>

                        </div>


                        <button
                            type="button"
                            class="c-appointment-item__btn"
                            data-id="${item.id}"
                        >

                            <span>
                                انتخاب و نوبت‌گیری
                            </span>

                            <i class="fas fa-chevron-left"></i>

                        </button>

                    </li>

                `)
                .join('');


        servicesListContainer
            .querySelectorAll('.c-appointment-item__btn')
            .forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const serviceId =
                        parseInt(
                            e.currentTarget.dataset.id
                        );


                    const selected =
                        servicesData.find(
                            service => service.id === serviceId
                        );


                    if (!selected) {
                        return;
                    }


                    bookingState.service =
                        selected.title;

                    bookingState.doctor =
                        selected.doctor;


                    appointmentModal.close();


                    renderCalendar();

                    calendarModal.showModal();
                });
            });
    }


    // =========================================================
    // 2. Render Calendar
    // =========================================================

    function renderCalendar() {

        if (
            !calendarDaysGrid ||
            !calendarMonthLabel
        ) {
            return;
        }


        // -----------------------------------------------------
        // Month Label
        // -----------------------------------------------------

        calendarMonthLabel.textContent =
            `${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;


        // -----------------------------------------------------
        // Previous Month Button
        // -----------------------------------------------------

        const isCurrentOrPastMonth =
            (calendarYear < currentRealYear) ||
            (
                calendarYear === currentRealYear &&
                calendarMonth <= currentRealMonth
            );


        if (prevMonthBtn) {

            prevMonthBtn.disabled =
                isCurrentOrPastMonth;
        }


        // -----------------------------------------------------
        // Number of Days
        // -----------------------------------------------------

        const totalDays =
            getPersianMonthDays(
                calendarYear,
                calendarMonth
            );


        // -----------------------------------------------------
        // Calculate First Weekday
        // -----------------------------------------------------

        const startDayOfWeek =
            getMonthStartDay(
                calendarYear,
                calendarMonth
            );


        let daysHTML = '';


        // -----------------------------------------------------
        // Empty Cells Before First Day
        // -----------------------------------------------------

        for (
            let i = 0;
            i < startDayOfWeek;
            i++
        ) {

            daysHTML += `
                <div
                    class="c-calendar-day c-calendar-day--empty"
                ></div>
            `;
        }


        // -----------------------------------------------------
        // Render Days
        // -----------------------------------------------------

        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {

            const isPast =
                (calendarYear < currentRealYear) ||

                (
                    calendarYear === currentRealYear &&
                    calendarMonth < currentRealMonth
                ) ||

                (
                    calendarYear === currentRealYear &&
                    calendarMonth === currentRealMonth &&
                    day < currentRealDay
                );


            const isFullyBooked =
                !isPast &&
                calendarYear === currentRealYear &&
                calendarMonth === currentRealMonth &&
                fullyBookedDays.includes(day);


            let statusClass = '';

            let disabledAttr = '';

            let titleAttr = '';


            if (isPast) {

                statusClass =
                    'c-calendar-day--past';

                disabledAttr =
                    'disabled';

                titleAttr =
                    'تاریخ گذشته';

            } else if (isFullyBooked) {

                statusClass =
                    'c-calendar-day--booked';

                disabledAttr =
                    'disabled';

                titleAttr =
                    'ظرفیت تکمیل است';
            }


            daysHTML += `

                <button
                    type="button"
                    class="c-calendar-day ${statusClass}"
                    ${disabledAttr}
                    title="${titleAttr}"
                    data-day="${day}"
                >

                    <span>
                        ${toPersianNumber(day)}
                    </span>

                </button>

            `;
        }


        calendarDaysGrid.innerHTML =
            daysHTML;


        // -----------------------------------------------------
        // Add Events To Available Days
        // -----------------------------------------------------

        calendarDaysGrid
            .querySelectorAll(
                '.c-calendar-day:not([disabled]):not(.c-calendar-day--empty)'
            )
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    (e) => {

                        const day =
                            parseInt(
                                e.currentTarget.dataset.day
                            );


                        bookingState.date =
                            `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;


                        calendarModal.close();


                        renderTimeSlots();

                        timeModal.showModal();
                    }
                );
            });
    }


    // =========================================================
    // Calendar Navigation - Next
    // =========================================================

    if (nextMonthBtn) {

        nextMonthBtn.addEventListener(
            'click',
            () => {

                calendarMonth++;


                if (calendarMonth > 11) {

                    calendarMonth = 0;

                    calendarYear++;
                }


                renderCalendar();
            }
        );
    }


    // =========================================================
    // Calendar Navigation - Previous
    // =========================================================

    if (prevMonthBtn) {

        prevMonthBtn.addEventListener(
            'click',
            () => {

                const isCurrentOrPastMonth =
                    (calendarYear < currentRealYear) ||

                    (
                        calendarYear === currentRealYear &&
                        calendarMonth <= currentRealMonth
                    );


                if (!isCurrentOrPastMonth) {

                    calendarMonth--;


                    if (calendarMonth < 0) {

                        calendarMonth = 11;

                        calendarYear--;
                    }


                    renderCalendar();
                }
            }
        );
    }


    // =========================================================
    // 3. Render Time Slots
    // =========================================================

    function renderTimeSlots() {

        if (
            !timeSlotsGrid ||
            !bookingSummary
        ) {
            return;
        }


        bookingSummary.innerHTML = `

            <div class="c-booking-summary__item">

                <span class="c-booking-summary__label">
                    خدمت:
                </span>

                <span class="c-booking-summary__value">
                    ${bookingState.service}
                </span>

            </div>


            <div class="c-booking-summary__item">

                <span class="c-booking-summary__label">
                    پزشک:
                </span>

                <span class="c-booking-summary__value">
                    ${bookingState.doctor}
                </span>

            </div>


            <div class="c-booking-summary__item">

                <span class="c-booking-summary__label">
                    تاریخ:
                </span>

                <span class="c-booking-summary__value">
                    ${bookingState.date}
                </span>

            </div>

        `;


        timeSlotsGrid.innerHTML =
            timeSlotsData
                .map(slot => `

                    <button
                        type="button"
                        class="c-time-slot-btn ${
                            !slot.available
                                ? 'c-time-slot-btn--disabled'
                                : ''
                        }"
                        ${!slot.available ? 'disabled' : ''}
                        data-time="${slot.time}"
                    >

                        <i class="far fa-clock"></i>

                        <span>
                            ${slot.time}
                        </span>

                    </button>

                `)
                .join('');


        bookingState.timeSlot = null;


        timeSlotsGrid
            .querySelectorAll(
                '.c-time-slot-btn:not(.c-time-slot-btn--disabled)'
            )
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    (e) => {

                        timeSlotsGrid
                            .querySelectorAll(
                                '.c-time-slot-btn'
                            )
                            .forEach(button => {

                                button.classList.remove(
                                    'c-time-slot-btn--active'
                                );
                            });


                        e.currentTarget.classList.add(
                            'c-time-slot-btn--active'
                        );


                        bookingState.timeSlot =
                            e.currentTarget.dataset.time;
                    }
                );
            });
    }


    // =========================================================
    // Submit Booking Form
    // =========================================================

    if (bookingForm) {

        bookingForm.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();


                if (!bookingState.timeSlot) {

                    alert(
                        'لطفاً یک ساعت کاری خالی را انتخاب کنید.'
                    );

                    return;
                }


                alert(`
نوبت شما با موفقیت رزرو شد!

خدمت: ${bookingState.service}
پزشک: ${bookingState.doctor}
تاریخ: ${bookingState.date}
ساعت: ${bookingState.timeSlot}
                `);


                bookingForm.reset();


                bookingState = {
                    service: null,
                    doctor: null,
                    date: null,
                    timeSlot: null
                };


                timeModal.close();
            }
        );
    }

});
