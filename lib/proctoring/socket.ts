import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(examId: string): Socket {
  if (!socket) {
    // In production or development, connect to the window's origin
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    socket = io(origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Real-time proctoring socket connected:', socket?.id);
      socket?.emit('join-exam', examId);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Real-time proctoring socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });
  } else {
    // If socket exists, make sure to join the correct exam room
    socket.emit('join-exam', examId);
  }
  return socket;
}

export function emitViolation(socket: Socket | null, examId: string, studentId: string, type: string, details?: string, studentName?: string) {
  if (!socket) {
    console.warn("Socket is null, could not emit violation:", type);
    return;
  }
  
  const payload = {
    examId,
    studentId,
    studentName: studentName || studentId,
    type, // 'tab_switch', 'face_missing', 'multiple_faces', 'right_click', 'forbidden_keys'
    details: details || '',
    timestamp: new Date().toISOString()
  };

  console.log("Emitting proctoring violation to socket:", payload);
  socket.emit('violation', payload);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
