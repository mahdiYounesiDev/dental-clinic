import { supabase } from '../utils_js/supabaseClient.js';

class ServicesService {
    async getAllServices() {
        const { data, error } = await supabase.from('services').select('*');
        if (error) throw new Error(error.message);
        return data;
    }

    async getServiceById(serviceId) {
        const { data, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
        if (error) throw new Error('Service not found');
        return data;
    }

    async getServicesByDoctorId(doctorId) {
        const { data, error } = await supabase.from('services').select('*').eq('serviceDoctorId', doctorId);
        if (error) throw new Error(error.message);
        return data;
    }
}

// ساخت نمونه و قرار دادن روی window
window.servicesService = new ServicesService();
