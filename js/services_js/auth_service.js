const API_URL = 'http://localhost:3000';

class AuthService {
    async checkEmailExists(email) {
        const response = await fetch(`${API_URL}/users?userEmail=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('خطا در برقراری ارتباط با سرور');
        const users = await response.json();
        return users.length > 0;
    }

    // new signup
    async registerUser(userData) {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('خطا در ذخیره اطلاعات کاربر');
        return await response.json();
    }

    // get user
    async getUserByEmail(email) {
        const response = await fetch(`${API_URL}/users?userEmail=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('خطا در برقراری ارتباط با سرور');
        const users = await response.json();
        return users.length > 0 ? users[0] : null;
    }
}

window.authService = new AuthService();
