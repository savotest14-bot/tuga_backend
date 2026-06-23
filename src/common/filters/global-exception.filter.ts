import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || exceptionResponse.error || exception.message;
        errorCode = exceptionResponse.errorCode || exceptionResponse.error || 'HTTP_EXCEPTION';
      } else {
        message = exceptionResponse || exception.message;
        errorCode = 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      // Prisma or general DB errors
      message = exception.message;
      errorCode = exception.constructor.name || 'UNKNOWN_ERROR';
    }

    // Standardized log output
    this.logger.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      errorCode,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
      user: request['user'] ? (request['user'] as any).id : undefined,
    });

    // Format response
    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error && {
        stack: exception.stack,
      }),
    });
  }
}
