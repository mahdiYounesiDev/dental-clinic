document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle Logic
    const headerToggle = document.getElementById('js-header-toggle');
    const navbar = document.getElementById('js-navbar');

    if (headerToggle && navbar) {
        headerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            headerToggle.classList.toggle('c-header__toggle--active');
            navbar.classList.toggle('c-navbar--open');
        });

        const navLinks = navbar.querySelectorAll('.c-navbar__link');
        navLinks.forEach((link) => {
            link.addEventListener('click', function () {
                navLinks.forEach((item) => item.classList.remove('c-navbar__link--active'));
                this.classList.add('c-navbar__link--active');
                headerToggle.classList.remove('c-header__toggle--active');
                navbar.classList.remove('c-navbar--open');
            });
        });
    }

    // 2. User Authentication UI State in Navbar
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
        console.error('Failed to parse user session:', err);
    }

    if (currentUser && (currentUser.userName || currentUser.userEmail)) {
        const displayName = currentUser.userName || currentUser.userEmail.split('@')[0];
        if (userNameDisplay) userNameDisplay.textContent = displayName;
        if (dropdownFullname) {
            dropdownFullname.textContent = `${currentUser.userName || ''} ${currentUser.userFamily || ''}`.trim() || displayName;
        }
        if (dropdownEmail) {
            dropdownEmail.textContent = currentUser.userEmail || '';
        }

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

    // 3. Close Dropdown and Mobile Menu on Outside Click
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.classList.contains('is-hidden')) {
            if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
                userDropdown.classList.add('is-hidden');
            }
        }

        if (navbar && navbar.classList.contains('c-navbar--open')) {
            if (!navbar.contains(e.target) && !headerToggle.contains(e.target)) {
                headerToggle.classList.remove('c-header__toggle--active');
                navbar.classList.remove('c-navbar--open');
            }
        }
    });

    // 4. Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                if (window.authService && typeof window.authService.logoutUser === 'function') {
                    await window.authService.logoutUser();
                } else {
                    localStorage.removeItem('currentUser');
                }
            } catch (err) {
                console.error('Logout error:', err);
                localStorage.removeItem('currentUser');
            } finally {
                window.location.reload();
            }
        });
    }
});
