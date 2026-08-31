import { supabase } from '../utils_js/supabaseClient.js';

class AuthService {
    // بررسی وجود ایمیل
    async checkEmailExists(email) {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('userEmail', email);

        if (error) throw new Error('خطا در برقراری ارتباط با سرور');
        return data.length > 0;
    }

    // ثبت‌نام کاربر جدید
    async registerUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();

        if (error) throw new Error('خطا در ذخیره اطلاعات کاربر: ' + error.message);
        return data[0];
    }

    // دریافت اطلاعات کاربر با ایمیل
    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('userEmail', email)
            .maybeSingle();

        if (error) throw new Error('خطا در برقراری ارتباط با سرور');
        return data;
    }
}

window.authService = new AuthService();
