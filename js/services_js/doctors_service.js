import { supabase } from '../utils_js/supabaseClient.js';

class DoctorsService {
    async getAllDoctors() {
        const { data, error } = await supabase.from('doctors').select('*');
        if (error) throw new Error(error.message);
        return data;
    }

    async getDoctorById(doctorId) {
        const { data, error } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
        if (error) throw new Error('Doctor not found');
        return data;
    }
}

window.doctorsService = new DoctorsService();
