document.addEventListener('DOMContentLoaded', () => {
    // ==================== 1. Password Visibility Toggle Logic ====================
    const togglePasswordBtn = document.getElementById('js-toggle-password');
    const passwordInput = document.getElementById('js-password-input');
    const eyeIcon = document.getElementById('js-eye-icon');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault(); // جلوگیری از ارسال احتمالی فرم

            // برسی نوع فعلی فیلد
            const isPassword = passwordInput.getAttribute('type') === 'password';

            // سوییچ بین password و text
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

            // تغییر آیکون چشم (کلاس‌های FontAwesome)
            if (eyeIcon) {
                if (isPassword) {
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                } else {
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                }
            }
        });
    }

    // ==================== 2. Navbar & Profile User Session ====================
    const userBtn = document.getElementById('js-user-btn');
    const userNameDisplay = document.getElementById('js-user-name-display');
    const userDropdown = document.getElementById('js-user-dropdown');
    const dropdownFullname = document.getElementById('js-dropdown-fullname');
    const dropdownEmail = document.getElementById('js-dropdown-email');
    const logoutBtn = document.getElementById('js-logout-btn');

    const currentUserRaw = localStorage.getItem('currentUser');
    let currentUser = null;

    try {
        currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    } catch (err) {
        console.error('Error parsing user session data:', err);
    }

    if (currentUser && currentUser.userName) {
        userNameDisplay.textContent = currentUser.userName;
        if (dropdownFullname) dropdownFullname.textContent = `${currentUser.userName} ${currentUser.userFamily || ''}`.trim();
        if (dropdownEmail) dropdownEmail.textContent = currentUser.userEmail || '';

        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('is-hidden');
        });
    } else {
        userNameDisplay.textContent = 'ورود / ثبت‌نام';
        userBtn.addEventListener('click', () => {
            window.location.href = './pages/login.html';
        });
    }

    // بستن منوی کشویی هنگام کلیک بیرون
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.classList.contains('is-hidden')) {
            if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
                userDropdown.classList.add('is-hidden');
            }
        }
    });

    // دکمه خروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.reload();
        });
    }
});
