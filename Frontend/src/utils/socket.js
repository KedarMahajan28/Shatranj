import { io } from 'socket.io-client';

let socket = null;


export function getSocket() {
  if (!socket) {
    socket = io('/', {            
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
