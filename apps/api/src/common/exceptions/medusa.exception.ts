import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';

export interface MedusaErrorResponse {
  type?: string;
  message?: string;
  code?: string;
}

export class MedusaException extends ApiException {
  constructor(
    public readonly medusaError: MedusaErrorResponse,
    public readonly httpStatus: number,
  ) {
    const message = medusaError.message || 'Medusa service error';
    const status = MedusaException.mapStatus(httpStatus);

    super(message, status, {
      type: medusaError.type,
      code: medusaError.code,
    });
  }

  private static mapStatus(medusaStatus: number): HttpStatus {
    switch (medusaStatus) {
      case 400:
        return HttpStatus.BAD_REQUEST;
      case 401:
        return HttpStatus.UNAUTHORIZED;
      case 403:
        return HttpStatus.FORBIDDEN;
      case 404:
        return HttpStatus.NOT_FOUND;
      case 409:
        return HttpStatus.CONFLICT;
      case 422:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 500:
        return HttpStatus.BAD_GATEWAY;
      default:
        return HttpStatus.BAD_GATEWAY;
    }
  }

  static fromResponse(status: number, error: MedusaErrorResponse) {
    return new MedusaException(error, status);
  }
}
