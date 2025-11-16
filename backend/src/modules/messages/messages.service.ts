import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

@Injectable()
export class MessagesService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;

  async onModuleInit() {
    this.redisClient = createClient({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });

    this.redisClient.on('error', (err) =>
      console.error('Redis Client Error', err),
    );

    await this.redisClient.connect();
    console.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  // Kreiraj chat key za dva korisnika (sortirano da bi bilo konzistentno)
  private getChatKey(userId1: string, userId2: string): string {
    const [smaller, larger] = [userId1, userId2].sort();
    return `chat:${smaller}:${larger}`;
  }

  // Sačuvaj poruku u Redis List
  async saveMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    const message: Message = {
      id: `${Date.now()}-${senderId}`,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const chatKey = this.getChatKey(senderId, receiverId);
    await this.redisClient.lPush(chatKey, JSON.stringify(message));

    return message;
  }

  // Učitaj poruke između dva korisnika
  async getMessages(
    userId1: string,
    userId2: string,
    limit: number = 50,
  ): Promise<Message[]> {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = await this.redisClient.lRange(chatKey, 0, limit - 1);

    return messages.map((msg) => JSON.parse(msg)).reverse(); // Reverse da bi bile u hronološkom redosledu
  }

  // Označi poruke kao pročitane
  async markAsRead(userId1: string, userId2: string, currentUserId: string) {
    const chatKey = this.getChatKey(userId1, userId2);
    const messages = await this.redisClient.lRange(chatKey, 0, -1);

    const updatedMessages = messages.map((msg) => {
      const message: Message = JSON.parse(msg);
      if (message.receiverId === currentUserId && !message.read) {
        message.read = true;
      }
      return JSON.stringify(message);
    });

    // Clear old messages and push updated ones
    await this.redisClient.del(chatKey);
    if (updatedMessages.length > 0) {
      await this.redisClient.rPush(chatKey, updatedMessages);
    }
  }

  // Dobavi broj nepročitanih poruka
  async getUnreadCount(userId: string): Promise<number> {
    const keys = await this.redisClient.keys('chat:*');
    let unreadCount = 0;

    for (const key of keys) {
      if (key.includes(`:${userId}`) || key.includes(`${userId}:`)) {
        const messages = await this.redisClient.lRange(key, 0, -1);
        const parsedMessages = messages.map((msg) => JSON.parse(msg));
        unreadCount += parsedMessages.filter(
          (msg) => msg.receiverId === userId && !msg.read,
        ).length;
      }
    }

    return unreadCount;
  }

  // Dobavi broj nepročitanih poruka za specifičnog korisnika
  async getUnreadCountForUser(
    currentUserId: string,
    otherUserId: string,
  ): Promise<number> {
    const chatKey = this.getChatKey(currentUserId, otherUserId);
    const messages = await this.redisClient.lRange(chatKey, 0, -1);
    const parsedMessages = messages.map((msg) => JSON.parse(msg));

    return parsedMessages.filter(
      (msg) => msg.receiverId === currentUserId && !msg.read,
    ).length;
  }

  // Dobavi sve kontakte sa kojima je korisnik razgovarao
  async getUserContacts(userId: string): Promise<string[]> {
    const keys = await this.redisClient.keys('chat:*');
    const contacts = new Set<string>();

    for (const key of keys) {
      const parts = key.split(':');
      const user1 = parts[1];
      const user2 = parts[2];

      if (user1 === userId) {
        contacts.add(user2);
      } else if (user2 === userId) {
        contacts.add(user1);
      }
    }

    return Array.from(contacts);
  }
}
