import axios from 'axios';

// Настройка axios для передачи cookies
axios.defaults.withCredentials = true;

// Interceptor для добавления токена в заголовки
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios;

