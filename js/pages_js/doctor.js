import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('js-doctor-appointments-tbody');
    const filterBtns = document.querySelectorAll('.d-btn-filter');
    const logoutBtn = document.getElementById('js-doctor-logout');

    const noteModal = document.getElementById('js-note-modal');
    const noteTextarea = document.getElementById('js-note-textarea');
    const notePatientName = document.getElementById('js-note-patient-name');
    const saveNoteBtn = document.getElementById('js-save-note-btn');

    const historyModal = document.getElementById('js-history-modal');
    const historyContent = document.getElementById('js-history-content');
    const tableWrapper = document.querySelector('.d-table-wrapper');

    let doctorAppointments = [];
    let currentEditingAppointmentId = null;

    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) return window.location.href = '../pages/login.html';
    const user = JSON.parse(userRaw);

    if (user.role !== 'doctor' && user.role !== 'admin') {
        if (window.customModal) await window.customModal.alert('Access Denied', 'شما مجوز ورود به پنل پزشک را ندارید.');
        return window.location.href = '../index.html';
    }

    const doctorNameDisplay = document.getElementById('js-doctor-name');
    if(doctorNameDisplay) doctorNameDisplay.textContent = `دکتر ${user.userFamily || user.userName} عزیز، خسته نباشید`;

    function initDragToScroll(slider) {
        if (!slider) return;
        let isDown = false; let startX; let scrollLeft;
        slider.addEventListener('mousedown', (e) => { isDown = true; slider.style.cursor = 'grabbing'; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 1.5; slider.scrollLeft = scrollLeft - walk; });
    }
    initDragToScroll(tableWrapper);

    document.querySelectorAll('.js-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if(noteModal) noteModal.close();
            if(historyModal) historyModal.close();
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (window.authService && window.authService.logoutUser) await window.authService.logoutUser();
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    async function loadAppointments() {
        if (!tbody) return;
        try {
            const allAppointments = await window.appointmentsService.getAllAppointments();
            doctorAppointments = allAppointments.filter(app =>
                (app.doctorId && app.doctorId === user.id) ||
                (app.doctorName && app.doctorName.includes(user.userFamily || user.userName))
            );
            const activeFilter = document.querySelector('.d-btn-filter.active')?.dataset.filter || 'all';
            renderTable(activeFilter);
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center; padding: 30px;">خطا در ارتباط با سرور: ${error.message}</td></tr>`;
        }
    }

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const englishTime = timeStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const startHour = parseInt(englishTime.split(':')[0], 10) || 0;
        return startHour * 60;
    }

    function renderTable(filter) {
        if (!tbody) return;
        tbody.innerHTML = '';

        let filtered = doctorAppointments;
        if (filter === 'today') { filtered = doctorAppointments.filter(a => a.status === 'تایید شده'); }
        else if (filter === 'visited') { filtered = doctorAppointments.filter(a => a.status === 'ویزیت شده'); }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px 0; color: #64748b;">بیماری در این دسته‌بندی یافت نشد.</td></tr>';
            return;
        }

        const groupedByDate = {};
        filtered.forEach(app => {
            const dateKey = app.appointmentDate || app.date || 'تاریخ نامشخص';
            if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
            groupedByDate[dateKey].push(app);
        });

        for (const [dateKey, apps] of Object.entries(groupedByDate)) {
            apps.sort((a, b) => timeToMinutes(a.appointmentTime || a.time) - timeToMinutes(b.appointmentTime || b.time));

            const dateHeaderRow = document.createElement('tr');
            dateHeaderRow.innerHTML = `<td colspan="5" style="background: #f1f5f9; color: #0077c0; font-family: 'Title', sans-serif; font-size: 16px; padding: 12px 20px; text-align: right; border-bottom: 2px solid #e2e8f0;"><i class="far fa-calendar-alt" style="margin-left: 8px;"></i> نوبت‌های تاریخ: ${dateKey}</td>`;
            tbody.appendChild(dateHeaderRow);

            apps.forEach(app => {
                let statusClass = 'pending';
                if (app.status === 'تایید شده') statusClass = 'approved';
                if (app.status === 'ویزیت شده') statusClass = 'visited';
                if (app.status === 'رد شده' || app.status === 'کنسل شده') statusClass = 'rejected';
                if (app.status === 'عدم مراجعه') statusClass = 'noshow';

                // بررسی هوشمند امور مالی برای پزشک
                const payStatus = app.payment_status || 'unpaid';
                const isFinanciallyCleared = (payStatus === 'prepaid' || payStatus === 'settled' || payStatus === 'paid');

                const paymentBadge = isFinanciallyCleared
                    ? '<span style="color:#166534; font-size:11px; background:#dcfce7; padding:3px 8px; border-radius:6px; display:inline-block; margin-top:8px;"><i class="fas fa-check-circle"></i> امور مالی تایید شده</span>'
                    : '<span style="color:#991b1b; font-size:11px; background:#fee2e2; padding:3px 8px; border-radius:6px; display:inline-block; margin-top:8px;"><i class="fas fa-exclamation-circle"></i> ارجاع به صندوق</span>';

                const patientName = app.patient_name || 'بیمار ناشناس';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight:bold; color:#1e293b; font-size: 15px; margin-bottom:6px;">${patientName}</div>
                        ${app.patient_phone ? `<div style="font-size:12px; color:#475569; margin-bottom:4px;"><i class="fas fa-phone-alt" style="font-size:10px; margin-left:4px;"></i>${app.patient_phone}</div>` : ''}
                        ${paymentBadge}
                    </td>
                    <td><div style="font-weight:600; color:#334155;">${app.serviceName || '-'}</div></td>
                    <td>
                        <div dir="ltr" style="font-size: 14px; color:#334155; font-weight:bold;"><i class="far fa-clock" style="color:#94a3b8; margin-right:4px;"></i> ${app.appointmentTime || app.time}</div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                    <td>
                        <div class="d-actions-group">
                            <button class="d-btn-action js-action-history" data-patient-id="${app.userId || ''}" data-patient-name="${patientName}" style="background:#64748b;"><i class="fas fa-folder-open"></i> پرونده</button>
                            ${app.status === 'تایید شده' ? `<button class="d-btn-action visit js-action-visit" data-id="${app.id}" data-cleared="${isFinanciallyCleared}" data-name="${patientName}"><i class="fas fa-check"></i> تعیین وضعیت</button>` : ''}
                            ${app.status === 'ویزیت شده' ? `<button class="d-btn-action note js-action-note" data-id="${app.id}" data-name="${patientName}" data-note="${app.doctor_notes || ''}"><i class="fas fa-file-medical"></i> ${app.doctor_notes ? 'مشاهده نسخه' : 'ثبت نسخه'}</button>` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        attachActionEvents();
    }

    function attachActionEvents() {
        document.querySelectorAll('.js-action-visit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const isCleared = e.currentTarget.dataset.cleared === 'true';
                const name = e.currentTarget.dataset.name;

                if (!isCleared) {
                    if (window.customModal) await window.customModal.alert('اخطار مالی', 'بیمار هنوز هزینه‌ای پرداخت نکرده است. لطفاً بیمار را به صندوق (منشی) ارجاع دهید.');
                    return;
                }

                if (!window.customModal) return;
                const res = await window.customModal.show({ title: 'تعیین وضعیت بیمار', message: 'لطفاً وضعیت مراجعه بیمار را مشخص کنید:', confirmText: 'ویزیت شد', denyText: 'عدم مراجعه', showDeny: true, showCancel: true });
                if (res === 'cancel') return;
                try {
                    if (res === 'confirm') {
                        await window.appointmentsService.updateAppointmentStatus(id, 'ویزیت شده');
                        await loadAppointments();
                        currentEditingAppointmentId = id; notePatientName.textContent = name; noteTextarea.value = '';
                        if(noteModal) noteModal.showModal();
                    } else if (res === 'deny') {
                        await window.appointmentsService.updateAppointmentStatus(id, 'عدم مراجعه');
                        await loadAppointments();
                    }
                } catch (err) { await window.customModal.alert('خطا', 'خطا در ثبت: ' + err.message); }
            });
        });

        document.querySelectorAll('.js-action-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentEditingAppointmentId = e.currentTarget.dataset.id;
                notePatientName.textContent = e.currentTarget.dataset.name || '';
                noteTextarea.value = e.currentTarget.dataset.note || '';
                if(noteModal) noteModal.showModal();
            });
        });

        document.querySelectorAll('.js-action-history').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const patientId = e.currentTarget.dataset.patientId;
                const patientName = e.currentTarget.dataset.patientName;

                if (!patientId || patientId === 'null') {
                    historyContent.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align:center;">این بیمار پرونده سیستمی ندارد.</div>`;
                    if(historyModal) historyModal.showModal();
                    return;
                }

                if(historyModal) historyModal.showModal();
                historyContent.innerHTML = `<div style="text-align:center; padding: 20px;">در حال استخراج پرونده ${patientName}...</div>`;

                try {
                    const patientHistory = await window.appointmentsService.getUserAppointments(patientId);
                    if (!patientHistory || patientHistory.length === 0) { historyContent.innerHTML = `<div style="padding: 20px; text-align:center;">سابقه‌ای برای این بیمار یافت نشد.</div>`; return; }

                    historyContent.innerHTML = patientHistory.map(hist => {
                        let borderColor = '#cbd5e1';
                        if(hist.status === 'ویزیت شده') borderColor = '#10b981'; else if(hist.status === 'عدم مراجعه') borderColor = '#64748b'; else if(hist.status === 'رد شده' || hist.status === 'کنسل شده') borderColor = '#ef4444';
                        return `
                        <div style="border-right: 3px solid ${borderColor}; padding: 10px 15px; margin-bottom: 12px; background: #f8fafc; border-radius: 8px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                                <strong style="font-size: 14px; color: #0f172a;">${hist.serviceName || 'ویزیت'}</strong>
                                <span style="font-size:12px; color:#64748b;" dir="ltr">${hist.appointmentDate || hist.date}</span>
                            </div>
                            <div style="font-size: 12px; color: #475569; margin-bottom: 5px;">وضعیت: <span style="font-weight:bold; color:${borderColor}">${hist.status}</span></div>
                            ${hist.doctor_notes ? `<div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; line-height:1.8; color: #1e293b; margin-top: 8px; white-space: pre-wrap; word-break: break-word;"><strong><i class="fas fa-prescription" style="color:#0077c0;"></i> نسخه / شرح‌حال ثبت شده:</strong> <br>${hist.doctor_notes}</div>` : ''}
                        </div>`
                    }).join('');
                } catch (err) { historyContent.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align:center;">خطا در دریافت پرونده: ${err.message}</div>`; }
            });
        });
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
            const noteText = noteTextarea.value.trim();
            if (!currentEditingAppointmentId) return;
            saveNoteBtn.disabled = true; saveNoteBtn.innerHTML = 'در حال ذخیره...';
            try {
                await window.appointmentsService.updateAppointmentNotes(currentEditingAppointmentId, noteText);
                if (window.customModal) await window.customModal.alert('موفقیت', 'نسخه/شرح‌حال با موفقیت ذخیره شد.');
                if (noteModal) noteModal.close();
                await loadAppointments();
            } catch (err) { if (window.customModal) await window.customModal.alert('خطا', 'خطا در ذخیره نسخه: ' + err.message); }
            finally { saveNoteBtn.disabled = false; saveNoteBtn.innerHTML = 'ذخیره در پرونده'; }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => { filterBtns.forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderTable(e.target.dataset.filter); });
    });

    function setupRealtime() {
        supabase.channel('public:doctor-appointments').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => { loadAppointments(); }).subscribe();
    }

    loadAppointments();
    setupRealtime();
});
