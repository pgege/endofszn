import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(): Promise<User[]> {
    const cacheKey = 'users:all';
    const cached = await this.redis.get<User[]>(cacheKey);
    if (cached) {
      console.log('Cache hit: users:all');
      return cached;
    }

    console.log('Cache miss: users:all');
    const users = await this.prisma.user.findMany();
    await this.redis.set(cacheKey, users, 60);
    return users;
  }

  async findOne(id: string): Promise<User | null> {
    const cacheKey = `users:${id}`;
    const cached = await this.redis.get<User>(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    console.log(`Cache miss: ${cacheKey}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      await this.redis.set(cacheKey, user, 60);
    }
    return user;
  }

  async create(data: { email: string; name?: string }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    await this.redis.del('users:all');
    return user;
  }

  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({ where: { id } });
    await this.redis.del('users:all');
    await this.redis.del(`users:${id}`);
    return user;
  }
}
