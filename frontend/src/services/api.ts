import axios, { AxiosError } from 'axios';
import { logger } from './logger';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000, // timeout após 10 segundos
});

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Erro do servidor com resposta
      const errorData = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      };

      switch (error.response.status) {
        case 401:
          // Token inválido ou expirado
          localStorage.removeItem('@ContaCerta:token');
          localStorage.removeItem('@ContaCerta:user');
          logger.warn('Sessão expirada. Redirecionando para login...', errorData);
          window.location.href = '/login';
          break;
        case 403:
          // Acesso negado
          logger.error('Acesso negado. Você não tem permissão para acessar este recurso.', errorData);
          break;
        case 404:
          // Recurso não encontrado
          logger.warn('Recurso não encontrado.', errorData);
          break;
        case 500:
          // Erro interno do servidor
          logger.error('Erro interno do servidor. Tente novamente mais tarde.', errorData);
          break;
        default:
          logger.error('Ocorreu um erro na requisição.', errorData);
      }
    } else if (error.request) {
      // Erro de conexão
      logger.error('Erro de conexão. Verifique sua internet.', { request: error.request });
    } else {
      // Erro na configuração da requisição
      logger.error('Erro ao configurar a requisição.', { error: error.message });
    }
    return Promise.reject(error);
  }
);

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@ContaCerta:token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('Token adicionado à requisição', { url: config.url });
    }
    return config;
  },
  (error) => {
    logger.error('Erro ao preparar requisição', { error: error.message });
    return Promise.reject(error);
  }
);

export default api;
