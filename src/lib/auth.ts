import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, data } = response.data;
      
      if (data.user.role !== 'admin') {
        return { success: false, message: 'Access denied. Admin only.' };
      }

      localStorage.setItem('dk_admin_token', token);
      localStorage.setItem('dk_admin_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('dk_admin_token');
    localStorage.removeItem('dk_admin_user');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('dk_admin_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('dk_admin_token');
        localStorage.removeItem('dk_admin_user');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getUser: () => {
    const user = localStorage.getItem('dk_admin_user');
    return user ? JSON.parse(user) : null;
  }
};
