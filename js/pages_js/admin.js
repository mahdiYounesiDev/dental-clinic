import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.querySelectorAll('.a-sidebar__nav a[data-target]');
    const sections = document.querySelectorAll('.js-section');

    const usersTbody = document.getElementById('js-users-tbody');
    const userFilterBtns = document.querySelectorAll('.a-btn-filter');
    const searchInput = document.getElementById('js-admin-search');

    const docsTbody = document.getElementById('js-doctors-tbody');
    const srvsTbody = document.getElementById('js-services-tbody');
    const addDoctorBtn = document.getElementById('js-add-doctor-btn');
    const addServiceBtn = document.getElementById('js-add-service-btn');

    const docModal = document.getElementById('js-doctor-modal');
    const srvModal = document.getElementById('js-service-modal');
    const docForm = document.getElementById('js-doctor-form');
    const srvForm = document.getElementById('js-service-form');

    const galleryGrid = document.getElementById('js-gallery-grid');
    const galleryForm = document.getElementById('js-gallery-form');

    const logoutBtn = document.getElementById('js-admin-logout');
    const toast = document.getElementById('js-admin-toast');

    const financeTbody = document.getElementById('js-finance-tbody');

    let allUsers = [];
    let allDoctors = [];
    let allServices = [];

    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) return window.location.href = '../pages/login.html';
    const currentUser = JSON.parse(userRaw);

    if (currentUser.role !== 'admin') {
        if (window.customModal) await window.customModal.alert('عدم دسترسی', 'این بخش فقط برای مدیریت مجاز است.');
        return window.location.href = '../index.html';
    }

    document.getElementById('js-admin-name').textContent = `${currentUser.userName || currentUser.name} | مدیر کل`;

    // Drag to Scroll
    document.querySelectorAll('.js-drag-scroll').forEach(slider => {
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
    });

    // Navigation Tabs
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const targetId = e.currentTarget.dataset.target;
            sections.forEach(sec => {
                if(sec.id === targetId) sec.classList.remove('is-hidden');
                else sec.classList.add('is-hidden');
            });
        });
    });

    // Close Modals
    document.querySelectorAll('.js-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if(docModal) docModal.close();
            if(srvModal) srvModal.close();
            docForm.reset();
            srvForm.reset();
        });
    });

    // Helpers
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function formatMoney(amount) {
        if (!amount && amount !== 0) return '۰';
        return Number(amount).toLocaleString('fa-IR');
    }

    function toEnglishNumber(value) {
        if (!value) return '';
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(value).replace(/[۰-۹]/g, w => persianNumbers.indexOf(w));
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const d = new Date(dateString);
            return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
        } catch (e) { return dateString; }
    }

    function safeJSONParse(str, fallback = []) {
        if (!str) return fallback;
        if (typeof str !== 'string') return str;
        try { return JSON.parse(str); } catch(e) { return fallback; }
    }

    // --- USERS SECTION ---
    async function fetchUsers() {
        try {
            allUsers = await window.adminService.getAllUsers();
            applyUserFilters();
        } catch (err) { console.error(err); }
    }

    function applyUserFilters() {
        const activeBtn = document.querySelector('.a-btn-filter.active');
        const roleFilter = activeBtn ? activeBtn.dataset.filter : 'all';
        const query = toEnglishNumber(searchInput.value.trim().toLowerCase());

        let filtered = allUsers;
        if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
        if (query) {
            filtered = filtered.filter(u =>
                (u.userName || u.name || '').toLowerCase().includes(query) ||
                (u.userFamily || u.family || '').toLowerCase().includes(query) ||
                (u.userPhone || u.phone || '').includes(query)
            );
        }
        renderUsers(filtered);
    }

    function renderUsers(users) {
        usersTbody.innerHTML = '';
        if (users.length === 0) {
            usersTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">کاربری یافت نشد.</td></tr>';
            return;
        }

        const roleNames = {
            'user': 'بیمار / کاربر عادی',
            'secretary': 'منشی / پذیرش',
            'doctor': 'پزشک متخصص',
            'admin': 'مدیر سیستم'
        };

        users.forEach(u => {
            const tr = document.createElement('tr');
            const isSelf = String(u.id) === String(currentUser.id);
            const selectDisabled = isSelf ? 'disabled' : '';

            tr.innerHTML = `
                <td><div style="font-weight:bold; color:var(--color-dark);">${u.name || u.userName} ${u.family || u.userFamily || ''} ${isSelf ? '<span style="color:var(--color-mint); font-size:11px;">(شما)</span>' : ''}</div></td>
                <td><div style="font-size:13px; color:#64748b;">${u.phone || u.userPhone || '-'}</div></td>
                <td><span style="font-size:13px;">${formatDate(u.created_at || u.userCreatedAt)}</span></td>
                <td>
                    <select class="a-role-select js-role-select" data-id="${u.id}" ${selectDisabled}>
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>${roleNames['user']}</option>
                        <option value="secretary" ${u.role === 'secretary' ? 'selected' : ''}>${roleNames['secretary']}</option>
                        <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>${roleNames['doctor']}</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${roleNames['admin']}</option>
                    </select>
                </td>
                <td>${!isSelf ? `<button class="a-btn-delete js-delete-user" data-id="${u.id}"><i class="fas fa-trash"></i> حذف</button>` : '-'}</td>
            `;
            usersTbody.appendChild(tr);
        });

        document.querySelectorAll('.js-role-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const newRole = e.target.value;
                const uid = e.target.dataset.id;
                if(!window.customModal) return;
                const res = await window.customModal.confirm('تغییر دسترسی', `آیا از تغییر سطح دسترسی این کاربر اطمینان دارید؟`);
                if(res === 'confirm') {
                    await window.adminService.updateUserRole(uid, newRole);
                    showToast('دسترسی کاربر تغییر کرد.');
                    fetchUsers();
                } else { fetchUsers(); }
            });
        });

        document.querySelectorAll('.js-delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.currentTarget.dataset.id;
                if(!window.customModal) return;
                const res = await window.customModal.confirm('اخطار', 'آیا از حذف این کاربر اطمینان دارید؟');
                if(res === 'confirm') {
                    await window.adminService.deleteUser(uid);
                    showToast('کاربر حذف شد.');
                    fetchUsers();
                }
            });
        });
    }

    userFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            userFilterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyUserFilters();
        });
    });
    searchInput.addEventListener('input', applyUserFilters);


    // --- DOCTORS SECTION ---
    async function fetchDoctors() {
        try {
            allDoctors = await window.adminService.getAllDoctors();
            renderDoctors();
            updateServiceDoctorSelect();
            updateGalleryDoctorSelect();
        } catch (err) { console.error(err); }
    }

    function updateGalleryDoctorSelect() {
        const sel = document.getElementById('gal-doctor');
        if (!sel) return;
        sel.innerHTML = '<option value="">نامشخص / کلینیک</option>';
        allDoctors.forEach(doc => {
            const specs = safeJSONParse(doc.doctorSpecializations).join(' و ');
            const opt = document.createElement('option');
            opt.value = `دکتر ${doc.doctorName} ${doc.doctorFamily} ${specs ? '(' + specs + ')' : ''}`;
            opt.textContent = `دکتر ${doc.doctorName} ${doc.doctorFamily} ${specs ? '- ' + specs : ''}`;
            sel.appendChild(opt);
        });
    }

    function renderDoctors() {
        docsTbody.innerHTML = '';
        if (allDoctors.length === 0) {
            docsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">هیچ پزشکی یافت نشد.</td></tr>';
            return;
        }

        allDoctors.forEach(doc => {
            const specs = safeJSONParse(doc.doctorSpecializations);
            const specsHtml = specs.map(s => `<span class="a-badge">${s}</span>`).join('');

            const avatarHtml = doc.avatarUrl
                ? `<img src="${doc.avatarUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; margin-left:12px;">`
                : `<div style="width:36px; height:36px; border-radius:50%; background:var(--color-sky); display:flex; align-items:center; justify-content:center; color:var(--color-primary); font-family:'TextBold'; margin-left:12px;">${doc.doctorName ? doc.doctorName.charAt(0) : 'پ'}</div>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center;">
                        ${avatarHtml}
                        <div>
                            <div style="font-weight:bold; color:var(--color-dark);">دکتر ${doc.doctorName} ${doc.doctorFamily}</div>
                            <div style="font-size:11px; color:#64748b;">${doc.doctorDegree || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${specsHtml || '-'}</td>
                <td>${doc.doctorWorkExperience || 0} سال</td>
                <td><div style="font-size:13px; direction:ltr; text-align:right;">${doc.doctorPhone}</div></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="a-btn-edit js-edit-doc" data-id="${doc.id}"><i class="fas fa-edit"></i> ویرایش</button>
                        <button class="a-btn-delete js-delete-doc" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            docsTbody.appendChild(tr);
        });

        document.querySelectorAll('.js-edit-doc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const doc = allDoctors.find(d => String(d.id) === String(id));
                if(!doc) return;

                document.getElementById('js-doctor-modal-title').textContent = 'ویرایش اطلاعات پزشک';
                document.getElementById('doc-id').value = doc.id;
                document.getElementById('doc-name').value = doc.doctorName || '';
                document.getElementById('doc-family').value = doc.doctorFamily || '';
                document.getElementById('doc-phone').value = doc.doctorPhone || '';
                document.getElementById('doc-email').value = doc.doctorEmail || '';
                document.getElementById('doc-degree').value = doc.doctorDegree || '';
                document.getElementById('doc-exp').value = doc.doctorWorkExperience || '';
                document.getElementById('doc-avatar-url').value = doc.avatarUrl || '';
                document.getElementById('doc-file').value = '';

                const specs = safeJSONParse(doc.doctorSpecializations);
                document.getElementById('doc-spec').value = specs.join('، ');

                docModal.showModal();
            });
        });

        document.querySelectorAll('.js-delete-doc').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const res = await window.customModal.confirm('حذف پزشک', 'آیا از حذف این پزشک اطمینان دارید؟');
                if(res === 'confirm') {
                    await window.adminService.deleteDoctor(id);
                    showToast('پزشک با موفقیت حذف شد.');
                    fetchDoctors();
                }
            });
        });
    }

    addDoctorBtn.addEventListener('click', () => {
        docForm.reset();
        document.getElementById('doc-id').value = '';
        document.getElementById('doc-avatar-url').value = '';
        document.getElementById('js-doctor-modal-title').textContent = 'ثبت پزشک جدید';
        docModal.showModal();
    });

    docForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = docForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'در حال ذخیره‌سازی...';

        try {
            const id = document.getElementById('doc-id').value;
            const rawSpecs = document.getElementById('doc-spec').value;
            const specsArray = rawSpecs.split(/[,،-]/).map(s => s.trim()).filter(s => s.length > 0);

            let finalAvatarUrl = document.getElementById('doc-avatar-url').value;
            const fileInput = document.getElementById('doc-file');

            if (fileInput.files && fileInput.files[0]) {
                finalAvatarUrl = await window.galleryService.uploadImage(fileInput.files[0], 'avatars');
            }

            const payload = {
                doctorName: document.getElementById('doc-name').value,
                doctorFamily: document.getElementById('doc-family').value,
                doctorPhone: toEnglishNumber(document.getElementById('doc-phone').value),
                doctorEmail: document.getElementById('doc-email').value,
                doctorDegree: document.getElementById('doc-degree').value,
                doctorWorkExperience: parseInt(document.getElementById('doc-exp').value) || 0,
                doctorSpecializations: JSON.stringify(specsArray),
                avatarUrl: finalAvatarUrl,
                role: 'doctor'
            };

            if (id) { payload.id = id; }
            else { payload.id = `doc-${Date.now()}`; payload.doctorCreatedAt = new Date().toISOString(); }

            await window.adminService.upsertDoctor(payload);
            showToast('اطلاعات پزشک با موفقیت ذخیره شد.');
            docModal.close();
            fetchDoctors();
        } catch(err) {
            window.customModal.alert('خطا', err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'ذخیره اطلاعات پزشک';
        }
    });

    // --- SERVICES SECTION ---
    async function fetchServices() {
        try {
            allServices = await window.adminService.getAllServices();
            renderServices();
        } catch (err) { console.error(err); }
    }

    function updateServiceDoctorSelect() {
        const sel = document.getElementById('srv-doctor');
        sel.innerHTML = '<option value="" disabled selected>پزشک معالج را انتخاب کنید...</option>';
        allDoctors.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = `دکتر ${doc.doctorName} ${doc.doctorFamily}`;
            sel.appendChild(opt);
        });
    }

    function renderServices() {
        srvsTbody.innerHTML = '';
        if (allServices.length === 0) {
            srvsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">هیچ خدمتی یافت نشد.</td></tr>';
            return;
        }

        allServices.forEach(srv => {
            const doc = allDoctors.find(d => String(d.id) === String(srv.serviceDoctorId));
            const docName = doc ? `دکتر ${doc.doctorName} ${doc.doctorFamily}` : 'نامشخص';

            const priceHtml = `<div style="font-size:12px;">مبلغ کل: <strong style="color:var(--color-primary);">${formatMoney(srv.price)}</strong> تومان<br><span style="color:#64748b; font-size:11px;">پیش‌پرداخت: ${formatMoney(srv.prepayment)} تومان</span></div>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:bold; color:var(--color-dark);">${srv.serviceName}</td>
                <td><span class="a-badge" style="background:var(--color-sky); color:var(--color-primary);">${docName}</span></td>
                <td>${priceHtml}</td>
                <td><div style="font-size:12px; color:#64748b; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${srv.serviceDescription || '-'}</div></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="a-btn-edit js-edit-srv" data-id="${srv.id}"><i class="fas fa-edit"></i> ویرایش</button>
                        <button class="a-btn-delete js-delete-srv" data-id="${srv.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            srvsTbody.appendChild(tr);
        });

        document.querySelectorAll('.js-edit-srv').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const srv = allServices.find(s => String(s.id) === String(id));
                if(!srv) return;

                document.getElementById('js-service-modal-title').textContent = 'ویرایش خدمت تخصصی';
                document.getElementById('srv-id').value = srv.id;
                document.getElementById('srv-name').value = srv.serviceName || '';
                document.getElementById('srv-desc').value = srv.serviceDescription || '';
                document.getElementById('srv-doctor').value = srv.serviceDoctorId || '';

                // NEW: Populate Price
                document.getElementById('srv-price').value = srv.price || 0;
                document.getElementById('srv-prepayment').value = srv.prepayment || 0;

                srvModal.showModal();
            });
        });

        document.querySelectorAll('.js-delete-srv').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const res = await window.customModal.confirm('حذف خدمت', 'آیا از حذف این خدمت اطمینان دارید؟');
                if(res === 'confirm') {
                    await window.adminService.deleteService(id);
                    showToast('خدمت با موفقیت حذف شد.');
                    fetchServices();
                }
            });
        });
    }

    addServiceBtn.addEventListener('click', () => {
        srvForm.reset();
        document.getElementById('srv-id').value = '';
        document.getElementById('js-service-modal-title').textContent = 'ثبت خدمت جدید';
        srvModal.showModal();
    });

    srvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('srv-id').value;
        const payload = {
            serviceName: document.getElementById('srv-name').value,
            serviceDescription: document.getElementById('srv-desc').value,
            serviceDoctorId: document.getElementById('srv-doctor').value,
            price: Number(document.getElementById('srv-price').value) || 0,
            prepayment: Number(document.getElementById('srv-prepayment').value) || 0
        };

        if (id) { payload.id = id; }
        else { payload.id = `srv-${Date.now()}`; }

        try {
            await window.adminService.upsertService(payload);
            showToast('خدمت و قیمت‌ها با موفقیت ثبت شد.');
            srvModal.close();
            fetchServices();
        } catch(err) { window.customModal.alert('خطا', err.message); }
    });

    // --- NEW: FINANCE SECTION ---
    async function fetchFinances() {
        if (!financeTbody) return;
        try {
            const appointments = await window.adminService.getAllAppointments();
            financeTbody.innerHTML = '';

            if (appointments.length === 0) {
                financeTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">هیچ نوبتی ثبت نشده است.</td></tr>';
                return;
            }

            appointments.forEach(app => {
                let statusBadge = '';
                let actionBtn = '';

                if (app.payment_status === 'settled') {
                    statusBadge = '<span class="a-badge" style="background:#dcfce7; color:#166534;">تسویه شده</span>';
                    actionBtn = '<span style="color:#94a3b8; font-size:12px;">تکمیل شده</span>';
                } else if (app.payment_status === 'prepaid') {
                    statusBadge = '<span class="a-badge" style="background:#fef08a; color:#854d0e;">پیش‌پرداخت شده</span>';
                    actionBtn = `<button class="a-btn-primary js-settle-btn" style="padding:6px 12px; font-size:11px;" data-id="${app.id}" data-total="${app.total_price}">ثبت تسویه کامل</button>`;
                } else {
                    statusBadge = '<span class="a-badge" style="background:#fee2e2; color:#991b1b;">پرداخت نشده</span>';
                    actionBtn = `<button class="a-btn-primary js-settle-btn" style="padding:6px 12px; font-size:11px;" data-id="${app.id}" data-total="${app.total_price}">ثبت تسویه کامل</button>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-size:11px; color:#64748b; direction:ltr;">${app.id.substring(0,8)}</td>
                    <td><strong style="color:var(--color-dark);">${app.serviceName}</strong><br><span style="font-size:11px; color:#64748b;">${app.doctorName}</span></td>
                    <td style="font-size:12px; color:#475569;">${app.appointmentDate || app.date} <br> <span style="color:var(--color-primary); font-weight:bold;">${app.appointmentTime || app.time}</span></td>
                    <td style="font-weight:bold;">${formatMoney(app.total_price)} <span style="font-size:10px;font-weight:normal;">تومان</span></td>
                    <td style="color:var(--color-mint); font-weight:bold;">${formatMoney(app.paid_amount)} <span style="font-size:10px;font-weight:normal;">تومان</span></td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                `;
                financeTbody.appendChild(tr);
            });

            document.querySelectorAll('.js-settle-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const total = e.currentTarget.dataset.total;
                    const res = await window.customModal.confirm('تسویه حساب', 'آیا بیمار مابقی مبلغ را پرداخت کرده و تسویه ثبت شود؟');
                    if(res === 'confirm') {
                        await window.adminService.settlePayment(id, total);
                        showToast('تسویه حساب با موفقیت ثبت شد.');
                        fetchFinances();
                    }
                });
            });

        } catch (err) { console.error(err); }
    }

    // --- GALLERY SECTION ---
    async function fetchGallery() {
        if (!galleryGrid) return;
        try {
            const items = await window.galleryService.getAllGalleryItems();
            galleryGrid.innerHTML = items.map(item => `
                <div class="a-gallery-card">
                    <div class="a-gallery-images-wrap">
                        <img src="${item.before_image_url}" alt="Before">
                        <img src="${item.after_image_url}" alt="After">
                    </div>
                    <div class="a-gallery-card-body">
                        <h4>${item.title || 'بدون عنوان'}</h4>
                        ${item.doctor_name ? `<p style="font-size:12px; color:#64748b; margin:0;"><i class="fas fa-user-md"></i> ${item.doctor_name}</p>` : ''}
                        ${item.hashtag ? `<span class="a-badge" style="background:#e0f2fe; color:#0284c7; margin-top:5px; align-self: flex-start;">${item.hashtag}</span>` : ''}
                        <button class="a-btn-delete js-delete-gal" data-id="${item.id}" data-before="${item.before_image_url}" data-after="${item.after_image_url}" style="width:100%; justify-content:center; margin-top:8px;"><i class="fas fa-trash"></i> حذف تصویر</button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.js-delete-gal').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const before = e.currentTarget.dataset.before;
                    const after = e.currentTarget.dataset.after;

                    const res = await window.customModal.confirm('حذف تصویر', 'آیا از حذف این مورد از گالری اطمینان دارید؟');
                    if(res === 'confirm') {
                        await window.galleryService.deleteGalleryItem(id, before, after);
                        showToast('تصویر با موفقیت حذف شد.');
                        fetchGallery();
                    }
                });
            });
        } catch (error) { console.error(error); }
    }

    if (galleryForm) {
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = galleryForm.querySelector('button[type="submit"]');

            const titleInput = document.getElementById('gal-title').value;
            const doctorInput = document.getElementById('gal-doctor').value;
            const hashtagInput = document.getElementById('gal-hashtag').value;
            const beforeInput = document.getElementById('gal-before-file').files[0];
            const afterInput = document.getElementById('gal-after-file').files[0];

            if (!beforeInput || !afterInput) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال آپلود...';

            try {
                await window.galleryService.addGalleryItem(beforeInput, afterInput, titleInput, doctorInput, hashtagInput);
                showToast('تصاویر با موفقیت آپلود و ذخیره شدند.');
                galleryForm.reset();
                fetchGallery();
            } catch (error) {
                window.customModal.alert('خطا', error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> شروع آپلود تصاویر';
            }
        });
    }

    // --- LOGOUT ---
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (window.authService && window.authService.logoutUser) await window.authService.logoutUser();
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    // --- INIT ---
    await fetchUsers();
    await fetchDoctors();
    await fetchServices();
    await fetchGallery();
    await fetchFinances(); // فراخوانی اولیه بخش مالی
});
