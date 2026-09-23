import { supabase } from '../utils_js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // 1. Authentication & Role Verification (SSR)
    // ==========================================
    async function verifyUserAccess() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.href = '../pages/login.html';
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            if(window.customModal) await window.customModal.alert('Error', 'Profile not found in the system.');
            window.location.href = '../index.html';
            return null;
        }

        const greetingEl = document.getElementById('js-user-greeting');
        if(greetingEl) greetingEl.textContent = `${profile.name || 'کاربر'} عزیز، خوش آمدید`;

        return { sessionUser: session.user, profile };
    }

    const authData = await verifyUserAccess();
    if (!authData) return;

    // ==========================================
    // 2. DOM Elements
    // ==========================================
    const container = document.getElementById('js-user-appointments-container');
    const logoutBtn = document.getElementById('js-user-logout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    // ==========================================
    // 3. Fetch and Render Appointments (AJAX)
    // ==========================================
    async function loadUserAppointments() {
        try {
            // Loading State
            if (container && container.innerHTML.trim() === '') {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> در حال دریافت اطلاعات...</div>';
            }

            const apps = await window.appointmentsService.getUserAppointments(authData.sessionUser.id);

            if (!apps || apps.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:50px; background:#fff; border-radius:16px; border:1px solid #e2e8f0;">
                        <i class="far fa-calendar-times" style="font-size:40px; color:#cbd5e1; margin-bottom:15px;"></i>
                        <p style="color:#64748b; font-size:15px;">شما هیچ نوبتی در سیستم ثبت نکرده‌اید.</p>
                        <a href="../index.html" class="u-btn-outline" style="display:inline-block; margin-top:15px; background:var(--color-primary); color:#fff; border:none;">دریافت نوبت جدید</a>
                    </div>
                `;
                return;
            }

            // Sort: Newest first
            apps.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

            container.innerHTML = apps.map(app => {
                const status = (app.status || 'در حال بررسی').trim();

                let statusClass = 'pending';
                if (status === 'تایید شده' || status === 'approved') statusClass = 'approved';
                else if (status === 'رد شده' || status === 'کنسل شده' || status === 'rejected') statusClass = 'rejected';
                else if (status === 'ویزیت شده' || status === 'visited') statusClass = 'visited';
                else if (status === 'عدم مراجعه' || status === 'noshow') statusClass = 'noshow';

                const payStatus = app.payment_status || 'unpaid';
                let paymentBadge = '';

                if (payStatus === 'settled' || payStatus === 'paid') {
                    paymentBadge = '<span style="color:#10b981;"><i class="fas fa-check-circle"></i> تسویه کامل</span>';
                } else if (payStatus === 'prepaid') {
                    paymentBadge = '<span style="color:#854d0e;"><i class="fas fa-hand-holding-usd"></i> پیش‌پرداخت شده</span>';
                } else {
                    paymentBadge = '<span style="color:#ef4444;"><i class="fas fa-exclamation-circle"></i> پرداخت نشده</span>';
                }

                return `
                    <div class="u-app-card" style="transition: all 0.3s ease; animation: fadeIn 0.5s;">
                        <div class="u-app-header">
                            <div>
                                <div class="u-app-doctor"><i class="fas fa-user-md" style="color:var(--color-primary); font-size:14px;"></i> ${app.doctorName || 'پزشک کلینیک'}</div>
                                <div class="u-app-service">${app.serviceName || 'ویزیت عمومی'}</div>
                            </div>
                            <span class="status-badge ${statusClass}">${status}</span>
                        </div>

                        <div class="u-app-details">
                            <div class="u-detail-item">
                                <i class="far fa-calendar-alt"></i>
                                <span dir="ltr">${app.appointmentDate || app.date}</span>
                            </div>
                            <div class="u-detail-item">
                                <i class="far fa-clock"></i>
                                <span dir="ltr">${app.appointmentTime || app.time}</span>
                            </div>
                            <div class="u-detail-item">
                                <i class="fas fa-credit-card"></i>
                                <span>${paymentBadge}</span>
                            </div>
                        </div>

                        ${(status === 'ویزیت شده' || status === 'visited') && app.doctor_notes ? `
                            <div class="u-prescription">
                                <h4><i class="fas fa-file-prescription"></i> دستورات و نسخه پزشک:</h4>
                                <p style="white-space: pre-wrap;">${app.doctor_notes}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

        } catch (err) {
            container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">خطا در دریافت اطلاعات: ${err.message}</div>`;
        }
    }

    // ==========================================
    // 4. Supabase Realtime Subscription (Live Updates)
    // ==========================================
    function setupRealtime() {
        // Listen to ANY changes in the 'appointments' table
        supabase.channel('public:user-appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
                // If the updated row belongs to this user, reload the UI
                if (payload.new && payload.new.userId === authData.sessionUser.id) {
                    loadUserAppointments();
                } else if (payload.old && payload.old.userId === authData.sessionUser.id) {
                    loadUserAppointments(); // Handled for deletes as well
                }
            })
            .subscribe();
    }

    // Initialize Dashboard
    loadUserAppointments();
    setupRealtime();
});
