class AppointmentsService {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
    }

    async getAllAppointments() {
        const response = await fetch(`${this.apiUrl}/appointments`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        return await response.json();
    }

    async getUserAppointments(userId) {
        const response = await fetch(`${this.apiUrl}/appointments?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user appointments');
        return await response.json();
    }

    async createAppointment(appointmentData) {
        const response = await fetch(`${this.apiUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        if (!response.ok) throw new Error('Failed to create appointment');
        return await response.json();
    }

    async cancelAppointment(appointmentId) {
        const response = await fetch(`${this.apiUrl}/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to cancel appointment');
        return await response.json();
    }
}

window.appointmentsService = new AppointmentsService();
