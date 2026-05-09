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
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('dk_admin_token');
    localStorage.removeItem('dk_admin_user');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('dk_admin_token');
  },

  getUser: () => {
    const user = localStorage.getItem('dk_admin_user');
    return user ? JSON.parse(user) : null;
  }
};
