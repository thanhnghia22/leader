import api from './api';

// Biến cờ sử dụng Backend hay Mock (đã kết nối Backend MySQL Server 8.0)
export const USE_REAL_API = true;

export const authService = {
  async login(username, password) {
    if (USE_REAL_API) {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      }
      return res.data;
    }

    // Giả lập xử lý đăng nhập Leader
    await new Promise((resolve) => setTimeout(resolve, 500)); // Giả lập độ trễ mạng
    if (!username || !password) {
      throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
    }

    // Mặc định tài khoản leader/admin hoặc bất kỳ ai nhập đúng
    if ((username === 'leader' && password === '123456') || (username === 'admin' && password === 'admin123')) {
      const user = {
        id: 1,
        username,
        name: username === 'leader' ? 'Hòa Không Móc' : 'Quản Trị Viên',
        role: 'leader',
      };
      const token = 'mock_jwt_token_leader_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user, token };
    } else {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác (Thử: leader / 123456)');
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};

export default authService;
