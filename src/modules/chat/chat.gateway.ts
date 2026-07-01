import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket }
  from 'socket.io';

import { JwtService }
  from '@nestjs/jwt';

import { ChatService }
  from './chat.service';
import { RedisService } from 'src/redis/redis.service';

@WebSocketGateway({
  cors: true,
})
export class ChatGateway
  implements
  OnGatewayConnection,
  OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  /*
  |--------------------------------------------------------------------------
  | MULTI SOCKET SUPPORT
  |--------------------------------------------------------------------------
  */



  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | CONNECT
  |--------------------------------------------------------------------------
  */

  // async handleConnection(
  //   client: Socket,
  // ) {
  //   try {

  //     const token =
  //       client.handshake.auth.token;
  //     if (!token) {
  //       client.disconnect();
  //       return;
  //     }

  //     const payload =
  //       await this.jwtService.verifyAsync(
  //         token,
  //       );

  //     client.data.user = payload;

  //     await client.join(
  //       `user:${payload.id}`,
  //     );

  //     const onlineCount =
  //       await this.redisService.incr(
  //         `online:user:${payload.id}`,
  //       );

  //     if (onlineCount === 1) {

  //       await this.chatService
  //         .setUserOnline(
  //           payload.id,
  //         );

  //       const conversingUsers =
  //         await this.chatService
  //           .getConversingUsers(
  //             payload.id,
  //           );

  //       for (
  //         const otherUserId
  //         of conversingUsers
  //       ) {

  //         this.server
  //           .to(
  //             `user:${otherUserId}`,
  //           )
  //           .emit(
  //             'userOnline',
  //             {
  //               userId:
  //                 payload.id,
  //             },
  //           );
  //       }
  //     }

  //     console.log(
  //       'Socket connected',
  //       client.id,
  //     );

  //   } catch (error) {

  //     console.log(
  //       'Socket connection error',
  //       error.message,
  //     );

  //     client.disconnect();
  //   }
  // }

  async handleConnection(client: Socket) {
    try {

      const token =
        client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload =
        await this.jwtService.verifyAsync(
          token,
        );

      client.data.user = payload;

      /*
      |--------------------------------------------------------------------------
      | PERSONAL ROOM
      |--------------------------------------------------------------------------
      */

      await client.join(
        `user:${payload.id}`,
      );

      /*
      |--------------------------------------------------------------------------
      | ONLINE
      |--------------------------------------------------------------------------
      */

      const room =
        this.server.sockets.adapter.rooms.get(
          `user:${payload.id}`,
        );

      const activeSockets =
        room ? room.size : 0;

      console.log(
        `Active sockets: ${activeSockets}`,
      );

      if (activeSockets === 1) {

        await this.chatService.setUserOnline(
          payload.id,
        );

        const conversingUsers =
          await this.chatService.getConversingUsers(
            payload.id,
          );

        for (const otherUserId of conversingUsers) {

          this.server
            .to(`user:${otherUserId}`)
            .emit('userOnline', {
              userId: payload.id,
            });

        }
      }

      console.log(
        `Socket Connected: ${client.id}`,
      );

    } catch (error) {

      console.error(error);

      client.disconnect();

    }
  }
  /*
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
  */

  // async handleDisconnect(
  //   client: Socket,
  // ) {
  //   try {

  //     const user =
  //       client.data.user;

  //     if (!user) {
  //       return;
  //     }

  //     const exists =
  //       await this.redisService.exists(
  //         `online:user:${user.id}`,
  //       );

  //     if (!exists) {
  //       return;
  //     }

  //     const count =
  //       await this.redisService.decr(
  //         `online:user:${user.id}`,
  //       );

  //     if (count <= 0) {

  //       await this.redisService.del(
  //         `online:user:${user.id}`,
  //       );

  //       await this.chatService
  //         .setUserOffline(
  //           user.id,
  //         );

  //       const conversingUsers =
  //         await this.chatService
  //           .getConversingUsers(
  //             user.id,
  //           );

  //       for (const otherUserId of conversingUsers) {

  //         this.server
  //           .to(
  //             `user:${otherUserId}`,
  //           )
  //           .emit(
  //             'userOffline',
  //             {
  //               userId: user.id,
  //             },
  //           );
  //       }
  //     }

  //   } catch (error) {

  //     console.log(
  //       'Socket disconnect error',
  //       error.message,
  //     );
  //   }
  // }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user;

      if (!user) {
        return;
      }

      console.log(
        `Socket Disconnected: ${client.id} | User: ${user.id}`,
      );

      /*
      |--------------------------------------------------------------------------
      | WAIT A MOMENT
      | Gives Socket.IO time to remove the socket from all rooms.
      |--------------------------------------------------------------------------
      */

      await new Promise((resolve) =>
        setTimeout(resolve, 300),
      );

      /*
      |--------------------------------------------------------------------------
      | CHECK USER ROOM
      |--------------------------------------------------------------------------
      */

      const room =
        this.server.sockets.adapter.rooms.get(
          `user:${user.id}`,
        );

      const activeSockets =
        room ? room.size : 0;

      console.log(
        `Active sockets for ${user.id}: ${activeSockets}`,
      );

      /*
      |--------------------------------------------------------------------------
      | USER IS COMPLETELY OFFLINE
      |--------------------------------------------------------------------------
      */

      if (activeSockets === 0) {

        console.log(
          `Setting ${user.id} offline`,
        );

        await this.chatService.setUserOffline(
          user.id,
        );

        const conversingUsers =
          await this.chatService.getConversingUsers(
            user.id,
          );

        for (const otherUserId of conversingUsers) {

          this.server
            .to(`user:${otherUserId}`)
            .emit('userOffline', {
              userId: user.id,
            });

        }

        console.log(
          `Offline event sent for ${user.id}`,
        );
      }

    } catch (error) {

      console.error(
        'Socket disconnect error:',
        error,
      );

    }
  }
  /*
  |--------------------------------------------------------------------------
  | JOIN CONVERSATION
  |--------------------------------------------------------------------------
  */
  @SubscribeMessage(
    'joinConversation',
  )
  async joinConversation(
    @MessageBody()
    body: {
      conversationId: string;
    },

    @ConnectedSocket()
    client: Socket,
  ) {

    await this.chatService
      .validateConversationAccess(
        body.conversationId,
        client.data.user.id,
      );

    await client.join(
      body.conversationId,
    );

    return {
      success: true,
    };
  }
  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE EVENT
  |--------------------------------------------------------------------------
  */
  @SubscribeMessage(
    'sendMessage',
  )
  async sendMessage(
    @MessageBody()
    message: any,
  ) {

    /*
    |--------------------------------------------------------------------------
    | SEND TO ROOM
    |--------------------------------------------------------------------------
    */

    this.server
      .to(message.conversationId)
      .emit(
        'newMessage',
        message,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | TYPING
  |--------------------------------------------------------------------------
  */

  @SubscribeMessage(
    'typing',
  )
  async typing(
    @MessageBody()
    body: {
      conversationId: string;
    },

    @ConnectedSocket()
    client: Socket,
  ) {

    client.to(
      body.conversationId,
    ).emit(
      'typing',
      {
        userId:
          client.data.user.id,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STOP TYPING
  |--------------------------------------------------------------------------
  */

  @SubscribeMessage(
    'stopTyping',
  )
  async stopTyping(
    @MessageBody()
    body: {
      conversationId: string;
    },

    @ConnectedSocket()
    client: Socket,
  ) {

    client.to(
      body.conversationId,
    ).emit(
      'stopTyping',
      {
        userId:
          client.data.user.id,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | READ
  |--------------------------------------------------------------------------
  */

  @SubscribeMessage(
    'markAsRead',
  )
  async markAsRead(
    @MessageBody()
    body: {
      conversationId: string;
    },

    @ConnectedSocket()
    client: Socket,
  ) {

    await this.chatService
      .markMessagesAsRead(
        body.conversationId,
        client.data.user.id,
      );

    this.server
      .to(body.conversationId)
      .emit(
        'messagesRead',
        {
          conversationId:
            body.conversationId,

          userId:
            client.data.user.id,
        },
      );
  }
}