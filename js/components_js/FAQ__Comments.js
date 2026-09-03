import { fetchComments, createComment } from '../services_js/comments_service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const commentsGridWrapper = document.getElementById('js-comments-grid');
    const commentForm = document.getElementById('js-comment-form');
    const commentInput = document.getElementById('comment-text');

    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    }

    function renderComments(comments) {
        if (!commentsGridWrapper) return;

        if (!comments || comments.length === 0) {
            commentsGridWrapper.innerHTML = '<p class="c-comments__empty">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>';
            return;
        }

        commentsGridWrapper.innerHTML = comments.map(comment => {
            const avatarChar = comment.author_name ? comment.author_name.charAt(0) : 'ک';
            return `
                <article class="c-comment-card">
                    <header class="c-comment-card__header">
                        <div class="c-comment-card__user">
                            <div class="c-comment-card__avatar">
                                <span>${avatarChar}</span>
                            </div>
                            <div class="c-comment-card__info">
                                <h3 class="c-comment-card__author">${comment.author_name}</h3>
                                <time class="c-comment-card__time">${formatTime(comment.created_at)}</time>
                            </div>
                        </div>
                    </header>
                    <div class="c-comment-card__body">
                        <p>${comment.content}</p>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function loadComments() {
        if (!commentsGridWrapper) return;
        commentsGridWrapper.innerHTML = '<p class="c-comments__loading">در حال دریافت نظرات...</p>';

        try {
            const comments = await fetchComments();
            renderComments(comments);
        } catch (err) {
            console.error('خطا در دریافت نظرات:', err);
            commentsGridWrapper.innerHTML = '<p class="c-comments__error">خطا در بارگذاری نظرات.</p>';
        }
    }

    function getCurrentUserEmail() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.userEmail) {
                    return parsedUser.userEmail;
                }
            } catch (e) {
                console.error('خطا در خواندن اطلاعات کاربر:', e);
            }
        }
        return localStorage.getItem('userEmail');
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const text = commentInput.value.trim();
            if (!text) return;

            const userEmail = getCurrentUserEmail();

            // بررسی ورود کاربر قبل از ارسال فرم
            if (!userEmail) {
                if (window.customModal) {
                    await window.customModal.alert('احراز هویت', 'لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.');
                } else {
                    alert('لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.');
                }
                return;
            }

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                await createComment(text, userEmail);
                commentInput.value = '';
                await loadComments();
            } catch (err) {
                const errorMessage = err.message || 'خطایی در ثبت نظر رخ داد.';
                if (window.customModal) {
                    await window.customModal.alert('خطا در ثبت نظر', errorMessage);
                } else {
                    alert(errorMessage);
                }
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    await loadComments();
});
