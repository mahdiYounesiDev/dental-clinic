import { supabase } from '../utils_js/supabaseClient.js';

class AppointmentsService {
    async getAllAppointments() {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    }

    async getUserAppointments(userId) {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('userId', userId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    }

    async createAppointment(appointmentData) {
        const { data, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select();
        if (error) throw new Error(error.message);
        return data[0];
    }

    async cancelAppointment(appointmentId) {
        const { data, error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId)
            .select();
        if (error) throw new Error(error.message);
        return data[0];
    }

    // متد آپدیت وضعیت توسط منشی و پزشک
    async updateAppointmentStatus(appointmentId, newStatus, secretaryNote = '') {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status: newStatus, secretary_note: secretaryNote })
            .eq('id', appointmentId)
            .select();
        if (error) throw new Error(error.message);
        return data[0];
    }

    // 🔴 متد جدید و حیاتی برای پنل پزشک: ثبت یا ویرایش نسخه/شرح‌حال
    async updateAppointmentNotes(appointmentId, notes) {
        const { data, error } = await supabase
            .from('appointments')
            .update({ doctor_notes: notes })
            .eq('id', appointmentId)
            .select();
        if (error) throw new Error(error.message);
        return data[0];
    }
}

window.appointmentsService = new AppointmentsService();
