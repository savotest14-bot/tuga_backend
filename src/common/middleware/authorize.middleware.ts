import {
  ForbiddenException,
  NestMiddleware,
} from '@nestjs/common';

import {
  Request,
  Response,
  NextFunction,
} from 'express';

export function AuthorizeMiddleware(
  ...roles: string[]
) {
  return class
    implements NestMiddleware
  {
    use(
      req: Request,
      res: Response,
      next: NextFunction,
    ) {
      if (!req.user) {
        throw new ForbiddenException(
          'Unauthorized',
        );
      }

      const userRole =
        req.user['role'];

      if (
        !roles.includes(userRole)
      ) {
        throw new ForbiddenException(
          'Access denied',
        );
      }

      next();
    }
  };
}