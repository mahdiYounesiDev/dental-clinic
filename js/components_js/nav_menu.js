document.addEventListener('DOMContentLoaded', () => {
    // ==================== 1. Mobile Responsive Menu Toggle & Active Link ====================
    const headerToggle = document.getElementById('js-header-toggle');
    const navbar = document.getElementById('js-navbar');

    if (headerToggle && navbar) {
        // کلیک روی دکمه برگر برای باز و بسته کردن منو
        headerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            headerToggle.classList.toggle('c-header__toggle--active');
            navbar.classList.toggle('c-navbar--open');
        });

        // مدیریت حالت فعال (Active State) و بستن منو در موبایل
        const navLinks = navbar.querySelectorAll('.c-navbar__link');
        navLinks.forEach((link) => {
            link.addEventListener('click', function () {
                // ۱. حذف کلاس active از تمام لینک‌ها
                navLinks.forEach((item) => item.classList.remove('c-navbar__link--active'));

                // ۲. افزودن کلاس active به لینکی که روی آن کلیک شده است
                this.classList.add('c-navbar__link--active');

                // ۳. بستن منو در حالت موبایل
                headerToggle.classList.remove('c-header__toggle--active');
                navbar.classList.remove('c-navbar--open');
            });
        });
    }

    // ==================== 2. Password Visibility Toggle Logic ====================
    const togglePasswordBtn = document.getElementById('js-toggle-password');
    const passwordInput = document.getElementById('js-password-input');
    const eyeIcon = document.getElementById('js-eye-icon');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

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

    // ==================== 3. Navbar & Profile User Session ====================
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
        if (userNameDisplay) userNameDisplay.textContent = currentUser.userName;
        if (dropdownFullname) dropdownFullname.textContent = `${currentUser.userName} ${currentUser.userFamily || ''}`.trim();
        if (dropdownEmail) dropdownEmail.textContent = currentUser.userEmail || '';

        if (userBtn && userDropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('is-hidden');
            });
        }
    } else {
        if (userNameDisplay) userNameDisplay.textContent = 'ورود / ثبت‌نام';
        if (userBtn) {
            userBtn.addEventListener('click', () => {
                window.location.href = './pages/login.html';
            });
        }
    }

    // بستن دراپ‌داون پروفایل و منوی موبایل با کلیک بیرون
    document.addEventListener('click', (e) => {
        // بستن دراپ‌داون کاربر
        if (userDropdown && !userDropdown.classList.contains('is-hidden')) {
            if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
                userDropdown.classList.add('is-hidden');
            }
        }

        // بستن منوی همبرگری در حالت موبایل
        if (navbar && navbar.classList.contains('c-navbar--open')) {
            if (!navbar.contains(e.target) && !headerToggle.contains(e.target)) {
                headerToggle.classList.remove('c-header__toggle--active');
                navbar.classList.remove('c-navbar--open');
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
