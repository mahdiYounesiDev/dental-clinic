import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // 1. Authentication & Role Verification (SSR)
    // ==========================================
    async function verifySecretaryAccess() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.href = '../pages/login.html';
            return false;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, name, family')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            if (window.customModal) await window.customModal.alert('خطا', 'پروفایل شما یافت نشد.');
            window.location.href = '../index.html';
            return false;
        }

        if (profile.role !== 'admin' && profile.role !== 'secretary') {
            if (window.customModal) await window.customModal.alert('عدم دسترسی', 'شما مجوز ورود به این پنل را ندارید.');
            window.location.href = '../index.html';
            return false;
        }

        const displayName = profile.name ? `${profile.name} ${profile.family || ''}`.trim() : 'منشی';
        const secretaryNameEl = document.getElementById('js-secretary-name');
        if (secretaryNameEl) secretaryNameEl.textContent = `${displayName} | پنل پذیرش`;

        return true;
    }

    const hasAccess = await verifySecretaryAccess();
    if (!hasAccess) return;

    // ==========================================
    // 2. DOM Elements & State Variables
    // ==========================================
    const tbody = document.getElementById('js-appointments-tbody');
    const filterBtns = document.querySelectorAll('.s-btn-filter');
    const doctorFilter = document.getElementById('js-doctor-filter');
    const searchInput = document.getElementById('js-search-input');
    const logoutBtn = document.getElementById('js-secretary-logout');

    const statToday = document.getElementById('js-stat-today');
    const statPending = document.getElementById('js-stat-pending');
    const statCancelled = document.getElementById('js-stat-cancelled');
    const notifBadge = document.getElementById('js-notif-badge');
    const notifBell = document.getElementById('js-notif-bell');
    const toast = document.getElementById('js-toast');

    const walkinModal = document.getElementById('js-walkin-modal');
    const historyModal = document.getElementById('js-history-modal');
    const historyContent = document.getElementById('js-history-content');
    const tableWrapper = document.querySelector('.s-table-wrapper');

    let allAppointments = [];
    let doctorsList = [];
    let allUsers = [];
    let allServices = [];

    // Walk-in form state manager
    let walkinState = {
        userId: null,
        patientName: '',
        patientPhone: '',
        date: null,
        time: null,
        notes: ''
    };

    // Date & Time Constants
    const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const defaultTimeSlots = ['۰۹:۰۰ - ۱۰:۰۰', '۱۰:۰۰ - ۱۱:۰۰', '۱۱:۰۰ - ۱۲:۰۰', '۱۶:۰۰ - ۱۷:۰۰', '۱۷:۰۰ - ۱۸:۰۰', '۱۸:۰۰ - ۱۹:۰۰'];

    // Get current Persian Date
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

    // ==========================================
    // 3. UI Utility Functions
    // ==========================================

    // Drag to Scroll Logic for Table Wrapper
    function initDragToScroll(slider) {
        if (!slider) return;
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
    initDragToScroll(tableWrapper);

    // Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function toPersianNumber(value) {
        if (value === null || value === undefined) return '';
        const numbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/\d/g, digit => numbers[digit]);
    }

    function toEnglishNumber(value) {
        if (!value) return '';
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/[۰-۹]/g, w => persianNumbers.indexOf(w));
    }

    function formatMoney(amount) {
        if (!amount && amount !== 0) return '۰';
        return Number(amount).toLocaleString('fa-IR');
    }

    // ==========================================
    // 4. Data Fetching
    // ==========================================
    async function fetchData() {
        try {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">در حال دریافت اطلاعات...</td></tr>';

            // Fetch Services
            const { data: srvData } = await supabase.from('services').select('*');
            if (srvData) allServices = srvData;

            // Fetch Doctors & Update UI
            const { data: docData } = await supabase.from('doctors').select('*');
            if (docData) {
                doctorsList = docData;
                updateDoctorDropdown();
                const walkinDocSelect = document.getElementById('walkin-doctor');
                if(walkinDocSelect && doctorsList.length > 0) {
                    walkinDocSelect.innerHTML = '<option value="" disabled selected>لطفا ابتدا یک پزشک انتخاب کنید</option>' +
                        doctorsList.map(d => `<option value="${d.id}" data-id="${d.id}" data-name="دکتر ${d.doctorName} ${d.doctorFamily}">دکتر ${d.doctorName} ${d.doctorFamily}</option>`).join('');
                }
            }

            // Fetch Appointments
            allAppointments = await window.appointmentsService.getAllAppointments();

            // Fetch Profiles for Walk-in Search
            const { data: profilesData } = await supabase.from('profiles').select('*');
            if (profilesData) allUsers = profilesData;

            updateStats();
            applyFilters();
        } catch (err) {
            console.error('Fetch error:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red;">Error: ${err.message}</td></tr>`;
        }
    }

    // ==========================================
    // 5. Filtering & Stats Logic
    // ==========================================
    function updateDoctorDropdown() {
        if (!doctorFilter) return;
        const currentVal = doctorFilter.value;
        doctorFilter.innerHTML = '<option value="all">همه پزشکان</option>';

        doctorsList.forEach(doc => {
            const docName = `دکتر ${doc.doctorName} ${doc.doctorFamily}`;
            const pendingCount = allAppointments.filter(a => {
                const s = (a.status || 'در حال بررسی').trim();
                return a.doctorName === docName && (s === 'در حال بررسی' || s === 'pending');
            }).length;

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
            const status = (app.status || 'در حال بررسی').trim();
            if (status === 'در حال بررسی' || status === 'pending') pendingCount++;
            if (status === 'رد شده' || status === 'کنسل شده' || status === 'rejected' || status === 'cancelled') cancelledCount++;
            if (app.appointmentDate === todayStr && status !== 'کنسل شده' && status !== 'رد شده' && status !== 'cancelled' && status !== 'rejected') todayCount++;
        });

        if (statToday) statToday.textContent = toPersianNumber(todayCount);
        if (statPending) statPending.textContent = toPersianNumber(pendingCount);
        if (statCancelled) statCancelled.textContent = toPersianNumber(cancelledCount);

        if (notifBadge) {
            if (pendingCount > 0) {
                notifBadge.style.display = 'block';
                notifBadge.textContent = toPersianNumber(pendingCount);
            } else {
                notifBadge.style.display = 'none';
            }
        }
        updateDoctorDropdown();
    }

    if (notifBell) {
        notifBell.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            const pendingBtn = document.querySelector('.s-btn-filter[data-filter="pending"]');
            if (pendingBtn) pendingBtn.classList.add('active');
            applyFilters();
        });
    }

    function applyFilters() {
        const activeStatusBtn = document.querySelector('.s-btn-filter.active');
        const statusFilter = activeStatusBtn ? activeStatusBtn.dataset.filter : 'all';
        const docFilterValue = doctorFilter ? doctorFilter.value : 'all';
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let filtered = allAppointments;
        const todayStr = `${toPersianNumber(currentRealDay)} ${persianMonths[currentRealMonth]} ${toPersianNumber(currentRealYear)}`;

        if (statusFilter === 'pending') {
            filtered = filtered.filter(a => {
                const s = (a.status || 'در حال بررسی').trim();
                return s === 'در حال بررسی' || s === 'pending';
            });
        }
        if (statusFilter === 'approved') {
            filtered = filtered.filter(a => {
                const s = (a.status || '').trim();
                return s === 'تایید شده' || s === 'approved';
            });
        }
        if (statusFilter === 'today') {
            filtered = filtered.filter(a => {
                const s = (a.status || '').trim();
                return a.appointmentDate === todayStr && s !== 'کنسل شده' && s !== 'رد شده' && s !== 'cancelled' && s !== 'rejected';
            });
        }

        if (docFilterValue !== 'all') {
            filtered = filtered.filter(a => a.doctorName === docFilterValue);
        }

        if (searchQuery) {
            const engQuery = toEnglishNumber(searchQuery);
            filtered = filtered.filter(a => {
                const name = (a.patient_name || '').toLowerCase();
                const phone = (a.patient_phone || '').toLowerCase();
                return name.includes(searchQuery) || phone.includes(engQuery);
            });
        }
        renderTable(filtered);
    }

    // ==========================================
    // 6. Main Table Rendering
    // ==========================================
    function renderTable(filteredData) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 40px 0; color: #64748b;">هیچ نوبتی یافت نشد.</td></tr>';
            return;
        }

        // Sort: newest first
        filteredData.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

        // Group by Doctor Name
        const groupedData = filteredData.reduce((acc, app) => {
            const doctor = app.doctorName || 'پزشک نامشخص';
            if (!acc[doctor]) acc[doctor] = [];
            acc[doctor].push(app);
            return acc;
        }, {});

        for (const [docName, apps] of Object.entries(groupedData)) {
            // Group Title Row
            const trTitle = document.createElement('tr');
            trTitle.innerHTML = `
                <td colspan="5" style="background-color: #f1f5f9; font-family: 'Title', sans-serif; font-size: 16px; color: #0f172a; text-align: right; padding: 12px 20px; border-radius: 8px;">
                    <i class="fas fa-user-md" style="color:var(--color-primary); margin-left:8px;"></i> ${docName} <span style="font-size: 12px; color: #64748b; margin-right: 10px;">(${toPersianNumber(apps.length)} نوبت)</span>
                </td>
            `;
            tbody.appendChild(trTitle);

            // Print Appointments
            apps.forEach(app => {
                const status = (app.status || 'در حال بررسی').trim();

                let statusClass = 'pending';
                if (status === 'تایید شده' || status === 'approved') statusClass = 'approved';
                else if (status === 'رد شده' || status === 'کنسل شده' || status === 'rejected' || status === 'cancelled') statusClass = 'rejected';
                else if (status === 'ویزیت شده' || status === 'visited') statusClass = 'visited';
                else if (status === 'عدم مراجعه' || status === 'noshow') statusClass = 'noshow';

                // Finance formatting
                const payStatus = app.payment_status || 'unpaid';
                let paymentBadge = '';
                let isFullySettled = false;

                if (payStatus === 'settled' || payStatus === 'paid') {
                    paymentBadge = '<span class="payment-badge" style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:6px; font-size:11px; display:inline-block;"><i class="fas fa-check-double"></i> تسویه کامل</span>';
                    isFullySettled = true;
                } else if (payStatus === 'prepaid') {
                    paymentBadge = '<span class="payment-badge" style="background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:6px; font-size:11px; display:inline-block;"><i class="fas fa-hand-holding-usd"></i> فقط بیعانه</span>';
                } else {
                    paymentBadge = '<span class="payment-badge" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:6px; font-size:11px; display:inline-block;"><i class="fas fa-times-circle"></i> پرداخت نشده</span>';
                }

                const patientName = app.patient_name || 'ثبت نشده';
                const phoneStr = app.patient_phone || '';
                const waLink = phoneStr ? `https://wa.me/98${phoneStr.substring(1)}` : '#';
                const callLink = phoneStr ? `tel:${phoneStr}` : '#';

                const financeDetailsHtml = `
                    <div style="font-size:11px; margin-top:8px; padding-top:8px; border-top:1px dashed #cbd5e1;">
                        هزینه کل: <strong>${formatMoney(app.total_price)}</strong> تومان<br>
                        پرداختی: <strong style="color:var(--color-mint);">${formatMoney(app.paid_amount)}</strong> تومان
                    </div>
                `;

                const isPending = (status === 'در حال بررسی' || status === 'pending');
                const isApprovedOrVisited = (status === 'تایید شده' || status === 'approved' || status === 'ویزیت شده' || status === 'visited');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="s-patient-name js-open-history" data-phone="${phoneStr}" data-name="${patientName}">${patientName}</div>
                        ${phoneStr ? `
                        <div class="s-contact-links">
                            <a href="${waLink}" target="_blank" class="s-contact-btn wa"><i class="fab fa-whatsapp"></i></a>
                            <a href="${callLink}" class="s-contact-btn call"><i class="fas fa-phone-alt"></i></a>
                            <span style="font-size:11px; color:#64748b; line-height:26px;">${toPersianNumber(phoneStr)}</span>
                        </div>` : '<small style="color:#94a3b8;">بدون شماره</small>'}
                    </td>
                    <td>
                        <div style="font-weight:600; color:#334155;">${app.serviceName || 'ویزیت عمومی'}</div>
                        ${financeDetailsHtml}
                    </td>
                    <td>
                        <div style="font-size: 14px; color:#334155; display:flex; align-items:center; gap:6px;">
                            <i class="far fa-calendar-alt" style="color:#0284c7;"></i> <span>${app.appointmentDate || app.date}</span>
                        </div>
                        <div style="font-size: 13px; color:#64748b; display:flex; align-items:center; gap:6px; margin-top:4px;">
                            <i class="far fa-clock" style="color:#0284c7;"></i> <span dir="ltr">${app.appointmentTime || app.time}</span>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}" style="margin-bottom:8px; display:inline-block;">${status}</span><br>
                        ${paymentBadge}
                    </td>
                    <td>
                        <div class="s-actions-group">
                            ${isPending ? `
                                <button class="s-btn-action approve js-action-approve" data-id="${app.id}"><i class="fas fa-check"></i> تایید</button>
                                <button class="s-btn-action reject js-action-reject" data-id="${app.id}"><i class="fas fa-times"></i> رد</button>
                            ` : ''}

                            ${isApprovedOrVisited ? `
                                ${!isFullySettled ? `<button class="s-btn-action pay js-action-pay" data-id="${app.id}" data-total="${app.total_price}"><i class="fas fa-cash-register"></i> تسویه صندوق</button>` : ''}
                                <button class="s-btn-action delete js-action-delete" data-id="${app.id}"><i class="fas fa-trash"></i> حذف</button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        attachActionEvents();
    }

    // ==========================================
    // 7. Table Actions (Approve, Reject, Delete, Pay)
    // ==========================================
    function attachActionEvents() {
        document.querySelectorAll('.js-action-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => await handleStatusChange(e.currentTarget.dataset.id, 'تایید شده'));
        });
        document.querySelectorAll('.js-action-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => await handleStatusChange(e.currentTarget.dataset.id, 'رد شده'));
        });
        document.querySelectorAll('.js-action-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => await handleDelete(e.currentTarget.dataset.id));
        });

        document.querySelectorAll('.js-action-pay').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const total = e.currentTarget.dataset.total || 0;
                if (!window.customModal) return;
                const res = await window.customModal.confirm('تسویه حساب', 'آیا بیمار مابقی مبلغ را پرداخت کرده و تسویه کامل ثبت شود؟');
                if (res === 'confirm') {
                    await supabase.from('appointments').update({ payment_status: 'settled', paid_amount: total }).eq('id', id);
                    showToast('تسویه حساب با موفقیت ثبت شد.');
                    await fetchData();
                }
            });
        });

        document.querySelectorAll('.js-open-history').forEach(el => {
            el.addEventListener('click', (e) => showPatientHistory(e.currentTarget.dataset.phone, e.currentTarget.dataset.name));
        });
    }

    async function handleStatusChange(id, newStatus) {
        if (!window.customModal) return;

        // Check for double booking before approving
        if (newStatus === 'تایید شده') {
            const targetApp = allAppointments.find(a => String(a.id) === String(id));
            if (targetApp) {
                const hasConflict = allAppointments.some(a => {
                    const s = (a.status || '').trim();
                    return (s === 'تایید شده' || s === 'approved') && String(a.id) !== String(id) &&
                        a.doctorName === targetApp.doctorName &&
                        (a.appointmentDate === targetApp.appointmentDate || a.date === targetApp.appointmentDate) &&
                        (a.appointmentTime === targetApp.appointmentTime || a.time === targetApp.appointmentTime);
                });
                if (hasConflict) {
                    await window.customModal.alert('تداخل نوبت', 'این تایم قبلاً برای این پزشک تایید شده است.');
                    return;
                }
            }
        }

        const res = await window.customModal.confirm('تغییر وضعیت', `آیا از تغییر وضعیت به "${newStatus}" اطمینان دارید؟`);
        if (res === 'confirm') {
            await window.appointmentsService.updateAppointmentStatus(id, newStatus, '');
            if (newStatus === 'تایید شده') await window.customModal.alert('موفقیت', 'نوبت با موفقیت تایید شد.');
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

    function showPatientHistory(phone, name) {
        if (!phone) { window.customModal.alert('خطا', 'شماره تلفن بیمار موجود نیست.'); return; }
        const history = allAppointments.filter(a => a.patient_phone === phone);
        let html = `<h4 style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">سوابق: ${name}</h4>`;

        if(history.length === 0) {
            html += '<p>سابقه‌ای یافت نشد.</p>';
        } else {
            history.forEach(h => {
                html += `
                <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0;">
                    <strong style="color:var(--color-primary)">${h.appointmentDate || h.date}</strong> - ${h.serviceName}<br>
                    <small>پزشک: ${h.doctorName} | وضعیت: ${h.status}</small>
                    ${h.doctor_notes ? `<div style="background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0; font-size:13px; margin-top:8px;"><strong>نسخه:</strong><br>${h.doctor_notes}</div>` : ''}
                </div>`;
            });
        }
        if (historyContent) historyContent.innerHTML = html;
        if (historyModal) historyModal.showModal();
    }

    // ==========================================
    // 8. Walk-in System (New / Existing Patient)
    // ==========================================
    const walkinDoctorSelect = document.getElementById('walkin-doctor');
    const walkinServiceSelect = document.getElementById('walkin-service');
    const walkinServiceContainer = document.getElementById('js-walkin-service-container');
    const radioExisting = document.querySelector('input[name="userType"][value="existing"]');
    const sectionExisting = document.getElementById('js-existing-user-section');
    const sectionNew = document.getElementById('js-new-user-section');
    const userSearchInput = document.getElementById('js-user-search-input');
    const userSearchResults = document.getElementById('js-user-search-results');
    const selectedUserDisplay = document.getElementById('js-selected-user-display');
    const walkinCalendarWrapper = document.getElementById('js-calendar-wrapper');

    // Switch between existing and new patient inputs
    document.querySelectorAll('input[name="userType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'existing') {
                if(sectionExisting) sectionExisting.style.display = 'block';
                if(sectionNew) sectionNew.style.display = 'none';
            } else {
                if(sectionExisting) sectionExisting.style.display = 'none';
                if(sectionNew) sectionNew.style.display = 'block';
                walkinState.userId = null;
            }
        });
    });

    // Existing User Search functionality
    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim().toLowerCase();
            const engVal = toEnglishNumber(val);
            if (!userSearchResults) return;
            userSearchResults.innerHTML = '';

            if (val.length < 2) {
                userSearchResults.style.display = 'none';
                return;
            }

            const matches = allUsers.filter(u => {
                const nName = (u.name || u.userName || '').toLowerCase();
                const nFamily = (u.family || u.userFamily || '').toLowerCase();
                const nPhone = (u.phone || u.userPhone || '').toLowerCase();
                return nName.includes(val) || nFamily.includes(val) || nPhone.includes(engVal) || nPhone.includes(val);
            });

            if (matches.length > 0) {
                userSearchResults.style.display = 'block';
                userSearchResults.innerHTML = matches.map(u =>
                    `<div class="s-search-item" data-id="${u.id}" data-name="${u.name || u.userName} ${u.family || u.userFamily || ''}" data-phone="${u.phone || u.userPhone || ''}">
                        <strong>${u.name || u.userName} ${u.family || u.userFamily || ''}</strong> - ${u.phone || u.userPhone || 'بدون شماره'}
                    </div>`
                ).join('');

                userSearchResults.querySelectorAll('.s-search-item').forEach(item => {
                    item.addEventListener('click', (ev) => {
                        const el = ev.currentTarget;
                        walkinState.userId = el.dataset.id;
                        walkinState.patientName = el.dataset.name;
                        walkinState.patientPhone = el.dataset.phone;

                        if(selectedUserDisplay) {
                            selectedUserDisplay.style.display = 'block';
                            selectedUserDisplay.textContent = `بیمار انتخاب شد: ${walkinState.patientName}`;
                        }
                        userSearchResults.style.display = 'none';
                        userSearchInput.value = '';
                    });
                });
            } else {
                userSearchResults.style.display = 'block';
                userSearchResults.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:12px;">بیماری یافت نشد.</div>';
            }
        });
    }

    // ==========================================
    // 9. Walk-in Calendar & Times
    // ==========================================
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
        let startDay = 5; let cY = 1405; let cM = 0;
        while (cY < year || (cY === year && cM < month)) {
            startDay = (startDay + getPersianMonthDays(cY, cM)) % 7;
            cM++;
            if (cM > 11) { cM = 0; cY++; }
        }
        while (cY > year || (cY === year && cM > month)) {
            cM--;
            if (cM < 0) { cM = 11; cY--; }
            startDay = (startDay - (getPersianMonthDays(cY, cM) % 7) + 7) % 7;
        }
        return startDay;
    }

    function renderWalkinCalendar() {
        if(!walkinDoctorSelect || !walkinDoctorSelect.value) return;
        if(walkinCalendarWrapper) walkinCalendarWrapper.style.display = 'block';
        if(wMonthLabel) wMonthLabel.textContent = `${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;

        const startDay = getMonthStartDay(calendarYear, calendarMonth);
        const totalDays = getPersianMonthDays(calendarYear, calendarMonth);
        let html = '';

        for (let i = 0; i < startDay; i++) {
            html += `<div class="c-calendar-day c-calendar-day--empty"></div>`;
        }

        const selDocOpt = walkinDoctorSelect.options[walkinDoctorSelect.selectedIndex];
        const selDocName = selDocOpt ? selDocOpt.dataset.name : walkinDoctorSelect.value;

        for (let day = 1; day <= totalDays; day++) {
            const formattedDate = `${toPersianNumber(day)} ${persianMonths[calendarMonth]} ${toPersianNumber(calendarYear)}`;
            const isPast = (calendarYear < currentRealYear) || (calendarYear === currentRealYear && calendarMonth < currentRealMonth) || (calendarYear === currentRealYear && calendarMonth === currentRealMonth && day < currentRealDay);

            const booked = allAppointments.filter(a => (a.appointmentDate === formattedDate || a.date === formattedDate) && a.doctorName === selDocName && (a.status === 'تایید شده' || a.status === 'در حال بررسی'));
            const isFull = !isPast && booked.length >= defaultTimeSlots.length;

            let cls = 'c-calendar-day';
            let dis = '';

            if (isPast) {
                cls += ' c-calendar-day--past'; dis = 'disabled';
            } else if (isFull) {
                cls += ' c-calendar-day--booked'; dis = 'disabled';
            }

            html += `<button type="button" class="${cls}" ${dis} data-day="${day}">${toPersianNumber(day)}</button>`;
        }

        if(wCalendarGrid) {
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
    }

    function renderWalkinTimeSlots() {
        if (!wTimeSlots || !walkinDoctorSelect) return;
        const selDocOpt = walkinDoctorSelect.options[walkinDoctorSelect.selectedIndex];
        const selDocName = selDocOpt ? selDocOpt.dataset.name : walkinDoctorSelect.value;
        const bookedTimes = allAppointments.filter(a => (a.appointmentDate === walkinState.date || a.date === walkinState.date) && a.doctorName === selDocName && (a.status === 'تایید شده' || a.status === 'در حال بررسی')).map(a => a.appointmentTime || a.time);

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

    const prevMonthEl = document.getElementById('js-w-prev-month');
    const nextMonthEl = document.getElementById('js-w-next-month');
    if(prevMonthEl) prevMonthEl.addEventListener('click', () => {
        if (calendarYear === currentRealYear && calendarMonth === currentRealMonth) return;
        calendarMonth--;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
        renderWalkinCalendar();
    });
    if(nextMonthEl) nextMonthEl.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
        renderWalkinCalendar();
    });

    if(walkinDoctorSelect) {
        walkinDoctorSelect.addEventListener('change', (e) => {
            walkinState.date = null;
            walkinState.time = null;
            if(wTimeSlots) wTimeSlots.innerHTML = '<p style="font-size:12px; color:#64748b;">ابتدا تاریخ را انتخاب کنید</p>';

            const selectedOpt = e.target.options[e.target.selectedIndex];
            const docId = selectedOpt.dataset.id;
            const docName = selectedOpt.dataset.name;
            const docServices = allServices.filter(s => String(s.doctorId) === String(docId) || String(s.serviceDoctorId) === String(docId) || s.doctorName === docName);

            if(walkinServiceSelect) {
                walkinServiceSelect.innerHTML = '<option value="" disabled selected>لطفا یک خدمت انتخاب کنید</option>';
                if (docServices.length > 0) {
                    docServices.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.serviceName || s.title;
                        opt.textContent = s.serviceName || s.title;
                        walkinServiceSelect.appendChild(opt);
                    });
                } else {
                    const opt = document.createElement('option');
                    opt.value = 'ویزیت و مشاوره عمومی';
                    opt.textContent = 'ویزیت و مشاوره عمومی';
                    walkinServiceSelect.appendChild(opt);
                }
            }
            if(walkinServiceContainer) walkinServiceContainer.style.display = 'block';
            renderWalkinCalendar();
        });
    }

    // ==========================================
    // 10. Final Submit (Walk-in Appointment)
    // ==========================================
    const submitWalkinBtn = document.getElementById('js-submit-walkin');
    if(submitWalkinBtn) {
        submitWalkinBtn.addEventListener('click', async () => {
            const isExisting = radioExisting ? radioExisting.checked : true;
            let finalUserId = null;
            let finalName = '';
            let finalPhone = '';

            if (isExisting) {
                if (!walkinState.userId) {
                    return window.customModal.alert('خطا', 'لطفا یک بیمار را از لیست جستجو انتخاب کنید.');
                }
                finalUserId = walkinState.userId;
                finalName = walkinState.patientName;
                finalPhone = walkinState.patientPhone;
            } else {
                const nName = document.getElementById('new-user-name')?.value.trim();
                const nFamily = document.getElementById('new-user-family')?.value.trim();
                const nPhone = toEnglishNumber(document.getElementById('new-user-phone')?.value.trim());

                if(!nName || !nPhone) {
                    return window.customModal.alert('خطا', 'نام و شماره تماس الزامی است.');
                }
                const fakeEmail = `${nPhone}@lumident.local`;

                try {
                    // Register the new user silently in the background
                    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: fakeEmail, password: nPhone });
                    if (authErr && authErr.message.includes('already registered')) {
                        return window.customModal.alert('خطا', 'این شماره قبلا ثبت شده است.');
                    }

                    finalUserId = authData?.user?.id || `usr-${Date.now()}`;
                    finalName = `${nName} ${nFamily}`.trim();
                    finalPhone = nPhone;

                    const newUserPayload = {
                        id: finalUserId,
                        name: nName,
                        family: nFamily,
                        phone: nPhone,
                        email: fakeEmail,
                        role: 'user',
                        created_at: new Date().toISOString()
                    };

                    await supabase.from('profiles').upsert([newUserPayload]);

                    // Refresh users list
                    const { data: refreshedUsers } = await supabase.from('profiles').select('*');
                    if (refreshedUsers) allUsers = refreshedUsers;
                } catch(e) {
                    return window.customModal.alert('خطا', e.message);
                }
            }

            if (walkinServiceSelect && !walkinServiceSelect.value) return window.customModal.alert('خطا', 'لطفا خدمت را انتخاب کنید.');
            if (!walkinState.date || !walkinState.time) return window.customModal.alert('خطا', 'تاریخ و ساعت را انتخاب کنید.');

            const selectedDocOpt = walkinDoctorSelect ? walkinDoctorSelect.options[walkinDoctorSelect.selectedIndex] : null;
            const selectedSrv = allServices.find(s => (s.serviceName || s.title) === (walkinServiceSelect ? walkinServiceSelect.value : ''));
            const totalPrice = selectedSrv ? selectedSrv.price : 0;

            const payload = {
                id: String(Date.now()),
                userId: finalUserId,
                patient_name: finalName,
                patient_phone: finalPhone,
                patient_notes: document.getElementById('walkin-notes')?.value.trim() || '',
                doctorName: selectedDocOpt ? selectedDocOpt.dataset.name : (walkinDoctorSelect ? walkinDoctorSelect.value : ''),
                serviceName: walkinServiceSelect ? walkinServiceSelect.value : 'ویزیت',
                appointmentDate: walkinState.date,
                appointmentTime: walkinState.time,
                status: 'تایید شده',
                total_price: totalPrice,
                paid_amount: 0,
                payment_status: 'unpaid'
            };

            try {
                await supabase.from('appointments').insert([payload]);
                window.customModal.alert('موفقیت', 'نوبت حضوری با موفقیت ثبت شد.');
                if(walkinModal) walkinModal.close();
                await fetchData();
            } catch(err) {
                window.customModal.alert('خطا', err.message);
            }
        });
    }

    // Modal Events
    const openWalkinBtn = document.getElementById('js-open-walkin-btn');
    if(openWalkinBtn) openWalkinBtn.addEventListener('click', () => { if(walkinModal) walkinModal.showModal(); });

    document.querySelectorAll('.js-walkin-close').forEach(b => b.addEventListener('click', () => { if(walkinModal) walkinModal.close(); }));
    document.querySelectorAll('.js-history-close').forEach(b => b.addEventListener('click', () => { if(historyModal) historyModal.close(); }));

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });

    if(doctorFilter) doctorFilter.addEventListener('change', applyFilters);
    if(searchInput) searchInput.addEventListener('input', applyFilters);

    // ==========================================
    // 11. Supabase Realtime Channel
    // ==========================================
    function setupRealtime() {
        supabase.channel('public:appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
                fetchData();
                showToast('لیست بروزرسانی شد.');
            })
            .subscribe();
    }

    await fetchData();
    setupRealtime();
});
