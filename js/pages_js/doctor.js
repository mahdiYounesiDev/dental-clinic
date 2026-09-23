import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    async function verifyDoctorAccess() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.href = '../pages/login.html';
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, name, family')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            if(window.customModal) await window.customModal.alert('خطا', 'پروفایل شما در پایگاه داده یافت نشد.');
            window.location.href = '../index.html';
            return null;
        }

        if (profile.role !== 'doctor' && profile.role !== 'admin') {
            if(window.customModal) await window.customModal.alert('دسترسی غیرمجاز', 'شما مجوز ورود به پنل پزشکان را ندارید.');
            window.location.href = '../index.html';
            return null;
        }

        const displayName = profile.name ? `${profile.name} ${profile.family || ''}`.trim() : 'پزشک';
        const nameEl = document.getElementById('js-doctor-name');
        if (nameEl) nameEl.textContent = `دکتر ${displayName} عزیز، خسته نباشید`;

        return { sessionUser: session.user, profile };
    }

    const authData = await verifyDoctorAccess();
    if (!authData) return;

    const tbody = document.getElementById('js-doctor-appointments-tbody');
    const filterBtns = document.querySelectorAll('.d-btn-filter');
    const logoutBtn = document.getElementById('js-doctor-logout');

    const noteModal = document.getElementById('js-note-modal');
    const noteTextarea = document.getElementById('js-note-textarea');
    const notePatientName = document.getElementById('js-note-patient-name');
    const saveNoteBtn = document.getElementById('js-save-note-btn');

    const historyModal = document.getElementById('js-history-modal');
    const historyContent = document.getElementById('js-history-content');

    let doctorAppointments = [];
    let currentEditingAppointmentId = null;
    const currentDoctorName = `${authData.profile.name} ${authData.profile.family || ''}`.trim();

    document.querySelectorAll('.js-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if(noteModal) noteModal.close();
            if(historyModal) historyModal.close();
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    async function loadAppointments() {
        if (!tbody) return;
        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">در حال بارگذاری نوبت‌ها...</td></tr>';
            const allAppointments = await window.appointmentsService.getAllAppointments();

            doctorAppointments = allAppointments.filter(app =>
                (app.doctorId && String(app.doctorId) === String(authData.sessionUser.id)) ||
                (app.doctorName && app.doctorName.includes(currentDoctorName))
            );

            const activeFilter = document.querySelector('.d-btn-filter.active')?.dataset.filter || 'all';
            renderTable(activeFilter);
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">خطا: ${error.message}</td></tr>`;
        }
    }

    function renderTable(filter) {
        if (!tbody) return;
        tbody.innerHTML = '';

        let filtered = doctorAppointments;

        if (filter === 'today') {
            filtered = doctorAppointments.filter(a => a.status === 'تایید شده');
        } else if (filter === 'visited') {
            filtered = doctorAppointments.filter(a => a.status === 'ویزیت شده');
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px 0; color: #64748b;">بیماری در این دسته‌بندی یافت نشد.</td></tr>';
            return;
        }

        filtered.forEach(app => {
            let statusClass = 'pending';
            if (app.status === 'تایید شده') statusClass = 'approved';
            if (app.status === 'ویزیت شده') statusClass = 'visited';
            if (app.status === 'رد شده' || app.status === 'کنسل شده') statusClass = 'rejected';

            const paymentStatus = app.payment_status || 'unpaid';
            const isPaid = paymentStatus === 'paid' || paymentStatus === 'تسویه شده';
            const paymentBadge = isPaid
                ? '<span style="color:#166534; font-size:11px; background:#dcfce7; padding:2px 6px; border-radius:4px;"><i class="fas fa-check-circle"></i> تسویه شده</span>'
                : '<span style="color:#991b1b; font-size:11px; background:#fee2e2; padding:2px 6px; border-radius:4px;"><i class="fas fa-exclamation-circle"></i> پرداخت نشده</span>';

            const patientName = app.patient_name || 'بیمار ناشناس';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:bold; color:#1e293b; font-size: 15px; margin-bottom:4px;">${patientName}</div>
                    ${app.patient_phone ? `<div style="font-size:12px; color:#475569;"><i class="fas fa-phone-alt" style="font-size:10px; margin-left:4px;"></i>${app.patient_phone}</div>` : ''}
                    ${paymentBadge}
                </td>
                <td>
                    <div style="font-weight:600; color:#334155; margin-bottom:4px;">${app.serviceName || '-'}</div>
                </td>
                <td>
                    <div dir="ltr" style="font-size: 14px; color:#334155; font-weight:bold;">${app.appointmentDate || app.date}</div>
                    <div dir="ltr" style="font-size: 13px; color:#64748b;">ساعت: ${app.appointmentTime || app.time}</div>
                </td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                <td>
                    <div class="d-actions-group">
                        <button class="d-btn-action js-action-history" data-phone="${app.patient_phone || ''}" data-name="${patientName}" style="background:#64748b;">
                            <i class="fas fa-folder-open"></i> پرونده
                        </button>
                        ${app.status === 'تایید شده' ? `
                            <button class="d-btn-action visit js-action-visit" data-id="${app.id}" data-payment="${paymentStatus}" data-name="${patientName}">
                                <i class="fas fa-check"></i> تعیین وضعیت
                            </button>
                        ` : ''}
                        ${app.status === 'ویزیت شده' ? `
                            <button class="d-btn-action note js-action-note" data-id="${app.id}" data-name="${patientName}" data-note="${app.doctor_notes || ''}">
                                <i class="fas fa-file-medical"></i> ${app.doctor_notes ? 'مشاهده نسخه' : 'ثبت نسخه'}
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        attachActionEvents();
    }

    function attachActionEvents() {
        document.querySelectorAll('.js-action-visit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const payment = e.currentTarget.dataset.payment;
                const name = e.currentTarget.dataset.name;

                if (!window.customModal) return;

                // پاپ‌آپ سه‌گزینه‌ای می‌آید
                const res = await window.customModal.show({
                    title: 'تعیین وضعیت بیمار',
                    message: 'لطفاً وضعیت مراجعه بیمار را مشخص کنید:',
                    confirmText: 'ویزیت شد',
                    denyText: 'عدم مراجعه',
                    showDeny: true,
                    showCancel: true
                });

                if (res === 'cancel') return;

                try {
                    // اگر پزشک روی "ویزیت شد" کلیک کرد، بررسی مالی انجام می‌شود
                    if (res === 'confirm') {
                        if (payment !== 'paid' && payment !== 'تسویه شده') {
                            await window.customModal.alert('اخطار مالی', 'بیمار هنوز هزینه را تسویه نکرده است. لطفاً بیمار را به صندوق ارجاع دهید.');
                            return;
                        }

                        await window.appointmentsService.updateAppointmentStatus(id, 'ویزیت شده');

                        // باز کردن مودال ثبت نسخه
                        currentEditingAppointmentId = id;
                        if(notePatientName) notePatientName.textContent = name;
                        if(noteTextarea) noteTextarea.value = '';
                        if(noteModal) noteModal.showModal();

                    // اگر پزشک روی "عدم مراجعه" کلیک کرد، نیازی به بررسی مالی نیست
                    } else if (res === 'deny') {
                        await window.appointmentsService.updateAppointmentStatus(id, 'عدم مراجعه');
                    }

                    await loadAppointments();
                } catch (err) {
                    await window.customModal.alert('خطا', 'خطا در ثبت: ' + err.message);
                }
            });
        });

        // بقیه متدها (مثل history و note) مشابه قبل کار می‌کنند
        document.querySelectorAll('.js-action-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentEditingAppointmentId = e.currentTarget.dataset.id;
                if(notePatientName) notePatientName.textContent = e.currentTarget.dataset.name;
                if(noteTextarea) noteTextarea.value = e.currentTarget.dataset.note || '';
                if(noteModal) noteModal.showModal();
            });
        });

        // ... بقیه توابع ...
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
            const noteText = noteTextarea.value.trim();
            if (!currentEditingAppointmentId) return;

            saveNoteBtn.disabled = true;
            saveNoteBtn.innerHTML = 'در حال ذخیره...';

            try {
                await window.appointmentsService.updateAppointmentNotes(currentEditingAppointmentId, noteText);
                if (window.customModal) await window.customModal.alert('موفقیت', 'نسخه با موفقیت ذخیره شد.');
                if (noteModal) noteModal.close();
                await loadAppointments();
            } catch (err) {
                if (window.customModal) await window.customModal.alert('خطا', err.message);
            } finally {
                saveNoteBtn.disabled = false;
                saveNoteBtn.innerHTML = 'ثبت در پرونده';
            }
        });
    }

    // فیلترها و دریافت اطلاعات اولیه
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTable(e.target.dataset.filter);
        });
    });

    loadAppointments();
});
