document.addEventListener('DOMContentLoaded', () => {

    const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
        'مرداد', 'شهریور', 'مهر', 'آبان',
        'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const defaultTimeSlots = [
        '۰۹:۰۰ - ۱۰:۰۰',
        '۱۰:۰۰ - ۱۱:۰۰',
        '۱۱:۰۰ - ۱۲:۰۰',
        '۱۶:۰۰ - ۱۷:۰۰',
        '۱۷:۰۰ - ۱۸:۰۰',
        '۱۸:۰۰ - ۱۹:۰۰'
    ];

    function getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('loggedInUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    }

    async function checkUserAuth() {
        const user = getCurrentUser();
        if (!user) {
            if (window.customModal) {
                await window.customModal.alert('احراز هویت', 'لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.');
            } else {
                alert('لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.');
            }
            return false;
        }
        return true;
    }

    function getTodayPersianDate() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(now);

        let year, month, day;
        parts.forEach(part => {
            if (part.type === 'year') year = parseInt(part.value, 10);
            if (part.type === 'month') month = parseInt(part.value, 10) - 1;
            if (part.type === 'day') day = parseInt(part.value, 10);
        });

        return { year, month, day };
    }

    const realDate = getTodayPersianDate();
    const currentRealYear = realDate.year;
    const currentRealMonth = realDate.month;
    const currentRealDay = realDate.day;

    let calendarYear = currentRealYear;
    let calendarMonth = currentRealMonth;

    const baseYear = 1405;
    const baseMonth = 0;
    const baseMonthStartDay = 0;

    let bookingState = {
        service: null,
        doctor: null,
        doctorId: null,
        date: null,
        timeSlot: null
    };

    let serverAppointments = [];

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

    async function fetchServerAppointments() {
        try {
            if (window.appointmentsService && typeof window.appointmentsService.getAllAppointments === 'function') {
                serverAppointments = await window.appointmentsService.getAllAppointments();
            } else {
                serverAppointments = [];
            }
        } catch (err) {
            console.error('خطا در دریافت نوبت‌ها از سرور:', err);
            serverAppointments = [];
        }
    }

    function isPersianLeapYear(year) {
        const leapYears = [
            1395, 1399, 1403, 1408, 1412, 1416, 1420, 1424, 1428,
            1433, 1437, 1441, 1445, 1453, 1458, 1462, 1466,
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
        let startDay = (baseMonthStartDay + 5) % 7;
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

    // لغو نوبت با استفاده از cancelAppointment
    async function deleteAppointment(appointmentId) {
        let isConfirmed = false;

        if (window.customModal) {
            const res = await window.customModal.confirm('لغو نوبت', 'آیا از لغو این نوبت اطمینان دارید؟');
            isConfirmed = (res === 'confirm');
        } else {
            isConfirmed = confirm('آیا از لغو این نوبت اطمینان دارید؟');
        }

        if (!isConfirmed) return;

        try {
            if (window.appointmentsService && typeof window.appointmentsService.cancelAppointment === 'function') {
                await window.appointmentsService.cancelAppointment(appointmentId);

                if (window.customModal) {
                    await window.customModal.alert('موفقیت', 'نوبت با موفقیت لغو شد.');
                } else {
                    alert('نوبت با موفقیت لغو شد.');
                }

                await renderMyAppointments();
            } else {
                if (window.customModal) {
                    await window.customModal.alert('خطا', 'سرویس نوبت‌دهی در دسترس نیست.');
                } else {
                    alert('سرویس نوبت‌دهی در دسترس نیست.');
                }
            }
        } catch (err) {
            console.error('خطا در حذف نوبت:', err);
            if (window.customModal) {
                await window.customModal.alert('خطا', 'خطا در حذف نوبت: ' + err.message);
            } else {
                alert('خطا در حذف نوبت: ' + err.message);
            }
        }
    }

    async function renderMyAppointments() {
        if (!myAppointmentsList) return;

        myAppointmentsList.style.maxHeight = '380px';
        myAppointmentsList.style.overflowY = 'auto';
        myAppointmentsList.style.paddingLeft = '5px';

        const currentUser = getCurrentUser();

        if (!currentUser) {
            myAppointmentsList.innerHTML = `
                <div style="text-align: center; padding: 30px 10px;">
                    <i class="fas fa-user-lock" style="font-size: 44px; color: #a0aec0; margin-bottom: 12px;"></i>
                    <h4 style="font-size: 15px; font-weight: 600;">لطفاً ابتدا وارد حساب کاربری خود شوید</h4>
                </div>
            `;
            return;
        }

        try {
            if (window.appointmentsService && typeof window.appointmentsService.getUserAppointments === 'function') {
                serverAppointments = await window.appointmentsService.getUserAppointments(currentUser.id);
            } else {
                await fetchServerAppointments();
            }
        } catch (err) {
            console.error('خطا در دریافت نوبت‌های کاربر:', err);
        }

        if (!serverAppointments || serverAppointments.length === 0) {
            myAppointmentsList.innerHTML = `
                <div style="text-align: center; padding: 30px 10px;">
                    <i class="far fa-calendar-times" style="font-size: 48px; color: #a0aec0; margin-bottom: 15px;"></i>
                    <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">هیچ نوبت فعالی برای ${currentUser.fullName || currentUser.username || 'شما'} ثبت نشده است</h4>
                    <p style="font-size: 13px; color: #718096;">برای ثبت نوبت می‌توانید از بخش خدمات اقدام کنید.</p>
                </div>
            `;
        } else {
            myAppointmentsList.innerHTML = serverAppointments.map(app => `
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 12px; background: #f8fafc; position: relative;">
                    <button type="button" class="js-delete-appointment" data-id="${app.id}" title="لغو نوبت" style="position: absolute; left: 12px; top: 12px; background: transparent; border: none; color: #e53e3e; font-size: 18px; cursor: pointer; padding: 2px 6px; border-radius: 4px;">
                        <i class="fas fa-times"></i>
                    </button>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-left: 25px;">
                        <strong style="color: #2d3748; font-size: 15px;">${app.serviceName || app.service}</strong>
                        <span style="background: #e6fffa; color: #234e52; font-size: 12px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">${app.status || 'تایید شده'}</span>
                    </div>
                    <div style="font-size: 13px; color: #4a5568; line-height: 1.8;">
                        <div><i class="fas fa-user-md" style="margin-left: 6px; color: #3182ce;"></i> پزشک: <strong>${app.doctorName || app.doctor}</strong></div>
                        <div><i class="far fa-calendar-alt" style="margin-left: 6px; color: #3182ce;"></i> تاریخ: ${app.appointmentDate || app.date}</div>
                        <div><i class="far fa-clock" style="margin-left: 6px; color: #3182ce;"></i> ساعت: ${app.appointmentTime || app.time}</div>
                    </div>
                </div>
            `).join('');

            myAppointmentsList.querySelectorAll('.js-delete-appointment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    deleteAppointment(id);
                });
            });
        }
    }

    const navAppointmentsBtn = document.getElementById('js-nav-appointments');
    if (navAppointmentsBtn) {
        navAppointmentsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await renderMyAppointments();
            if (myAppointmentsModal) myAppointmentsModal.showModal();
        });
    }

    document.querySelectorAll('.js-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (appointmentModal) appointmentModal.close();
            if (calendarModal) calendarModal.close();
            if (timeModal) timeModal.close();
            if (myAppointmentsModal) myAppointmentsModal.close();
        });
    });

    document.getElementById('js-calendar-back')?.addEventListener('click', () => {
        if (calendarModal) calendarModal.close();
        if (appointmentModal) appointmentModal.showModal();
    });

    document.getElementById('js-time-back')?.addEventListener('click', () => {
        if (timeModal) timeModal.close();
        if (calendarModal) calendarModal.showModal();
    });

    function renderServicesList(servicesArray) {
        if (!servicesListContainer) return;

        servicesListContainer.style.maxHeight = '350px';
        servicesListContainer.style.overflowY = 'auto';

        servicesListContainer.innerHTML = servicesArray.map(item => `
            <li class="c-appointment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #edf2f7;">
                <div class="c-appointment-item__info">
                    <h3 class="c-appointment-item__title" style="font-size: 15px; margin-bottom: 4px;">${item.serviceName || item.title}</h3>
                    <p class="c-appointment-item__doctor" style="font-size: 13px; color: #4a5568;">
                        <i class="fas fa-user-md" style="color: #3182ce; margin-left: 5px;"></i>
                        پزشک: <strong>${item.doctorName || item.doctor || 'پزشک متخصص'}</strong>
                    </p>
                </div>

                <button type="button" class="c-appointment-item__btn" data-title="${item.serviceName || item.title}" data-doctor="${item.doctorName || item.doctor}">
                    <span>انتخاب و نوبت‌گیری</span>
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `).join('');

        servicesListContainer.querySelectorAll('.c-appointment-item__btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!(await checkUserAuth())) return;

                const targetBtn = e.currentTarget;
                bookingState.service = targetBtn.dataset.title;
                bookingState.doctor = targetBtn.dataset.doctor;

                if (appointmentModal) appointmentModal.close();
                await renderCalendar();
                if (calendarModal) calendarModal.showModal();
            });
        });
    }

    window.AppointmentModal = {
        openForService: async (serviceIdStr) => {
            if (!(await checkUserAuth())) return;

            try {
                let services = [];
                if (window.servicesService && typeof window.servicesService.getAllServices === 'function') {
                    services = await window.servicesService.getAllServices();
                } else {
                    services = [
                        { id: '1', serviceName: 'ایمپلنت تخصصی دندان', doctorName: 'دکتر رضا محمدی' },
                        { id: '2', serviceName: 'طراحی تخصصی لبخند', doctorName: 'دکتر سارا احمدی' },
                        { id: '3', serviceName: 'ارتودنسی و تراز دندان', doctorName: 'دکتر مریم کاظمی' }
                    ];
                }

                if (serviceIdStr) {
                    const foundService = services.find(s => String(s.id) === String(serviceIdStr));
                    if (foundService) {
                        bookingState.service = foundService.serviceName || foundService.title;
                        bookingState.doctor = foundService.doctorName || foundService.doctor || 'پزشک متخصص';
                        await renderCalendar();
                        if (calendarModal) calendarModal.showModal();
                        return;
                    }
                }

                renderServicesList(services);
                if (appointmentModal) appointmentModal.showModal();

            } catch (err) {
                console.error('خطا در دریافت لیست خدمات:', err);
            }
        },

        openForDoctor: async (doctorName, doctorId) => {
            if (!(await checkUserAuth())) return;

            bookingState.doctorId = doctorId;
            bookingState.doctor = doctorName;

            try {
                let services = [];
                if (window.servicesService && typeof window.servicesService.getAllServices === 'function') {
                    services = await window.servicesService.getAllServices();
                } else {
                    services = [
                        { id: '1', serviceName: 'ویزیت و مشاوره تخصصی', doctorName: doctorName }
                    ];
                }

                const docServices = services.filter(s => String(s.doctorId) === String(doctorId) || s.doctorName === doctorName);

                if (docServices.length > 0) {
                    renderServicesList(docServices);
                } else {
                    renderServicesList([{ id: 1, serviceName: 'ویزیت و مشاوره تخصصی', doctorName: doctorName }]);
                }

                if (appointmentModal) appointmentModal.showModal();
            } catch (err) {
                console.error(err);
            }
        }
    };

    async function renderCalendar() {
        if (!calendarDaysGrid || !calendarMonthLabel) return;

        await fetchServerAppointments();

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
            const formattedDateStr = `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;

            const isToday = (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day === currentRealDay);

            const isPast = (calendarYear < currentRealYear) ||
                (calendarYear === currentRealYear && calendarMonth < currentRealMonth) ||
                (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day < currentRealDay);

            const bookedTimesForDay = serverAppointments.filter(app => {
                const appDate = app.appointmentDate || app.date;
                const appDoc = app.doctorName || app.doctor;
                return appDate === formattedDateStr && (!bookingState.doctor || appDoc === bookingState.doctor);
            });

            const isFullyBooked = !isPast && (bookedTimesForDay.length >= defaultTimeSlots.length);

            let statusClass = '';
            let disabledAttr = '';
            let titleAttr = '';

            if (isToday) {
                statusClass += ' c-calendar-day--today';
                titleAttr = 'امروز';
            }

            if (isPast) {
                statusClass += ' c-calendar-day--past';
                disabledAttr = 'disabled';
                titleAttr = 'تاریخ گذشته';
            } else if (isFullyBooked) {
                statusClass += ' c-calendar-day--booked';
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

                if (calendarModal) calendarModal.close();
                renderTimeSlots();
                if (timeModal) timeModal.showModal();
            });
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', async () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            await renderCalendar();
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', async () => {
            const isCurrentOrPastMonth = (calendarYear < currentRealYear) ||
                (calendarYear === currentRealYear && calendarMonth <= currentRealMonth);

            if (!isCurrentOrPastMonth) {
                calendarMonth--;
                if (calendarMonth < 0) {
                    calendarMonth = 11;
                    calendarYear--;
                }
                await renderCalendar();
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

        const reservedTimes = serverAppointments
            .filter(app => {
                const appDate = app.appointmentDate || app.date;
                const appDoc = app.doctorName || app.doctor;
                return appDate === bookingState.date && (!bookingState.doctor || appDoc === bookingState.doctor);
            })
            .map(app => app.appointmentTime || app.time);

        timeSlotsGrid.innerHTML = defaultTimeSlots.map(timeStr => {
            const isReserved = reservedTimes.includes(timeStr);
            return `
                <button type="button" class="c-time-slot-btn ${isReserved ? 'c-time-slot-btn--disabled' : ''}" ${isReserved ? 'disabled' : ''} data-time="${timeStr}">
                    <i class="far fa-clock"></i>
                    <span>${timeStr}</span>
                </button>
            `;
        }).join('');

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
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentUser = getCurrentUser();
            if (!currentUser) {
                if (window.customModal) {
                    await window.customModal.alert('احراز هویت', 'برای ثبت نوبت باید ابتدا وارد حساب کاربری خود شوید.');
                } else {
                    alert('برای ثبت نوبت باید ابتدا وارد حساب کاربری خود شوید.');
                }
                return;
            }

            if (!bookingState.timeSlot) {
                if (window.customModal) {
                    await window.customModal.alert('انتخاب زمان', 'لطفاً یک ساعت کاری خالی را انتخاب کنید.');
                } else {
                    alert('لطفاً یک ساعت کاری خالی را انتخاب کنید.');
                }
                return;
            }

            const payload = {
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                userId: currentUser.id || null,
                serviceName: bookingState.service,
                doctorName: bookingState.doctor,
                doctorId: bookingState.doctorId || null,
                appointmentDate: bookingState.date,
                appointmentTime: bookingState.timeSlot,
                status: 'تایید شده'
            };

            try {
                if (window.appointmentsService && typeof window.appointmentsService.createAppointment === 'function') {
                    await window.appointmentsService.createAppointment(payload);

                    if (window.customModal) {
                        await window.customModal.alert('موفقیت', 'نوبت شما با موفقیت ثبت شد!');
                    } else {
                        alert('نوبت شما با موفقیت ثبت شد!');
                    }

                    bookingForm.reset();
                    bookingState = { service: null, doctor: null, doctorId: null, date: null, timeSlot: null };
                    if (timeModal) timeModal.close();
                } else {
                    if (window.customModal) {
                        await window.customModal.alert('خطا', 'سرویس ثبت نوبت فعال نیست.');
                    } else {
                        alert('سرویس ثبت نوبت فعال نیست.');
                    }
                }
            } catch (err) {
                console.error('خطا در ثبت نوبت:', err);
                if (window.customModal) {
                    await window.customModal.alert('خطا', 'خطا در ثبت نوبت: ' + err.message);
                } else {
                    alert('خطا در ثبت نوبت: ' + err.message);
                }
            }
        });
    }

});
