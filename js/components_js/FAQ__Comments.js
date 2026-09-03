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
        try {
            const comments = await fetchComments();
            renderComments(comments);
        } catch (err) {
            console.error('خطا در دریافت نظرات:', err);
        }
    }

    // دریافت ایمیل کاربر لاگین‌شده از localStorage
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

            // استخراج ایمیل کاربر از شیء currentUser
            const userEmail = getCurrentUserEmail();

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                // ارسال متن و ایمیل به comments_service
                await createComment(text, userEmail);
                commentInput.value = '';
                await loadComments();
            } catch (err) {
                alert(err.message || 'خطایی در ثبت نظر رخ داد.');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    await loadComments();
});
