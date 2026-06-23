import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import {
  Request,
  Response,
  NextFunction,
} from 'express';

import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class AuthMiddleware
  implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
      private prisma: PrismaService,
  ) { }

  async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authHeader =
        req.headers.authorization;
    //  console.log("authHeader", authHeader)
      if (!authHeader) {
        throw new UnauthorizedException(
          'Token missing',
        );
      }

      const token =
        authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException(
          'Invalid token',
        );
      }
// console.log("toekn", token)
      const decoded =
        await this.jwtService.verifyAsync(
          token,
          {
            secret:
              process.env.JWT_SECRET,
          },
        );
        // console.log("decoded", decoded)
      const user =
        await this.prisma.user.findUnique({
          where: {
            id: decoded.id,
          },
        });

      if (
        !user ||
        user.token !== token
      ) {
        throw new UnauthorizedException(
          'Session expired',
        );
      }

      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid or expired token or token is missing',
      );
    }
  }
}