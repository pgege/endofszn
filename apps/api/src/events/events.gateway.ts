import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.API_CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  path: '/ws',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {}

  afterInit(server: Server) {
    const pubClient = this.redisService.getPubClient();
    const subClient = this.redisService.getSubClient();

    server.adapter(createAdapter(pubClient, subClient));
    console.log('WebSocket Gateway initialized with Redis adapter');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
    console.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left', room };
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { room: string; message: unknown },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('message', {
      from: client.id,
      message: data.message,
    });
    return { event: 'message_sent', room: data.room };
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }
}
