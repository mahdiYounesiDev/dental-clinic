const API_URL = 'http://localhost:3000';

class ServicesService {
    // Fetch all available dental services
    async getAllServices() {
        const response = await fetch(`${API_URL}/services`);
        if (!response.ok) throw new Error('Failed to fetch services');
        return await response.json();
    }

    // Fetch a single service by ID
    async getServiceById(serviceId) {
        const response = await fetch(`${API_URL}/services/${serviceId}`);
        if (!response.ok) throw new Error('Service not found');
        return await response.json();
    }

    // Fetch all services belonging to a specific doctor
    async getServicesByDoctorId(doctorId) {
        const response = await fetch(`${API_URL}/services?serviceDoctorId=${doctorId}`);
        if (!response.ok) throw new Error('Failed to fetch doctor services');
        return await response.json();
    }
}

window.servicesService = new ServicesService();
