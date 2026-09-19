import { supabase } from '../utils_js/supabaseClient.js';

class AuthService {
    /**
     * Register user in Supabase Auth, then explicitly insert their profile.
     */
    async registerUser({ email, password, name, family, age, phone, gender }) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            throw new Error('Auth Error: ' + authError.message);
        }

        const user = authData?.user;
        if (!user) {
            throw new Error('User creation failed. No user object returned.');
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: user.email,
                name: name,
                family: family,
                age: age,
                phone: phone,
                gender: gender,
                role: 'user'
            }]);

        if (profileError) {
            throw new Error('Profile Error: ' + profileError.message);
        }

        return user;
    }

    /**
     * Authenticate an existing user and fetch their profile data
     */
    async loginUser(email, password) {
        // 1. Sign in with Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            throw new Error(authError.message);
        }

        const user = authData.user;

        // 2. Fetch user details from the profiles table
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileData && !profileError) {
            user.profile = profileData;
        }

        return user;
    }

    /**
     * Get active session user
     */
    async getCurrentSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) return null;
        return session.user;
    }

    /**
     * Terminate user session
     */
    async logoutUser() {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('currentUser');
        if (error) {
            throw new Error(error.message);
        }
    }
}

window.authService = new AuthService();
export const authService = window.authService;
