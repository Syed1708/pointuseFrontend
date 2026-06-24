import axios from 'axios';
import { store } from '../store';
import { setCredentials, logOut } from '../store/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true, // Crucial for reading/sending HttpOnly cookies
});

// Request Interceptor: Injects token dynamically from Redux Store
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Listens for expired tokens (403) and refreshes silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Send refresh request to retrieve a new access token
        const res = await axios.post(
          'http://localhost:5001/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;

        // Fetch full profile to keep user data updated
        const profileRes = await axios.get('http://localhost:5001/api/users/profile', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Save new state in Redux
        store.dispatch(setCredentials({ user: profileRes.data, accessToken }));

        // Retry original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired -> log out completely
        store.dispatch(logOut());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;