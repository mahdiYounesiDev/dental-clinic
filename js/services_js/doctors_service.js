class DoctorsService {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
    }

    // Fetch all registered doctors
    async getAllDoctors() {
        const response = await fetch(`${this.apiUrl}/doctors`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        return await response.json();
    }

    // Fetch single doctor details by ID
    async getDoctorById(doctorId) {
        const response = await fetch(`${this.apiUrl}/doctors/${doctorId}`);
        if (!response.ok) throw new Error('Doctor not found');
        return await response.json();
    }
}

window.doctorsService = new DoctorsService();
