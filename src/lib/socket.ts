import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { useAuthStore } from '@/store/auth-store';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.io server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
