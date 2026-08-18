document.addEventListener('DOMContentLoaded', () => {
    const headerToggle = document.getElementById('js-header-toggle');
    const navbarMenu = document.getElementById('js-navbar');
    const navLinks = document.querySelectorAll('.c-navbar__link');

    // باز و بستن منوی موبایل
    if (headerToggle && navbarMenu) {
        headerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            headerToggle.classList.toggle('c-header__toggle--active');
            navbarMenu.classList.toggle('c-navbar--open');
        });

        // بستن منو با کلیک بیرون از آن
        document.addEventListener('click', (e) => {
            if (navbarMenu.classList.contains('c-navbar--open')) {
                if (!navbarMenu.contains(e.target) && !headerToggle.contains(e.target)) {
                    headerToggle.classList.remove('c-header__toggle--active');
                    navbarMenu.classList.remove('c-navbar--open');
                }
            }
        });
    }

    // مدیریت وضعیت فعال بودن آیتم‌های منو (Active State)
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(item => item.classList.remove('c-navbar__link--active'));
            this.classList.add('c-navbar__link--active');

            // بستن خودکار منوی موبایل پس از انتخاب لینک
            if (navbarMenu && navbarMenu.classList.contains('c-navbar--open')) {
                headerToggle.classList.remove('c-header__toggle--active');
                navbarMenu.classList.remove('c-navbar--open');
            }
        });
    });
});
