import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { ApiException, MedusaException } from '../common';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthResult {
  token: string;
  user: Customer;
}

@Injectable()
export class CustomerService {
  constructor(private readonly medusaService: MedusaService) {}

  async register(dto: RegisterCustomerDto): Promise<AuthResult> {
    let token: string;

    try {
      const result = await this.medusaService.authRegister(
        dto.email,
        dto.password,
      );
      token = result.token;
    } catch (error) {
      if (
        error instanceof MedusaException &&
        error.message === 'Identity with email already exists'
      ) {
        try {
          const loginResult = await this.medusaService.authLogin(
            dto.email,
            dto.password,
          );
          token = loginResult.token;
        } catch {
          throw ApiException.conflict(
            'An account with this email already exists',
          );
        }
      } else if (error instanceof MedusaException) {
        throw error;
      } else {
        throw ApiException.badRequest('Registration failed');
      }
    }

    try {
      const { customer } = await this.medusaService.createCustomer(token, {
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
      });

      return {
        token,
        user: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
        },
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to create customer');
    }
  }

  async login(dto: LoginCustomerDto): Promise<AuthResult> {
    let token: string;

    try {
      const result = await this.medusaService.authLogin(dto.email, dto.password);
      token = result.token;
    } catch {
      throw ApiException.unauthorized('Invalid email or password');
    }

    try {
      const { customer } = await this.medusaService.getCustomer(token);

      return {
        token,
        user: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
        },
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to retrieve customer profile');
    }
  }

  async getMe(token: string): Promise<Customer> {
    try {
      const { customer } = await this.medusaService.getCustomer(token);

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      };
    } catch {
      throw ApiException.unauthorized('Invalid or expired session');
    }
  }
}
