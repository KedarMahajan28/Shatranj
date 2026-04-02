import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});


api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      
      if (original.url?.includes('/users/me')) {
        return Promise.reject(err);
      }

      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/users/refresh-access-token`,
          {},
          { withCredentials: true }
        );

        return api(original);
      } catch {
        
        if (!original.url?.includes('/users')) {
          window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;

// Auth 
export const register = (data) => api.post('/users/register', data);
export const login    = (data) => api.post('/users/login', data);
export const logout   = ()     => api.post('/users/logout');
export const getMe    = ()     => api.get('/users/me');

// Games
export const createGame   = (initialFEN) => api.post('/games/create', { initialFEN });
export const joinGame     = (gameId)     => api.post(`/games/${gameId}/join`);
export const getGame      = (gameId)     => api.get(`/games/${gameId}`);
export const resignGame   = (gameId)     => api.post(`/games/${gameId}/resign`);
export const finishGame   = (gameId, data) => api.post(`/games/${gameId}/finish`, data);
export const spectateGame = (gameId)     => api.post(`/games/${gameId}/spectate`);

// Ratings
export const getMyRatings   = () => api.get('/rating/me');
export const getGameRatings = (gameId) => api.get(`/rating/game/${gameId}`);