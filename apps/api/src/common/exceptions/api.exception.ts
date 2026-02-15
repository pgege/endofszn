import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
}

export class ApiException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode,
        message,
        error: HttpStatus[statusCode] || 'Error',
        details,
      },
      statusCode,
    );
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiException(message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiException(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiException(message, HttpStatus.FORBIDDEN);
  }

  static notFound(message = 'Not found', details?: Record<string, unknown>) {
    return new ApiException(message, HttpStatus.NOT_FOUND, details);
  }

  static conflict(message: string, details?: Record<string, unknown>) {
    return new ApiException(message, HttpStatus.CONFLICT, details);
  }

  static internal(message = 'Internal server error', details?: Record<string, unknown>) {
    return new ApiException(message, HttpStatus.INTERNAL_SERVER_ERROR, details);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiException(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
