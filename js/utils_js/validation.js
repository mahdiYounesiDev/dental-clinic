/* ==================== Standalone Persian Form Validator ==================== */

class FormValidator {
    constructor() {
        this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        this.phoneRegex = /^09\d{9}$/;
    }

    toEnglishDigits(str) {
        return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    }

    validateRequired(value) {
        return value.trim() !== '';
    }

    validateEmail(email) {
        return this.emailRegex.test(email.trim());
    }

    validatePhone(phone) {
        const cleanPhone = this.toEnglishDigits(phone.trim());
        return this.phoneRegex.test(cleanPhone);
    }

    validatePassword(password) {
        return password.length >= 8;
    }

    validateAge(age) {
        const numAge = parseInt(this.toEnglishDigits(age), 10);
        return !isNaN(numAge) && numAge >= 1 && numAge <= 120;
    }

    validateField(inputElement) {
        const name = inputElement.name;
        const value = this.toEnglishDigits(inputElement.value);
        let result = { isValid: true, message: '' };

        if (!this.validateRequired(value)) {
            result = { isValid: false, message: 'این فیلد الزامی است' };
            return result;
        }

        switch (name) {
            case 'email':
                if (!this.validateEmail(value)) {
                    result = { isValid: false, message: 'ساختار ایمیل معتبر نیست' };
                }
                break;
            case 'phone':
                if (!value.startsWith('09')) {
                    result = { isValid: false, message: 'شماره باید با ۰۹ شروع شود' };
                } else if (value.length !== 11) {
                    result = { isValid: false, message: 'شماره همراه باید ۱۱ رقم باشد' };
                } else if (!this.validatePhone(value)) {
                    result = { isValid: false, message: 'شماره همراه معتبر نیست' };
                }
                break;
            case 'password':
                if (!this.validatePassword(value)) {
                    result = { isValid: false, message: 'کلمه عبور باید حداقل ۸ کاراکتر باشد' };
                }
                break;
            case 'age':
                if (!this.validateAge(value)) {
                    result = { isValid: false, message: 'سن باید بین ۱ تا ۱۲۰ سال باشد' };
                }
                break;
            case 'name':
            case 'family':
                if (value.trim().length < 2) {
                    result = { isValid: false, message: 'حداقل باید ۲ کاراکتر باشد' };
                }
                break;
            case 'gender':
                if (!value) {
                    result = { isValid: false, message: 'لطفا جنسیت را انتخاب کنید' };
                }
                break;
        }

        return result;
    }
}

window.validator = new FormValidator();
