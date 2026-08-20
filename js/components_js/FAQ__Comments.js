document.addEventListener('DOMContentLoaded', () => {
    const faqData = [
        {
            id: 1,
            question: 'چگونه می‌توانم نوبت حضوری ثبت کنم؟',
            answer: 'شما می‌توانید از طریق کارت پزشک مربوطه روی دکمه رزرو نوبت کلیک کرده و زمان مورد نظر خود را انتخاب کنید.',
            isOpen: true
        },
        {
            id: 2,
            question: 'آیا امکان لغو یا تغییر زمان نوبت وجود دارد؟',
            answer: 'بله، تا ۲۴ ساعت قبل از زمان ویزیت می‌توانید از پنل کاربری اقدام به لغو یا تغییر نوبت نمایید.',
            isOpen: false
        },
        {
            id: 3,
            question: 'مدارک پزشکی را چگونه ارسال کنم؟',
            answer: 'در هنگام ثبت نوبت و یا از طریق بخش پیام‌های پنل کاربری امکان آپلود پرونده پزشکی وجود دارد.',
            isOpen: false
        }
    ];

    const commentsData = [
        {
            id: 1,
            author: 'علی محمدی',
            avatarText: 'ع',
            time: '۱۰ دقیقه پیش',
            text: 'رفتار کادر درمانی بسیار محترمانه بود و روند دریافت نوبت هم خیلی سریع انجام شد.'
        },
        {
            id: 2,
            author: 'سارا احمدی',
            avatarText: 'س',
            time: '۳۰ دقیقه پیش',
            text: 'پزشک با حوصله تمام مدارک من را بررسی کردند و توضیحات کاملی ارائه دادند.'
        },
        {
            id: 3,
            author: 'رضا حسینی',
            avatarText: 'ر',
            time: '۱ ساعت پیش',
            text: 'محیط مطب بسیار تمیز و مرتب بود. فقط معطلی کوتاهی قبل از ورود داشتیم.'
        },
        {
            id: 4,
            author: 'مریم کاظمی',
            avatarText: 'م',
            time: '۲ ساعت پیش',
            text: 'سیستم ثبت نوبت آنلاین خیلی به من کمک کرد تا زمانم تلف نشود.'
        },
        {
            id: 5,
            author: 'امیر رضایی',
            avatarText: 'ا',
            time: '۳ ساعت پیش',
            text: 'کیفیت خدمات و پاسخگویی پشتیبانی عالی بود. ممنون از تیم خوبتون.'
        }
    ];

    const faqGridWrapper = document.getElementById('js-faq-grid');
    const commentsGridWrapper = document.getElementById('js-comments-grid');

    function renderFaq(items) {
        if (!faqGridWrapper) return;

        faqGridWrapper.innerHTML = items.map(item => `
            <details class="c-faq__item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" ${item.isOpen ? 'open' : ''}>
                <summary class="c-faq__question" itemprop="name">
                    <span class="c-faq__question-text">${item.question}</span>
                    <span class="c-faq__icon-box" aria-hidden="true">
                        <span class="c-faq__icon"></span>
                    </span>
                </summary>
                <div class="c-faq__answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">${item.answer}</p>
                </div>
            </details>
        `).join('');
    }

    function renderComments(comments) {
        if (!commentsGridWrapper) return;

        commentsGridWrapper.innerHTML = comments.map(comment => `
            <article class="c-comment-card">
                <header class="c-comment-card__header">
                    <div class="c-comment-card__user">
                        <div class="c-comment-card__avatar">
                            <span>${comment.avatarText}</span>
                        </div>
                        <div class="c-comment-card__info">
                            <h3 class="c-comment-card__author">${comment.author}</h3>
                            <time class="c-comment-card__time">${comment.time}</time>
                        </div>
                    </div>
                </header>
                <div class="c-comment-card__body">
                    <p>${comment.text}</p>
                </div>
            </article>
        `).join('');
    }

    renderFaq(faqData);
    renderComments(commentsData);
});
