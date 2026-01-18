import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(): Promise<User[]> {
    const cacheKey = 'users:all';
    const cached = await this.cache.get<User[]>(cacheKey);
    if (cached) {
      console.log('Cache hit: users:all');
      return cached;
    }

    console.log('Cache miss: users:all');
    const users = await this.prisma.user.findMany();
    await this.cache.set(cacheKey, users, 60);
    return users;
  }

  async findOne(id: string): Promise<User | null> {
    const cacheKey = `users:${id}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    console.log(`Cache miss: ${cacheKey}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      await this.cache.set(cacheKey, user, 60);
    }
    return user;
  }

  async create(data: { email: string; name?: string }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    await this.cache.del('users:all');
    return user;
  }

  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({ where: { id } });
    await this.cache.del('users:all');
    await this.cache.del(`users:${id}`);
    return user;
  }
}
