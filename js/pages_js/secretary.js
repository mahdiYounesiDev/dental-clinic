document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('js-appointments-tbody');
    const filterBtns = document.querySelectorAll('.s-btn-filter');
    const logoutBtn = document.getElementById('js-secretary-logout');

    let allAppointments = [];

    // Authenticate Secretary
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) {
        window.location.href = '../pages/login.html';
        return;
    }
    const user = JSON.parse(userRaw);

    // Allow 'admin' or 'secretary' roles
    if (user.role !== 'admin' && user.role !== 'secretary') {
        alert('عدم دسترسی. شما به عنوان منشی لاگین نکرده‌اید.');
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('js-secretary-name').textContent = `${user.userName} عزیز، خوش آمدید`;

    // Logout
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.authService) await window.authService.logoutUser();
        window.location.href = '../index.html';
    });

    // Load Appointments
    async function loadAppointments() {
        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">در حال دریافت اطلاعات...</td></tr>';
            allAppointments = await window.appointmentsService.getAllAppointments();
            renderTable('all');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">خطا: ${error.message}</td></tr>`;
        }
    }

    // Render Table
    function renderTable(filter) {
        tbody.innerHTML = '';

        let filtered = allAppointments;
        if (filter === 'pending') {
            filtered = allAppointments.filter(a => a.status === 'در حال بررسی');
        } else if (filter === 'approved') {
            filtered = allAppointments.filter(a => a.status === 'تایید شده');
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">نوبتی یافت نشد.</td></tr>';
            return;
        }

        filtered.forEach(app => {
            let statusClass = 'pending';
            if (app.status === 'تایید شده') statusClass = 'approved';
            if (app.status === 'رد شده' || app.status === 'کنسل شده') statusClass = 'rejected';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>کاربر سیستم</strong><br>
                    <small style="color:gray;">ID: ${app.userId ? app.userId.substring(0,8) : 'مهمان'}</small>
                </td>
                <td>
                    <div>${app.serviceName || '-'}</div>
                    <small style="color:var(--color-primary);">${app.doctorName || '-'}</small>
                </td>
                <td>
                    <span dir="ltr">${app.appointmentDate}</span> <br>
                    <span dir="ltr">${app.appointmentTime}</span>
                </td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                <td>
                    ${app.status === 'در حال بررسی' ? `
                        <button class="s-action-btn approve js-action-approve" data-id="${app.id}">تایید</button>
                        <button class="s-action-btn reject js-action-reject" data-id="${app.id}">رد</button>
                    ` : `<small style="color:gray;">${app.secretary_note || 'بدون یادداشت'}</small>`}
                </td>
            `;
            tbody.appendChild(tr);
        });

        attachActionEvents();
    }

    // Handle Approve / Reject
    function attachActionEvents() {
        document.querySelectorAll('.js-action-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                await handleStatusChange(id, 'تایید شده', 'تایید شده توسط منشی');
            });
        });

        document.querySelectorAll('.js-action-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                await handleStatusChange(id, 'رد شده', 'رد شده به دلیل تداخل زمانی');
            });
        });
    }

    async function handleStatusChange(id, newStatus, defaultNote) {
        if (!confirm(`آیا از تغییر وضعیت به "${newStatus}" اطمینان دارید؟`)) return;

        try {
            await window.appointmentsService.updateAppointmentStatus(id, newStatus, defaultNote);
            await loadAppointments();
        } catch (err) {
            alert('خطا در تغییر وضعیت: ' + err.message);
        }
    }

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTable(e.target.dataset.filter);
        });
    });

    loadAppointments();
});
