import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',  // Adicionado /api de volta à URL base
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@ContaCerta:token');
      localStorage.removeItem('@ContaCerta:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Adiciona o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@ContaCerta:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
