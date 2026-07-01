import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  withCredentials: true,
  autoConnect: false, // 🛑 Off by default, connected manually after login!
});

export default socket;