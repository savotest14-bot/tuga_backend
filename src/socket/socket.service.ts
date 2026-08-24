import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;
  private emittedMessageIds = new Set<string>();

  setServer(server: Server) {
    this.server = server;
  }

  getServer(): Server {
    return this.server;
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
    }
  }

  emitNewMessage(room: string, message: any) {
    if (!message || !message.id) return;
    if (this.emittedMessageIds.has(message.id)) {
      return;
    }
    this.emittedMessageIds.add(message.id);
    setTimeout(() => {
      this.emittedMessageIds.delete(message.id);
    }, 10000); // clear after 10s

    this.emitToRoom(room, 'newMessage', message);

    const receiverId = message.receiverId;
    const senderId = message.senderId;
    if (receiverId) {
      this.emitToUser(receiverId, 'newMessage', message);
    }
    if (senderId) {
      this.emitToUser(senderId, 'newMessage', message);
    }
  }
}
