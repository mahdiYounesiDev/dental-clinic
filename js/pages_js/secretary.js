import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('js-appointments-tbody');
    const filterBtns = document.querySelectorAll('.s-btn-filter');
    const doctorFilter = document.getElementById('js-doctor-filter');
    const searchInput = document.getElementById('js-search-input');
    const logoutBtn = document.getElementById('js-secretary-logout');

    // UI Elements
    const statToday = document.getElementById('js-stat-today');
    const statPending = document.getElementById('js-stat-pending');
    const statCancelled = document.getElementById('js-stat-cancelled');
    const notifBadge = document.getElementById('js-notif-badge');
    const toast = document.getElementById('js-toast');

    // Modals
    const walkinModal = document.getElementById('js-walkin-modal');
    const historyModal = document.getElementById('js-history-modal');
    const historyContent = document.getElementById('js-history-content');

    let allAppointments = [];
    let doctorsList = [];
    let allUsers = [];

    // وضعیت رزرو منشی
    let walkinState = {
        userId: null,
        patientName: '',
        patientPhone: '',
        date: null,
        time: null
    };

    const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const defaultTimeSlots = ['۰۹:۰۰ - ۱۰:۰۰', '۱۰:۰۰ - ۱۱:۰۰', '۱۱:۰۰ - ۱۲:۰۰', '۱۶:۰۰ - ۱۷:۰۰', '۱۷:۰۰ - ۱۸:۰۰', '۱۸:۰۰ - ۱۹:۰۰'];

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = formatter.formatToParts(now);
    let currentRealYear, currentRealMonth, currentRealDay;
    parts.forEach(p => {
        if (p.type === 'year') currentRealYear = parseInt(p.value, 10);
        if (p.type === 'month') currentRealMonth = parseInt(p.value, 10) - 1;
        if (p.type === 'day') currentRealDay = parseInt(p.value, 10);
    });

    let calendarYear = currentRealYear;
    let calendarMonth = currentRealMonth;

    // بررسی احراز هویت
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) { window.location.href = '../pages/login.html'; return; }
    const user = JSON.parse(userRaw);

    if (user.role !== 'admin' && user.role !== 'secretary') {
        window.location.href = '../index.html';
        return;
    }
    document.getElementById('js-secretary-name').textContent = `${user.userName} عزیز`;

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.authService) await window.authService.logoutUser();
        window.location.href = '../index.html';
    });

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function toPersianNumber(value) {
        const numbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/\d/g, digit => numbers[digit]);
    }

    async function fetchData() {
        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">در حال دریافت اطلاعات...</td></tr>';

            // دریافت لیست پزشکان
            if (window.doctorsService) {
                doctorsList = await window.doctorsService.getAllDoctors();
                updateDoctorDropdown();
                const walkinDocSelect = document.getElementById('walkin-doctor');
                if(walkinDocSelect && doctorsList.length > 0) {
                    walkinDocSelect.innerHTML = doctorsList.map(d => `<option value="دکتر ${d.doctorName} ${d.doctorFamily}">دکتر ${d.doctorName} ${d.doctorFamily}</option>`).join('');
                }
            }

            // دریافت لیست نوبت‌ها
            allAppointments = await window.appointmentsService.getAllAppointments();

            // دریافت کل کاربران برای سرچ
            const { data: usersData } = await supabase.from('users').select('*');
            if (usersData) allUsers = usersData;

            updateStats();
            applyFilters();
        } catch (err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red;">خطا: ${err.message}</td></tr>`;
        }
    }

    function updateDoctorDropdown() {
        const currentVal = doctorFilter.value;
        doctorFilter.innerHTML = '<option value="all">همه پزشکان</option>';
        doctorsList.forEach(doc => {
            const docName = `دکتر ${doc.doctorName} ${doc.doctorFamily}`;
            const pendingCount = allAppointments.filter(a => a.doctorName === docName && a.status === 'در حال بررسی').length;
            const option = document.createElement('option');
            option.value = docName;
            option.textContent = pendingCount > 0 ? `${docName} (${pendingCount} جدید)` : docName;
            doctorFilter.appendChild(option);
        });
        doctorFilter.value = currentVal;
    }

    function updateStats() {
        const todayStr = `${toPersianNumber(currentRealDay)} ${persianMonths[currentRealMonth]} ${toPersianNumber(currentRealYear)}`;

        let todayCount = 0, pendingCount = 0, cancelledCount = 0;

        allAppointments.forEach(app => {
            if (app.status === 'در حال بررسی') pendingCount++;
            if (app.status === 'رد شده' || app.status === 'کنسل شده') cancelledCount++;
            if (app.appointmentDate === todayStr) todayCount++;
        });

        statToday.textContent = toPersianNumber(todayCount);
        statPending.textContent = toPersianNumber(pendingCount);
        statCancelled.textContent = toPersianNumber(cancelledCount);

        if (pendingCount > 0) {
            notifBadge.style.display = 'block';
            notifBadge.textContent = toPersianNumber(pendingCount);
        } else {
            notifBadge.style.display = 'none';
        }
        updateDoctorDropdown();
    }

    function applyFilters() {
        const activeStatusBtn = document.querySelector('.s-btn-filter.active');
        const statusFilter = activeStatusBtn ? activeStatusBtn.dataset.filter : 'all';
        const docFilterValue = doctorFilter.value;
        const searchQuery = searchInput.value.trim().toLowerCase();

        let filtered = allAppointments;

        if (statusFilter === 'pending') filtered = filtered.filter(a => a.status === 'در حال بررسی');
        if (statusFilter === 'approved') filtered = filtered.filter(a => a.status === 'تایید شده');
        if (docFilterValue !== 'all') filtered = filtered.filter(a => a.doctorName === docFilterValue);

        if (searchQuery) {
            filtered = filtered.filter(a => {
                const name = (a.patient_name || '').toLowerCase();
                const phone = (a.patient_phone || '').toLowerCase();
                return name.includes(searchQuery) || phone.includes(searchQuery);
            });
        }

        renderTable(filtered);
    }

    function renderTable(filteredData) {
        tbody.innerHTML = '';
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 40px 0; color: #64748b;">هیچ نوبتی یافت نشد.</td></tr>';
            return;
        }

        filteredData.forEach(app => {
            let statusClass = 'pending';
            if (app.status === 'تایید شده') statusClass = 'approved';
            if (app.status === 'رد شده' || app.status === 'کنسل شده') statusClass = 'rejected';

            const patientName = app.patient_name || 'ثبت نشده';
            const phoneStr = app.patient_phone || '';
            const waLink = phoneStr ? `https://wa.me/98${phoneStr.substring(1)}` : '#';
            const callLink = phoneStr ? `tel:${phoneStr}` : '#';
            const isPaid = app.payment_status === 'paid';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="s-patient-name js-open-history" data-phone="${phoneStr}" data-name="${patientName}">${patientName}</div>
                    ${phoneStr ? `
                    <div class="s-contact-links">
                        <a href="${waLink}" target="_blank" class="s-contact-btn wa" title="واتس‌اپ"><i class="fab fa-whatsapp"></i></a>
                        <a href="${callLink}" class="s-contact-btn call" title="تماس"><i class="fas fa-phone-alt"></i></a>
                        <span style="font-size:11px; color:#64748b; line-height:26px;">${toPersianNumber(phoneStr)}</span>
                    </div>` : '<small style="color:#94a3b8;">بدون شماره</small>'}
                </td>
                <td>
                    <div style="font-weight:600; color:#334155;">${app.serviceName || 'ویزیت عمومی'}</div>
                    <div style="font-size:12px; color:var(--color-primary);"><i class="fas fa-user-md"></i> ${app.doctorName || '-'}</div>
                </td>
                <td>
                    <div style="font-size: 14px; color:#334155; display:flex; align-items:center; gap:6px;">
                        <i class="far fa-calendar-alt" style="color:#0284c7;"></i> <span>${app.appointmentDate}</span>
                    </div>
                    <div style="font-size: 13px; color:#64748b; display:flex; align-items:center; gap:6px; margin-top:4px;">
                        <i class="far fa-clock" style="color:#0284c7;"></i> <span dir="ltr">${app.appointmentTime}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${app.status}</span><br>
                    <span class="payment-badge ${isPaid ? 'paid' : ''}">${isPaid ? '<i class="fas fa-check-circle"></i> پرداخت شده' : 'پرداخت نشده'}</span>
                </td>
                <td>
                    <div class="s-actions-group">
                        ${app.status === 'در حال بررسی' ? `
                            <button class="s-btn-action approve js-action-approve" data-id="${app.id}"><i class="fas fa-check"></i> تایید</button>
                            <button class="s-btn-action reject js-action-reject" data-id="${app.id}"><i class="fas fa-times"></i> رد</button>
                        ` : ''}
                        ${app.status === 'تایید شده' ? `
                            ${!isPaid ? `<button class="s-btn-action pay js-action-pay" data-id="${app.id}"><i class="fas fa-dollar-sign"></i> تسویه</button>` : ''}
                            <button class="s-btn-action delete js-action-delete" data-id="${app.id}"><i class="fas fa-trash"></i> حذف</button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        attachActionEvents();
    }

    function attachActionEvents() {
        document.querySelectorAll('.js-action-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await handleStatusChange(id, 'تایید شده');
            });
        });
        document.querySelectorAll('.js-action-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await handleStatusChange(id, 'رد شده');
            });
        });
        document.querySelectorAll('.js-action-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await handleDelete(id);
            });
        });
        document.querySelectorAll('.js-action-pay').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await handlePayment(id);
            });
        });
        document.querySelectorAll('.js-open-history').forEach(el => {
            el.addEventListener('click', (e) => {
                const phone = e.currentTarget.dataset.phone;
                const name = e.currentTarget.dataset.name;
                showPatientHistory(phone, name);
            });
        });
    }

    async function handleStatusChange(id, newStatus) {
        if (!window.customModal) return;
        if (newStatus === 'تایید شده') {
            const targetApp = allAppointments.find(a => String(a.id) === String(id));
            if (targetApp) {
                const hasConflict = allAppointments.some(a =>
                    a.status === 'تایید شده' && String(a.id) !== String(id) &&
                    a.doctorName === targetApp.doctorName && a.appointmentDate === targetApp.appointmentDate && a.appointmentTime === targetApp.appointmentTime
                );
                if (hasConflict) {
                    await window.customModal.alert('خطای تداخل زمانی', 'این تایم قبلاً برای این پزشک پر شده است.');
                    return;
                }
            }
        }
        const res = await window.customModal.confirm('تغییر وضعیت', `آیا از تغییر وضعیت به "${newStatus}" اطمینان دارید؟`);
        if (res === 'confirm') {
            await window.appointmentsService.updateAppointmentStatus(id, newStatus, '');
            await fetchData();
        }
    }

    async function handleDelete(id) {
        if (!window.customModal) return;
        const res = await window.customModal.confirm('حذف نوبت', 'آیا از حذف کامل این نوبت اطمینان دارید؟');
        if (res === 'confirm') {
            await window.appointmentsService.cancelAppointment(id);
            await fetchData();
        }
    }

    async function handlePayment(id) {
        if (!window.customModal) return;
        const res = await window.customModal.confirm('ثبت پرداختی', 'آیا حق ویزیت پرداخت شده است؟');
        if (res === 'confirm') {
            await supabase.from('appointments').update({ payment_status: 'paid' }).eq('id', id);
            await fetchData();
        }
    }

    function showPatientHistory(phone, name) {
        if (!phone) {
            window.customModal.alert('خطا', 'شماره تلفن بیمار موجود نیست.');
            return;
        }
        const history = allAppointments.filter(a => a.patient_phone === phone);
        let html = `<h4 style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">سوابق: ${name}</h4>`;

        if(history.length === 0) {
            html += '<p>سابقه‌ای یافت نشد.</p>';
        } else {
            history.forEach(h => {
                html += `
                <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0;">
                    <strong style="color:var(--color-primary)">${h.appointmentDate}</strong> - ${h.serviceName}<br>
                    <small>پزشک: ${h.doctorName} | وضعیت: ${h.status}</small>
                </div>`;
            });
        }
        historyContent.innerHTML = html;
        historyModal.showModal();
    }

    // ================== Walk-in Booking Logic (Calendar & Search) ==================
    const walkinDoctorSelect = document.getElementById('walkin-doctor');
    const radioExisting = document.querySelector('input[name="userType"][value="existing"]');
    const radioNew = document.querySelector('input[name="userType"][value="new"]');
    const sectionExisting = document.getElementById('js-existing-user-section');
    const sectionNew = document.getElementById('js-new-user-section');

    const userSearchInput = document.getElementById('js-user-search-input');
    const userSearchResults = document.getElementById('js-user-search-results');
    const selectedUserDisplay = document.getElementById('js-selected-user-display');

    // انتخاب بیمار جدید یا موجود
    document.querySelectorAll('input[name="userType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'existing') {
                sectionExisting.style.display = 'block';
                sectionNew.style.display = 'none';
            } else {
                sectionExisting.style.display = 'none';
                sectionNew.style.display = 'block';
                walkinState.userId = null;
            }
        });
    });

    // جستجوی زنده بیماران
    userSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        userSearchResults.innerHTML = '';
        if (val.length < 2) {
            userSearchResults.style.display = 'none';
            return;
        }
        const matches = allUsers.filter(u =>
            (u.userName && u.userName.toLowerCase().includes(val)) ||
            (u.userFamily && u.userFamily.toLowerCase().includes(val)) ||
            (u.userPhone && u.userPhone.includes(val))
        );

        if (matches.length > 0) {
            userSearchResults.style.display = 'block';
            userSearchResults.innerHTML = matches.map(u => `
                <div class="s-search-item" data-id="${u.id}" data-name="${u.userName} ${u.userFamily || ''}" data-phone="${u.userPhone}">
                    <strong>${u.userName} ${u.userFamily || ''}</strong> - ${u.userPhone}
                </div>
            `).join('');

            userSearchResults.querySelectorAll('.s-search-item').forEach(item => {
                item.addEventListener('click', (ev) => {
                    const el = ev.currentTarget;
                    walkinState.userId = el.dataset.id;
                    walkinState.patientName = el.dataset.name;
                    walkinState.patientPhone = el.dataset.phone;

                    selectedUserDisplay.style.display = 'block';
                    selectedUserDisplay.textContent = `بیمار انتخاب شد: ${walkinState.patientName} (${walkinState.patientPhone})`;
                    userSearchResults.style.display = 'none';
                    userSearchInput.value = '';
                });
            });
        } else {
            userSearchResults.style.display = 'none';
        }
    });

    // تقویم و ساعات
    const wCalendarGrid = document.getElementById('js-w-calendar-grid');
    const wMonthLabel = document.getElementById('js-w-month-label');
    const wTimeSlots = document.getElementById('js-w-time-slots');

    function isPersianLeapYear(year) {
        const leapYears = [1395, 1399, 1403, 1408, 1412, 1416, 1420, 1424, 1428, 1433, 1437, 1441, 1445];
        return leapYears.includes(year);
    }

    function getPersianMonthDays(year, month) {
        if (month >= 0 && month <= 5) return 31;
        if (month >= 6 && month <= 10) return 30;
        return isPersianLeapYear(year) ? 30 : 29;
    }

    function getMonthStartDay(year, month) {
        let startDay = (0 + 5) % 7;
        let cY = 1405;
        let cM = 0;
        while (cY < year || (cY === year && cM < month)) {
            startDay = (startDay + getPersianMonthDays(cY, cM)) % 7;
            cM++; if (cM > 11) { cM = 0; cY++; }
        }
        while (cY > year || (cY === year && cM > month)) {
            cM--; if (cM < 0) { cM = 11; cY--; }
            startDay = (startDay - (getPersianMonthDays(cY, cM) % 7) + 7) % 7;
        }
        return startDay;
    }

    function renderWalkinCalendar() {
        wMonthLabel.textContent = `${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
        const startDay = getMonthStartDay(calendarYear, calendarMonth);
        const totalDays = getPersianMonthDays(calendarYear, calendarMonth);
        let html = '';

        for (let i = 0; i < startDay; i++) html += `<div class="c-calendar-day c-calendar-day--empty"></div>`;

        for (let day = 1; day <= totalDays; day++) {
            const formattedDate = `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
            const isPast = (calendarYear < currentRealYear) || (calendarYear === currentRealYear && calendarMonth < currentRealMonth) || (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day < currentRealDay);

            const selDoc = walkinDoctorSelect.value;
            const booked = allAppointments.filter(a => a.appointmentDate === formattedDate && a.doctorName === selDoc && (a.status === 'تایید شده' || a.status === 'در حال بررسی'));
            const isFull = !isPast && booked.length >= defaultTimeSlots.length;

            let cls = 'c-calendar-day';
            let dis = '';
            if (isPast) { cls += ' c-calendar-day--past'; dis = 'disabled'; }
            else if (isFull) { cls += ' c-calendar-day--booked'; dis = 'disabled'; }

            html += `<button type="button" class="${cls}" ${dis} data-day="${day}">${toPersianNumber(day)}</button>`;
        }
        wCalendarGrid.innerHTML = html;

        wCalendarGrid.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                wCalendarGrid.querySelectorAll('button').forEach(b => b.style.background = '');
                e.currentTarget.style.background = '#e0f2fe';
                walkinState.date = `${toPersianNumber(e.currentTarget.dataset.day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
                renderWalkinTimeSlots();
            });
        });
    }

    function renderWalkinTimeSlots() {
        const selDoc = walkinDoctorSelect.value;
        const bookedTimes = allAppointments.filter(a => a.appointmentDate === walkinState.date && a.doctorName === selDoc && (a.status === 'تایید شده' || a.status === 'در حال بررسی')).map(a => a.appointmentTime);

        wTimeSlots.innerHTML = defaultTimeSlots.map(t => {
            const isDis = bookedTimes.includes(t);
            return `<button type="button" class="c-time-slot-btn ${isDis ? 'c-time-slot-btn--disabled' : ''}" ${isDis ? 'disabled' : ''} data-time="${t}">${t}</button>`;
        }).join('');

        wTimeSlots.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                wTimeSlots.querySelectorAll('button').forEach(b => b.classList.remove('c-time-slot-btn--active'));
                e.currentTarget.classList.add('c-time-slot-btn--active');
                walkinState.time = e.currentTarget.dataset.time;
            });
        });
    }

    document.getElementById('js-w-prev-month').addEventListener('click', () => {
        if (calendarYear === currentRealYear && calendarMonth === currentRealMonth) return;
        calendarMonth--; if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
        renderWalkinCalendar();
    });
    document.getElementById('js-w-next-month').addEventListener('click', () => {
        calendarMonth++; if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
        renderWalkinCalendar();
    });
    walkinDoctorSelect.addEventListener('change', () => {
        walkinState.date = null;
        walkinState.time = null;
        wTimeSlots.innerHTML = '<p style="font-size:12px; color:#64748b;">ابتدا تاریخ را انتخاب کنید</p>';
        renderWalkinCalendar();
    });

    // سابمیت فرم نوبت دهی توسط منشی
    document.getElementById('js-submit-walkin').addEventListener('click', async () => {
        const isExisting = radioExisting.checked;
        let finalUserId = null;
        let finalName = '';
        let finalPhone = '';

        if (isExisting) {
            if (!walkinState.userId) { return window.customModal.alert('خطا', 'لطفا یک بیمار را از لیست جستجو انتخاب کنید.'); }
            finalUserId = walkinState.userId;
            finalName = walkinState.patientName;
            finalPhone = walkinState.patientPhone;
        } else {
            const nName = document.getElementById('new-user-name').value.trim();
            const nFamily = document.getElementById('new-user-family').value.trim();
            const nPhone = document.getElementById('new-user-phone').value.trim();
            if(!nName || !nPhone) { return window.customModal.alert('خطا', 'وارد کردن نام و موبایل برای کاربر جدید الزامی است.'); }

            finalUserId = `usr-${Date.now()}`;
            finalName = `${nName} ${nFamily}`;
            finalPhone = nPhone;

            try {
                await supabase.from('users').insert([{
                    id: finalUserId,
                    userName: nName,
                    userFamily: nFamily,
                    userPhone: nPhone,
                    userPassword: nPhone, // رمز عبور همان شماره موبایل
                    role: 'user',
                    userCreatedAt: new Date().toISOString()
                }]);
            } catch(e) { return window.customModal.alert('خطا', 'ثبت بیمار جدید با مشکل مواجه شد.'); }
        }

        if (!walkinState.date || !walkinState.time) {
            return window.customModal.alert('خطا', 'لطفا تاریخ و ساعت ویزیت را انتخاب کنید.');
        }

        const payload = {
            id: String(Date.now()),
            userId: finalUserId,
            patient_name: finalName,
            patient_phone: finalPhone,
            doctorName: walkinDoctorSelect.value,
            serviceName: 'نوبت رزرو شده توسط منشی',
            appointmentDate: walkinState.date,
            appointmentTime: walkinState.time,
            status: 'تایید شده',
            payment_status: 'unpaid'
        };

        try {
            await window.appointmentsService.createAppointment(payload);
            window.customModal.alert('موفقیت', 'نوبت با موفقیت ثبت شد.');
            walkinModal.close();

            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-family').value = '';
            document.getElementById('new-user-phone').value = '';
            selectedUserDisplay.style.display = 'none';
            walkinState.userId = null; walkinState.date = null; walkinState.time = null;

            await fetchData();
        } catch(err) {
            window.customModal.alert('خطا در ثبت نوبت', err.message);
        }
    });

    document.getElementById('js-open-walkin-btn').addEventListener('click', () => {
        renderWalkinCalendar();
        walkinModal.showModal();
    });
    document.querySelector('.js-walkin-close').addEventListener('click', () => walkinModal.close());
    document.querySelector('.js-history-close').addEventListener('click', () => historyModal.close());

    // فیلترها
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });
    doctorFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    function setupRealtime() {
        supabase.channel('public:appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
                fetchData();
                showToast('لیست نوبت‌ها در لحظه بروزرسانی شد');
            })
            .subscribe();
    }

    await fetchData();
    setupRealtime();
});
