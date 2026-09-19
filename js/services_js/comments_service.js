import { supabase } from '../utils_js/supabaseClient.js';

/**
 * Fetch all comments ordered by newest first.
 * @returns {Promise<Array>}
 */
export async function fetchComments() {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
    return data;
}

/**
 * Submit a new comment linked to the active user.
 * @param {string} content
 * @param {string} userEmail
 * @returns {Promise<Object>}
 */
export async function createComment(content, userEmail) {
    if (!userEmail) {
        throw new Error('برای ثبت نظر باید ابتدا وارد حساب کاربری خود شوید.');
    }

    let authorName = userEmail.split('@')[0];
    let userId = null;

    const storedUserRaw = localStorage.getItem('currentUser');
    if (storedUserRaw) {
        try {
            const parsed = JSON.parse(storedUserRaw);
            if (parsed.userName) {
                authorName = `${parsed.userName} ${parsed.userFamily || ''}`.trim();
            }
            if (parsed.id) {
                userId = parsed.id;
            }
        } catch (err) {
            console.error('Failed to parse current user:', err);
        }
    }

    const commentPayload = {
        content: content,
        author_name: authorName
    };

    if (userId) {
        commentPayload.user_id = userId;
    }

    const { data, error } = await supabase
        .from('comments')
        .insert([commentPayload])
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return data[0];
}
