/**
 * سیستم مدال و پاپ‌آپ سفارشی
 */
export class CustomModal {
    constructor() {
        this.dialog = null;
        this.titleEl = null;
        this.messageEl = null;
        this.confirmBtn = null;
        this.denyBtn = null;
        this.cancelBtn = null;

        this._init();
    }

    // ساخت عناصر HTML در صورت عدم وجود در صفحه
    _init() {
        if (document.getElementById('c-custom-modal')) {
            this.dialog = document.getElementById('c-custom-modal');
        } else {
            this.dialog = document.createElement('dialog');
            this.dialog.id = 'c-custom-modal';
            this.dialog.className = 'c-modal';
            this.dialog.innerHTML = `
                <div class="c-modal__container">
                    <h3 class="c-modal__title" id="js-modal-title"></h3>
                    <p class="c-modal__message" id="js-modal-message"></p>
                    <div class="c-modal__actions">
                        <button type="button" class="c-modal__btn c-modal__btn--confirm" id="js-modal-confirm">بله</button>
                        <button type="button" class="c-modal__btn c-modal__btn--deny" id="js-modal-deny">خیر</button>
                        <button type="button" class="c-modal__btn c-modal__btn--cancel" id="js-modal-cancel">انصراف</button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.dialog);
        }

        this.titleEl = this.dialog.querySelector('#js-modal-title');
        this.messageEl = this.dialog.querySelector('#js-modal-message');
        this.confirmBtn = this.dialog.querySelector('#js-modal-confirm');
        this.denyBtn = this.dialog.querySelector('#js-modal-deny');
        this.cancelBtn = this.dialog.querySelector('#js-modal-cancel');
    }

    /**
     * متد اصلی برای نمایش مدال
     * @param {Object} options تنظیمات پاپ‌آپ
     * @returns {Promise<string>} پاسخ کاربر: 'confirm' | 'deny' | 'cancel'
     */
    show({ title = 'تایید عملیات', message = '', confirmText = 'بله', denyText = 'خیر', showDeny = false, showCancel = false }) {
        return new Promise((resolve) => {
            this.titleEl.textContent = title;
            this.messageEl.textContent = message;

            this.confirmBtn.textContent = confirmText;
            this.denyBtn.textContent = denyText;

            // مدیریت نمایش دکمه‌ها
            this.denyBtn.style.display = showDeny ? 'inline-block' : 'none';
            this.cancelBtn.style.display = showCancel ? 'inline-block' : 'none';

            // کلون کردن دکمه‌ها جهت پاکسازی EventListenerهای قبلی
            const newConfirm = this.confirmBtn.cloneNode(true);
            const newDeny = this.denyBtn.cloneNode(true);
            const newCancel = this.cancelBtn.cloneNode(true);

            this.confirmBtn.parentNode.replaceChild(newConfirm, this.confirmBtn);
            this.denyBtn.parentNode.replaceChild(newDeny, this.denyBtn);
            this.cancelBtn.parentNode.replaceChild(newCancel, this.cancelBtn);

            this.confirmBtn = newConfirm;
            this.denyBtn = newDeny;
            this.cancelBtn = newCancel;

            const handleClose = (result) => {
                this.dialog.close();
                resolve(result);
            };

            this.confirmBtn.addEventListener('click', () => handleClose('confirm'));
            this.denyBtn.addEventListener('click', () => handleClose('deny'));
            this.cancelBtn.addEventListener('click', () => handleClose('cancel'));

            // بستن با کلیک روی پس‌زمینه (Backdrop)
            this.dialog.onclick = (e) => {
                if (e.target === this.dialog) {
                    handleClose('cancel');
                }
            };

            this.dialog.showModal();
        });
    }

    // متد اختصاصی برای پیام‌های خطایی یا هشداری ساده (جایگزین alert)
    alert(title, message) {
        return this.show({
            title,
            message,
            confirmText: 'متوجه شدم',
            showDeny: false,
            showCancel: false
        });
    }

    // متد اختصاصی برای گرفتن تاییدیه دو گزینه‌ای یا سه گزینه‌ای
    confirm(title, message, showCancel = false) {
        return this.show({
            title,
            message,
            confirmText: 'بله',
            denyText: 'خیر',
            showDeny: true,
            showCancel: showCancel
        });
    }
}

// ساخت یک نمونه global جهت استفاده آسان در تمام فایل‌ها
window.customModal = new CustomModal();
