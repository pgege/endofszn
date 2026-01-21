import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import {
  AuthToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  ApiException,
} from '../common';

@Controller('api')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('customers/register')
  async register(
    @Body() dto: RegisterCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.customerService.register(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { user };
  }

  @Post('auth/login')
  async login(
    @Body() dto: LoginCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.customerService.login(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { user };
  }

  @Get('auth/me')
  async me(@AuthToken() token: string | undefined) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const user = await this.customerService.getMe(token);
    return { user };
  }

  @Post('auth/logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { success: true };
  }
}
