import { supabase } from '../utils_js/supabaseClient.js';

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

export async function createComment(content, userEmail) {
    if (!userEmail) {
        throw new Error('برای ثبت نظر باید ابتدا وارد حساب کاربری خود شوید.');
    }

    // ۱. دریافت اطلاعات کاربر مستقیماً از جدول users
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('userEmail', userEmail)
        .maybeSingle();

    if (userError || !userData) {
        throw new Error('کاربر یافت نشد. لطفا مجددا وارد شوید.');
    }

    const authorName = userData.fullName || userData.userName || userData.userEmail.split('@')[0];

    // ۲. ثبت نظر در جدول comments
    // نکته: اگر ستون user_id الزام اجباری (NOT NULL) ندارد، آن را ارسال نکنید یا ایمیل را ذخیره کنید
    const commentPayload = {
        content: content,
        author_name: authorName
    };

    // در صورتی که ساختار id شما در جدول users از نوع UUID استاندارد است آن را بفرستید
    if (userData.id && !userData.id.startsWith('usr-')) {
        commentPayload.user_id = userData.id;
    }

    const { data, error } = await supabase
        .from('comments')
        .insert([commentPayload])
        .select();

    if (error) throw error;
    return data[0];
}
