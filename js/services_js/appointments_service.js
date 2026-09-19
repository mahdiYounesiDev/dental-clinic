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

    async updateAppointmentStatus(appointmentId, newStatus, secretaryNote = '') {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status: newStatus, secretary_note: secretaryNote })
            .eq('id', appointmentId)
            .select();
        if (error) throw new Error(error.message);
        return data[0];
    }
}

window.appointmentsService = new AppointmentsService();
