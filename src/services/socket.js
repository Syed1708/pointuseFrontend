import { io } from 'socket.io-client';
const API_URL = import.meta.env.VITE_API_URL;

const socket = io(`${API_URL}`, {
  withCredentials: true,
  autoConnect: false, // 🛑 Off by default, connected manually after login!
});

export default socket;