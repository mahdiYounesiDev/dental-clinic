/* ==================== Application Logic & Persian UI ==================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const signupSection = document.getElementById('signup-section');
    const signinSection = document.getElementById('signin-section');
    const signupForm = document.getElementById('signup-form');
    const signinForm = document.getElementById('signin-form');
    const showSigninBtn = document.getElementById('show-signin');
    const showSignupBtn = document.getElementById('show-signup');
    const phoneInput = document.getElementById('signup-phone');

    // Section Toggling
    showSigninBtn.addEventListener('click', () => {
        signupSection.classList.add('is-hidden');
        signinSection.classList.remove('is-hidden');
        clearFormErrors(signupForm);
    });

    showSignupBtn.addEventListener('click', () => {
        signinSection.classList.add('is-hidden');
        signupSection.classList.remove('is-hidden');
        clearFormErrors(signinForm);
    });

    // Auto Prefix & Max Length Enforcer for Iranian Phone Format
    phoneInput.addEventListener('input', (e) => {
        let value = window.validator.toEnglishDigits(e.target.value).replace(/\D/g, '');

        if (value.length > 0 && !value.startsWith('0')) {
            value = '09' + value;
        } else if (value.length > 1 && !value.startsWith('09')) {
            value = '09' + value.substring(2);
        }

        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        e.target.value = value;
    });

    // Setup Realtime Validation for Inputs
    const attachRealtimeValidation = (form) => {
        const inputs = form.querySelectorAll('input:not([type="checkbox"]), select');

        inputs.forEach(input => {
            const handleValidation = () => {
                if (input.value.trim() === '' && input.dataset.touched !== 'true') return;
                input.dataset.touched = 'true';

                const status = window.validator.validateField(input);
                if (status.isValid) {
                    showSuccessState(input);
                } else {
                    showErrorState(input, status.message);
                }
            };

            input.addEventListener('input', handleValidation);
            input.addEventListener('blur', handleValidation);
        });
    };

    attachRealtimeValidation(signupForm);
    attachRealtimeValidation(signinForm);

    // Render Error UI with RTL Tooltip Bubble
    function showErrorState(input, message) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.remove('is-valid');
        wrapper.classList.add('is-invalid');

        let tooltip = wrapper.querySelector('.error-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'error-tooltip';
            wrapper.appendChild(tooltip);
        }
        tooltip.textContent = message;
    }

    // Render Valid UI State
    function showSuccessState(input) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.remove('is-invalid');
        wrapper.classList.add('is-valid');

        const tooltip = wrapper.querySelector('.error-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Clear Errors
    function clearFormErrors(form) {
        const wrappers = form.querySelectorAll('.input-wrapper');
        wrappers.forEach(w => {
            w.classList.remove('is-invalid', 'is-valid');
            const tooltip = w.querySelector('.error-tooltip');
            if (tooltip) tooltip.remove();
        });
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(i => delete i.dataset.touched);
    }

    // Sign Up Form Submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = signupForm.querySelectorAll('input:not([type="checkbox"]), select');
        let isFormValid = true;

        inputs.forEach(input => {
            input.dataset.touched = 'true';
            const status = window.validator.validateField(input);
            if (!status.isValid) {
                showErrorState(input, status.message);
                isFormValid = false;
            } else {
                showSuccessState(input);
            }
        });

        if (!isFormValid) return;

        const email = document.getElementById('signup-email').value.trim();
        const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');

        if (existingUsers.some(user => user.email === email)) {
            showErrorState(document.getElementById('signup-email'), 'این ایمیل قبلاً ثبت شده است');
            return;
        }

        // Save User with Metadata
        const newUser = {
            userId: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            role: "user",
            name: document.getElementById('signup-name').value.trim(),
            family: document.getElementById('signup-family').value.trim(),
            age: document.getElementById('signup-age').value.trim(),
            phone: document.getElementById('signup-phone').value.trim(),
            gender: document.getElementById('signup-gender').value,
            email: email,
            password: document.getElementById('signup-password').value
        };

        existingUsers.push(newUser);
        localStorage.setItem('app_users', JSON.stringify(existingUsers));

        alert('ثبت‌نام با موفقیت انجام شد! اکنون وارد شوید.');
        signupForm.reset();
        clearFormErrors(signupForm);
        showSigninBtn.click();
    });

    // Sign In Form Submission
    signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('signin-email');
        const passInput = document.getElementById('signin-password');

        const emailStatus = window.validator.validateField(emailInput);
        const passStatus = window.validator.validateField(passInput);

        if (!emailStatus.isValid) showErrorState(emailInput, emailStatus.message);
        if (!passStatus.isValid) showErrorState(passInput, passStatus.message);

        if (!emailStatus.isValid || !passStatus.isValid) return;

        const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
        const foundUser = existingUsers.find(u => u.email === emailInput.value.trim());

        if (!foundUser) {
            showErrorState(emailInput, 'حساب کاربری یافت نشد');
            return;
        }

        if (foundUser.password !== passInput.value) {
            showErrorState(passInput, 'کلمه عبور اشتباه است');
            return;
        }

        alert(`خوش آمدید، ${foundUser.name || 'کاربر گرامی'}!`);
        signinForm.reset();
        clearFormErrors(signinForm);
    });
});
