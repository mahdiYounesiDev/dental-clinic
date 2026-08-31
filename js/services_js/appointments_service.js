import { supabase } from '../utils_js/supabaseClient.js';

class AppointmentsService {
    async getAllAppointments() {
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) throw new Error(error.message);
        return data;
    }

    async getUserAppointments(userId) {
        const { data, error } = await supabase.from('appointments').select('*').eq('userId', userId);
        if (error) throw new Error(error.message);
        return data;
    }

    async createAppointment(appointmentData) {
        const { data, error } = await supabase.from('appointments').insert([appointmentData]).select();
        if (error) throw new Error(error.message);
        return data[0];
    }

    async cancelAppointment(appointmentId) {
        const { data, error } = await supabase.from('appointments').delete().eq('id', appointmentId).select();
        if (error) throw new Error(error.message);
        return data[0];
    }
}

window.appointmentsService = new AppointmentsService();
