document.addEventListener('DOMContentLoaded', () => {
    const signupSection = document.getElementById('signup-section');
    const signinSection = document.getElementById('signin-section');
    const signupForm = document.getElementById('signup-form');
    const signinForm = document.getElementById('signin-form');
    const showSigninBtn = document.getElementById('show-signin');
    const showSignupBtn = document.getElementById('show-signup');
    const phoneInput = document.getElementById('signup-phone');

    if (showSigninBtn && showSignupBtn && signupSection && signinSection) {
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
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = window.validator.toEnglishDigits(e.target.value).replace(/\D/g, '');
            if (value.length > 0 && !value.startsWith('0')) {
                value = '09' + value;
            } else if (value.length > 1 && !value.startsWith('09')) {
                value = '09' + value.substring(2);
            }
            if (value.length > 11) value = value.slice(0, 11);
            e.target.value = value;
        });
    }

    const toggleButtons = document.querySelectorAll('.password-toggle');
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = button.closest('.input-wrapper');
            const input = wrapper ? wrapper.querySelector('input') : null;
            const eyeIcon = button.querySelector('.eye-icon');

            if (!input || !eyeIcon) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            if (isPassword) {
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                `;
            }
        });
    });

    const attachRealtimeValidation = (form) => {
        if (!form) return;
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

    function showErrorState(input, message) {
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;
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

    function showSuccessState(input) {
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;
        wrapper.classList.remove('is-invalid');
        wrapper.classList.add('is-valid');
        const tooltip = wrapper.querySelector('.error-tooltip');
        if (tooltip) tooltip.remove();
    }

    function clearFormErrors(form) {
        if (!form) return;
        const wrappers = form.querySelectorAll('.input-wrapper');
        wrappers.forEach(w => {
            w.classList.remove('is-invalid', 'is-valid');
            const tooltip = w.querySelector('.error-tooltip');
            if (tooltip) tooltip.remove();
        });
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(i => delete i.dataset.touched);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
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

            const nameValue = document.getElementById('signup-name').value.trim();
            const familyValue = document.getElementById('signup-family').value.trim();
            const ageValue = document.getElementById('signup-age').value.trim();
            const phoneValue = document.getElementById('signup-phone').value.trim();
            const genderValue = document.getElementById('signup-gender').value;
            const emailValue = document.getElementById('signup-email').value.trim();
            const passwordValue = document.getElementById('signup-password').value;

            const registrationPayload = {
                email: emailValue,
                password: passwordValue,
                name: nameValue,
                family: familyValue,
                age: ageValue,
                phone: phoneValue,
                gender: genderValue
            };

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                const user = await window.authService.registerUser(registrationPayload);
                const metadata = user?.user_metadata || {};

                const sessionUser = {
                    id: user.id,
                    userName: metadata.name || nameValue,
                    userFamily: metadata.family || familyValue,
                    userEmail: user.email,
                    role: metadata.role || 'user'
                };

                localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                signupForm.reset();
                clearFormErrors(signupForm);

                window.location.href = '../index.html';
            } catch (error) {
                console.error('Registration failed:', error);
                showErrorState(document.getElementById('signup-email'), error.message || 'Error during registration');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('signin-email');
            const passInput = document.getElementById('signin-password');

            const emailStatus = window.validator.validateField(emailInput);
            const passStatus = window.validator.validateField(passInput);

            if (!emailStatus.isValid) showErrorState(emailInput, emailStatus.message);
            if (!passStatus.isValid) showErrorState(passInput, passStatus.message);

            if (!emailStatus.isValid || !passStatus.isValid) return;

            const emailValue = emailInput.value.trim();
            const passValue = passInput.value;

            const submitBtn = signinForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                const user = await window.authService.loginUser(emailValue, passValue);
                const profile = user.profile || {};

                const sessionUser = {
                    id: user.id,
                    userName: profile.name || user.email.split('@')[0],
                    userFamily: profile.family || '',
                    userEmail: user.email,
                    role: profile.role || 'user'
                };

                localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                signinForm.reset();
                clearFormErrors(signinForm);

                switch (sessionUser.role) {
                    case 'admin':
                        window.location.href = '../pages/admin.html';
                        break;
                    case 'secretary':
                        window.location.href = '../pages/secretary.html';
                        break;
                    case 'doctor':
                        window.location.href = '../pages/doctor.html';
                        break;
                    default:
                        window.location.href = '../index.html';
                }

            } catch (error) {
                console.error('Login failed:', error);
                showErrorState(passInput, 'Invalid email or password');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
});
