document.addEventListener('DOMContentLoaded', () => {
    const signupSection = document.getElementById('signup-section');
    const signinSection = document.getElementById('signin-section');
    const signupForm = document.getElementById('signup-form');
    const signinForm = document.getElementById('signin-form');
    const showSigninBtn = document.getElementById('show-signin');
    const showSignupBtn = document.getElementById('show-signup');
    const phoneInput = document.getElementById('signup-phone');


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
        const inputs = form.querySelectorAll('input:not([type="checkbox"]), select');
        inputs.forEach(input => {
            const handleValidation = () => {
                if (input.value.trim() === '' && input.dataset.touched !== 'true') return;
                input.dataset.touched = 'true';

                const status = window.validator.validateField(input);
                if (status.isValid) showSuccessState(input);
                else showErrorState(input, status.message);
            };
            input.addEventListener('input', handleValidation);
            input.addEventListener('blur', handleValidation);
        });
    };

    attachRealtimeValidation(signupForm);
    attachRealtimeValidation(signinForm);

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

    function showSuccessState(input) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.remove('is-invalid');
        wrapper.classList.add('is-valid');
        const tooltip = wrapper.querySelector('.error-tooltip');
        if (tooltip) tooltip.remove();
    }

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

        const email = document.getElementById('signup-email').value.trim();

        try {
            const isEmailTaken = await window.authService.checkEmailExists(email);
            if (isEmailTaken) {
                showErrorState(document.getElementById('signup-email'), 'این ایمیل قبلاً ثبت شده است');
                return;
            }

            const newUser = {
                id: `usr-${Date.now()}`,
                userCreatedAt: new Date().toISOString(),
                role: "user",
                userName: document.getElementById('signup-name').value.trim(),
                userFamily: document.getElementById('signup-family').value.trim(),
                userAge: document.getElementById('signup-age').value.trim(),
                userPhone: document.getElementById('signup-phone').value.trim(),
                userGender: document.getElementById('signup-gender').value,
                userEmail: email,
                userPassword: document.getElementById('signup-password').value,
                userAppointmentIds: []
            };

            await window.authService.registerUser(newUser);

            const sessionUser = {
                id: newUser.id,
                userName: newUser.userName,
                userFamily: newUser.userFamily,
                userEmail: newUser.userEmail,
                role: newUser.role
            };
            localStorage.setItem('currentUser', JSON.stringify(sessionUser));

            signupForm.reset();
            clearFormErrors(signupForm);
            window.location.href = '../index.html';

        } catch (error) {
            console.error('Error during signup:', error);
            alert('اتصال به سرور برقرار نشد.');
        }
    });

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

        try {
            const foundUser = await window.authService.getUserByEmail(emailValue);

            if (!foundUser) {
                showErrorState(emailInput, 'حساب کاربری با این ایمیل یافت نشد');
                return;
            }

            if (foundUser.userPassword !== passValue) {
                showErrorState(passInput, 'کلمه عبور اشتباه است');
                return;
            }

            const sessionUser = {
                id: foundUser.id,
                userName: foundUser.userName,
                userFamily: foundUser.userFamily,
                userEmail: foundUser.userEmail,
                role: foundUser.role
            };
            localStorage.setItem('currentUser', JSON.stringify(sessionUser));

            signinForm.reset();
            clearFormErrors(signinForm);
            window.location.href = '../index.html';

        } catch (error) {
            console.error('Error during signin:', error);
            alert('اتصال به سرور برقرار نشد.');
        }
    });
});
