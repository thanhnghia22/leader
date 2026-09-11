import axios from 'axios';

// Cấu hình Axios instance mặc định trỏ về /api (tự động đồng bộ cổng 3000 hoặc 5000)
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor đính kèm Token khi có xác thực JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm Interceptor xử lý lỗi chung (401 Hết phiên đăng nhập, ...)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // Tránh redirect vòng lặp nếu đang ở /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
