import { supabase } from '../utils_js/supabaseClient.js';

class AdminService {
    // ---------- بخش مدیریت کاربران ----------
    async getAllUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async updateUserRole(userId, newRole) {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw new Error(error.message);
        return true;
    }

    async deleteUser(userId) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw new Error(error.message);
        return true;
    }

    // ---------- بخش مدیریت پزشکان ----------
    async getAllDoctors() {
        // حذف order('created_at') برای جلوگیری از ارور نبود ستون
        const { data, error } = await supabase
            .from('doctors')
            .select('*');

        if (error) throw new Error(error.message);
        return data;
    }

    async upsertDoctor(payload) {
        const { data, error } = await supabase
            .from('doctors')
            .upsert([payload])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    }

    async deleteDoctor(id) {
        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }

    // ---------- بخش مدیریت خدمات ----------
    async getAllServices() {
        // حذف order('created_at') برای جلوگیری از ارور نبود ستون
        const { data, error } = await supabase
            .from('services')
            .select('*');

        if (error) throw new Error(error.message);
        return data;
    }

    async upsertService(payload) {
        const { data, error } = await supabase
            .from('services')
            .upsert([payload])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    }

    async deleteService(id) {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }

    // ---------- بخش مدیریت مالی و نوبت‌ها ----------
    async getAllAppointments() {
        // استفاده از createdAt (با C بزرگ) که در جدول نوبت‌ها وجود دارد
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async settlePayment(appointmentId, totalAmount) {
        const { error } = await supabase
            .from('appointments')
            .update({
                payment_status: 'settled',
                paid_amount: totalAmount
            })
            .eq('id', appointmentId);

        if (error) throw new Error(error.message);
        return true;
    }
}

window.adminService = new AdminService();
export const adminService = window.adminService;
