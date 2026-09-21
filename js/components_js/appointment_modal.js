import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {

    const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const defaultTimeSlots = ['۰۹:۰۰ - ۱۰:۰۰', '۱۰:۰۰ - ۱۱:۰۰', '۱۱:۰۰ - ۱۲:۰۰', '۱۶:۰۰ - ۱۷:۰۰', '۱۷:۰۰ - ۱۸:۰۰', '۱۸:۰۰ - ۱۹:۰۰'];

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
            if (window.customModal) await window.customModal.alert('احراز هویت', 'لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.');
            return false;
        }
        return true;
    }

    function formatMoney(amount) {
        return Number(amount).toLocaleString('fa-IR');
    }

    function getTodayPersianDate() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
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
    let allServices = [];
    let allDoctors = [];

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

    // دریافت اطلاعات پایه (پزشکان و خدمات) برای نگاشت صحیح اسامی و قیمت‌ها
    async function fetchInitialData() {
        try {
            const [srvRes, docRes] = await Promise.all([
                supabase.from('services').select('*'),
                supabase.from('doctors').select('*')
            ]);
            if (srvRes.data) allServices = srvRes.data;
            if (docRes.data) allDoctors = docRes.data;
        } catch(e) { console.error(e); }
    }
    fetchInitialData();

    async function fetchServerAppointments() {
        try {
            if (window.appointmentsService && typeof window.appointmentsService.getAllAppointments === 'function') {
                serverAppointments = await window.appointmentsService.getAllAppointments();
            } else { serverAppointments = []; }
        } catch (err) { serverAppointments = []; }
    }

    function isPersianLeapYear(year) {
        const leapYears = [1395, 1399, 1403, 1408, 1412, 1416, 1420, 1424, 1428, 1433, 1437, 1441, 1445, 1453, 1458, 1462, 1466, 1470, 1474, 1479, 1483, 1487, 1491, 1495];
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
            startDay = (startDay + getPersianMonthDays(currentYear, currentMonth)) % 7;
            currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        }
        while (currentYear > year || (currentYear === year && currentMonth > month)) {
            currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            startDay = (startDay - (getPersianMonthDays(currentYear, currentMonth) % 7) + 7) % 7;
        }
        return startDay;
    }
    function toPersianNumber(value) {
        const numbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/\d/g, digit => numbers[digit]);
    }

    // --- مدیریت نوبت‌های من ---
    async function deleteAppointment(appointmentId) {
        let isConfirmed = false;
        if (window.customModal) {
            const res = await window.customModal.confirm('لغو نوبت', 'آیا از لغو این نوبت اطمینان دارید؟');
            isConfirmed = (res === 'confirm');
        }
        if (!isConfirmed) return;
        try {
            if (window.appointmentsService && typeof window.appointmentsService.cancelAppointment === 'function') {
                await window.appointmentsService.cancelAppointment(appointmentId);
                if (window.customModal) await window.customModal.alert('موفقیت', 'نوبت با موفقیت لغو شد.');
                await renderMyAppointments();
            }
        } catch (err) {
            if (window.customModal) await window.customModal.alert('خطا', 'خطا در حذف نوبت: ' + err.message);
        }
    }

    async function renderMyAppointments() {
        if (!myAppointmentsList) return;
        myAppointmentsList.style.maxHeight = '380px';
        myAppointmentsList.style.overflowY = 'auto';
        myAppointmentsList.style.paddingLeft = '5px';
        const currentUser = getCurrentUser();

        if (!currentUser) {
            myAppointmentsList.innerHTML = `<div style="text-align: center; padding: 30px 10px;"><i class="fas fa-user-lock" style="font-size: 44px; color: #a0aec0; margin-bottom: 12px;"></i><h4 style="font-size: 15px; font-weight: 600;">لطفاً ابتدا وارد حساب کاربری خود شوید</h4></div>`;
            return;
        }

        try {
            if (window.appointmentsService && typeof window.appointmentsService.getUserAppointments === 'function') {
                serverAppointments = await window.appointmentsService.getUserAppointments(currentUser.id);
            } else { await fetchServerAppointments(); }
        } catch (err) {}

        if (!serverAppointments || serverAppointments.length === 0) {
            myAppointmentsList.innerHTML = `<div style="text-align: center; padding: 30px 10px;"><i class="far fa-calendar-times" style="font-size: 48px; color: #a0aec0; margin-bottom: 15px;"></i><h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">هیچ نوبتی برای شما ثبت نشده است</h4></div>`;
        } else {
            myAppointmentsList.innerHTML = serverAppointments.map(app => {
                let statusColor = '#234e52'; let statusBg = '#e6fffa';
                if (app.status === 'در حال بررسی') { statusColor = '#975a16'; statusBg = '#feebc8'; }
                else if (app.status === 'رد شده' || app.status === 'کنسل شده') { statusColor = '#9b2c2c'; statusBg = '#fed7d7'; }

                const isPaid = app.payment_status === 'paid' || app.payment_status === 'prepaid' || app.payment_status === 'settled';

                return `
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 12px; background: #f8fafc; position: relative;">
                    ${app.status === 'در حال بررسی' ? `
                    <button type="button" class="js-delete-appointment" data-id="${app.id}" title="لغو نوبت" style="position: absolute; left: 12px; top: 12px; background: transparent; border: none; color: #e53e3e; font-size: 18px; cursor: pointer; padding: 2px 6px;"><i class="fas fa-times"></i></button>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-left: 25px;">
                        <strong style="color: #2d3748; font-size: 15px;">${app.serviceName || app.service}</strong>
                        <span style="background: ${statusBg}; color: ${statusColor}; font-size: 12px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">${app.status}</span>
                    </div>
                    <div style="font-size: 13px; color: #4a5568; line-height: 1.8;">
                        <div><i class="fas fa-user-md" style="margin-left: 6px; color: #3182ce;"></i> پزشک: <strong>${app.doctorName || app.doctor}</strong></div>
                        <div><i class="far fa-calendar-alt" style="margin-left: 6px; color: #3182ce;"></i> تاریخ: ${app.appointmentDate || app.date} | ${app.appointmentTime || app.time}</div>
                        ${isPaid ? `<div style="color:#10b981; font-weight:bold; margin-top:5px;"><i class="fas fa-check-circle"></i> پیش‌پرداخت انجام شده</div>` : ''}
                    </div>
                </div>
                `;
            }).join('');
            myAppointmentsList.querySelectorAll('.js-delete-appointment').forEach(btn => btn.addEventListener('click', (e) => deleteAppointment(e.currentTarget.dataset.id)));
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

    // --- لیست خدمات در مودال ---
    function renderServicesList(servicesArray) {
        if (!servicesListContainer) return;
        servicesListContainer.style.maxHeight = '350px';
        servicesListContainer.style.overflowY = 'auto';

        servicesListContainer.innerHTML = servicesArray.map(item => {
            // یافتن دقیق نام پزشک از آیدی آن
            let exactDoctorName = 'پزشک متخصص';
            const doc = allDoctors.find(d => String(d.id) === String(item.serviceDoctorId));
            if (doc) exactDoctorName = `دکتر ${doc.doctorName} ${doc.doctorFamily}`;

            return `
            <li class="c-appointment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #edf2f7;">
                <div class="c-appointment-item__info">
                    <h3 class="c-appointment-item__title" style="font-size: 15px; margin-bottom: 4px;">${item.serviceName || item.title}</h3>
                    <p class="c-appointment-item__doctor" style="font-size: 13px; color: #4a5568;">
                        <i class="fas fa-user-md" style="color: #3182ce; margin-left: 5px;"></i> پزشک: <strong>${exactDoctorName}</strong>
                    </p>
                </div>
                <button type="button" class="c-appointment-item__btn" data-title="${item.serviceName || item.title}" data-doctor="${exactDoctorName}">
                    <span>انتخاب و نوبت‌گیری</span>
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `}).join('');

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
                if (serviceIdStr && allServices.length > 0) {
                    const foundService = allServices.find(s => String(s.id) === String(serviceIdStr));
                    if (foundService) {
                        bookingState.service = foundService.serviceName;

                        let exactDoctorName = 'پزشک متخصص';
                        const doc = allDoctors.find(d => String(d.id) === String(foundService.serviceDoctorId));
                        if (doc) exactDoctorName = `دکتر ${doc.doctorName} ${doc.doctorFamily}`;

                        bookingState.doctor = exactDoctorName;
                        await renderCalendar();
                        if (calendarModal) calendarModal.showModal();
                        return;
                    }
                }
                renderServicesList(allServices);
                if (appointmentModal) appointmentModal.showModal();
            } catch (err) {}
        },
        openForDoctor: async (doctorName, doctorId) => {
            if (!(await checkUserAuth())) return;
            bookingState.doctorId = doctorId;
            bookingState.doctor = doctorName;
            try {
                const docServices = allServices.filter(s => String(s.serviceDoctorId) === String(doctorId));
                if (docServices.length > 0) {
                    renderServicesList(docServices);
                } else {
                    renderServicesList([{ id: 1, serviceName: 'ویزیت و مشاوره تخصصی', serviceDoctorId: doctorId }]);
                }
                if (appointmentModal) appointmentModal.showModal();
            } catch (err) {}
        }
    };

    // --- تقویم و ساعات ---
    async function renderCalendar() {
        if (!calendarDaysGrid || !calendarMonthLabel) return;
        await fetchServerAppointments();

        calendarMonthLabel.textContent = `${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
        const isCurrentOrPastMonth = (calendarYear < currentRealYear) || (calendarYear === currentRealYear && calendarMonth <= currentRealMonth);
        if (prevMonthBtn) prevMonthBtn.disabled = isCurrentOrPastMonth;

        const totalDays = getPersianMonthDays(calendarYear, calendarMonth);
        const startDayOfWeek = getMonthStartDay(calendarYear, calendarMonth);

        let daysHTML = '';
        for (let i = 0; i < startDayOfWeek; i++) daysHTML += `<div class="c-calendar-day c-calendar-day--empty"></div>`;

        for (let day = 1; day <= totalDays; day++) {
            const formattedDateStr = `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
            const isToday = (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day === currentRealDay);
            const isPast = (calendarYear < currentRealYear) || (calendarYear === currentRealYear && calendarMonth < currentRealMonth) || (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day < currentRealDay);

            const bookedTimesForDay = serverAppointments.filter(app => {
                const isApprovedOrPending = (app.status === 'تایید شده' || app.status === 'در حال بررسی');
                return isApprovedOrPending && app.appointmentDate === formattedDateStr && (!bookingState.doctor || app.doctorName === bookingState.doctor);
            });

            const isFullyBooked = !isPast && (bookedTimesForDay.length >= defaultTimeSlots.length);
            let statusClass = ''; let disabledAttr = ''; let titleAttr = '';

            if (isToday) { statusClass += ' c-calendar-day--today'; titleAttr = 'امروز'; }
            if (isPast) { statusClass += ' c-calendar-day--past'; disabledAttr = 'disabled'; titleAttr = 'تاریخ گذشته'; }
            else if (isFullyBooked) { statusClass += ' c-calendar-day--booked'; disabledAttr = 'disabled'; titleAttr = 'ظرفیت تکمیل است'; }

            daysHTML += `<button type="button" class="c-calendar-day ${statusClass}" ${disabledAttr} title="${titleAttr}" data-day="${day}"><span>${toPersianNumber(day)}</span></button>`;
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

    if (nextMonthBtn) nextMonthBtn.addEventListener('click', async () => { calendarMonth++; if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; } await renderCalendar(); });
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', async () => { const isCurrentOrPastMonth = (calendarYear < currentRealYear) || (calendarYear === currentRealYear && calendarMonth <= currentRealMonth); if (!isCurrentOrPastMonth) { calendarMonth--; if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; } await renderCalendar(); }});

    function renderTimeSlots() {
        if (!timeSlotsGrid || !bookingSummary) return;
        bookingSummary.innerHTML = `
            <div class="c-booking-summary__item"><span class="c-booking-summary__label">خدمت:</span><span class="c-booking-summary__value">${bookingState.service}</span></div>
            <div class="c-booking-summary__item"><span class="c-booking-summary__label">پزشک:</span><span class="c-booking-summary__value">${bookingState.doctor}</span></div>
            <div class="c-booking-summary__item"><span class="c-booking-summary__label">تاریخ:</span><span class="c-booking-summary__value">${bookingState.date}</span></div>
        `;

        const reservedTimes = serverAppointments.filter(app => {
            const isApprovedOrPending = (app.status === 'تایید شده' || app.status === 'در حال بررسی');
            return isApprovedOrPending && app.appointmentDate === bookingState.date && (!bookingState.doctor || app.doctorName === bookingState.doctor);
        }).map(app => app.appointmentTime);

        timeSlotsGrid.innerHTML = defaultTimeSlots.map(timeStr => {
            const isReserved = reservedTimes.includes(timeStr);
            return `<button type="button" class="c-time-slot-btn ${isReserved ? 'c-time-slot-btn--disabled' : ''}" ${isReserved ? 'disabled' : ''} data-time="${timeStr}"><i class="far fa-clock"></i><span>${timeStr}</span></button>`;
        }).join('');

        bookingState.timeSlot = null;
        timeSlotsGrid.querySelectorAll('.c-time-slot-btn:not(.c-time-slot-btn--disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeSlotsGrid.querySelectorAll('.c-time-slot-btn').forEach(b => b.classList.remove('c-time-slot-btn--active'));
                e.currentTarget.classList.add('c-time-slot-btn--active');
                bookingState.timeSlot = e.currentTarget.dataset.time;
            });
        });
    }

    // --- مدیریت پرداخت و فرم ثبت نهایی ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser) return;
            if (!bookingState.timeSlot) {
                if (window.customModal) await window.customModal.alert('انتخاب زمان', 'لطفاً یک ساعت کاری خالی را انتخاب کنید.');
                return;
            }

            // پیدا کردن قیمت خدمت انتخابی
            const selectedServiceObj = allServices.find(s => s.serviceName === bookingState.service);
            const totalPrice = selectedServiceObj ? selectedServiceObj.price : 0;
            const prepayment = selectedServiceObj ? selectedServiceObj.prepayment : 0;

            if (prepayment > 0) {
                renderInvoiceAndPayment(totalPrice, prepayment);
            } else {
                saveAppointmentToDB(totalPrice, 0, 'unpaid');
            }
        });
    }

    function renderInvoiceAndPayment(total, prepay) {
        const formContainer = bookingForm.parentElement;
        bookingForm.style.display = 'none'; // مخفی کردن فرم اصلی

        const invoiceDiv = document.createElement('div');
        invoiceDiv.id = 'js-invoice-container';
        invoiceDiv.innerHTML = `
            <div style="text-align:center; padding:10px 15px;">
                <div style="width:60px; height:60px; background:#e0f2fe; color:var(--color-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; margin:0 auto 15px;">
                    <i class="fas fa-file-invoice-dollar"></i>
                </div>
                <h3 style="margin-bottom:20px; color:var(--color-dark);">پیش‌فاکتور و تایید نهایی</h3>

                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:25px; text-align:right;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed #cbd5e1; padding-bottom:10px;">
                        <span style="color:#64748b; font-size:14px;">خدمت انتخابی:</span>
                        <strong style="color:var(--color-dark);">${bookingState.service}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed #cbd5e1; padding-bottom:10px;">
                        <span style="color:#64748b; font-size:14px;">پزشک معالج:</span>
                        <strong style="color:var(--color-dark);">${bookingState.doctor}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed #cbd5e1; padding-bottom:10px;">
                        <span style="color:#64748b; font-size:14px;">تاریخ و زمان:</span>
                        <strong style="color:var(--color-dark);">${bookingState.date} - ${bookingState.timeSlot}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="color:#64748b; font-size:14px;">هزینه کل درمان:</span>
                        <strong style="color:var(--color-dark);">${formatMoney(total)} تومان</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; background:#dcfce7; padding:15px; border-radius:8px; margin-top:15px; align-items:center;">
                        <span style="color:#166534; font-weight:bold; font-size:15px;">مبلغ قابل پرداخت (بیعانه):</span>
                        <strong style="color:#166534; font-size:18px;">${formatMoney(prepay)} <span style="font-size:12px;">تومان</span></strong>
                    </div>
                </div>

                <button id="js-pay-btn" class="c-btn c-btn--primary" style="width:100%; font-size:16px; padding:14px; box-shadow:0 4px 15px rgba(14,165,233,0.3);">
                    <i class="fas fa-credit-card" style="margin-left:8px;"></i> پرداخت و ثبت قطعی نوبت
                </button>
                <button id="js-cancel-pay" class="c-btn" style="width:100%; margin-top:12px; background:transparent; color:#64748b; border:1px solid #cbd5e1;">انصراف و بازگشت</button>
            </div>
        `;
        formContainer.appendChild(invoiceDiv);

        document.getElementById('js-cancel-pay').addEventListener('click', (e) => {
            e.preventDefault();
            invoiceDiv.remove();
            bookingForm.style.display = 'block'; // بازگرداندن فرم
        });

        document.getElementById('js-pay-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            const btn = e.currentTarget;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-left:8px;"></i> در حال اتصال به درگاه پرداخت...';
            btn.disabled = true;
            btn.style.opacity = '0.8';

            // شبیه‌سازی درگاه (2.5 ثانیه مکث)
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check-circle" style="margin-left:8px;"></i> پرداخت با موفقیت انجام شد!';
                btn.style.background = '#10b981'; // سبز
                btn.style.boxShadow = 'none';

                setTimeout(() => {
                    saveAppointmentToDB(total, prepay, 'prepaid');
                }, 1000);
            }, 2500);
        });
    }

    async function saveAppointmentToDB(totalPrice, paidAmount, paymentStatus) {
        const currentUser = getCurrentUser();
        const patientNameInput = document.getElementById('booking-name');
        const patientPhoneInput = document.getElementById('booking-phone');
        const patientNotesInput = document.getElementById('booking-notes');

        // اگر پرداخت شده باشد مستقیماً تایید می‌شود، وگرنه نیاز به تایید منشی دارد
        const finalStatus = paymentStatus === 'prepaid' ? 'تایید شده' : 'در حال بررسی';

        const payload = {
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            userId: currentUser.id || null,
            patient_name: patientNameInput ? patientNameInput.value.trim() : currentUser.userName,
            patient_phone: patientPhoneInput ? patientPhoneInput.value.trim() : '',
            patient_notes: patientNotesInput ? patientNotesInput.value.trim() : '',
            serviceName: bookingState.service,
            doctorName: bookingState.doctor,
            doctorId: bookingState.doctorId || null,
            appointmentDate: bookingState.date,
            appointmentTime: bookingState.timeSlot,
            status: finalStatus,
            total_price: totalPrice,
            paid_amount: paidAmount,
            payment_status: paymentStatus
        };

        try {
            const { error } = await supabase.from('appointments').insert([payload]);
            if (error) throw error;

            const formContainer = bookingForm.parentElement;
            formContainer.innerHTML = `
                <div style="text-align:center; padding:30px 20px;">
                    <i class="fas fa-check-circle" style="font-size:50px; color:#10b981; margin-bottom:20px;"></i>
                    <h3 style="color:var(--color-dark); margin-bottom:10px;">نوبت شما با موفقیت ثبت شد</h3>
                    <p style="color:#64748b; font-size:14px; line-height:1.6;">${paymentStatus === 'prepaid' ? 'پرداخت شما تایید شد و نوبت قطعی گردید.' : 'نوبت در صف بررسی منشی قرار گرفت.'}</p>
                    <button class="c-btn c-btn--primary js-close-success" style="margin-top:25px; padding:10px 30px;">متوجه شدم</button>
                </div>
            `;

            document.querySelector('.js-close-success').addEventListener('click', () => {
                window.location.reload();
            });

        } catch (error) {
            if (window.customModal) await window.customModal.alert('خطا', 'خطا در ثبت نوبت: ' + error.message);
        }
    }
});
