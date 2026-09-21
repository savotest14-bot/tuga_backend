jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../common/mail/mail.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import { ModerationService } from 'src/modules/moderation/moderation.service';
import { BadRequestException } from '@nestjs/common';
import { Role, UserStatus, ContactSubject, ContactStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let mailService: any;
  let notificationService: any;
  let redisService: any;
  let moderationService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      contactSubmission: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    };

    mailService = {
      sendMail: jest.fn(),
    };

    notificationService = {
      createNotification: jest.fn(),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      deleteByPattern: jest.fn(),
    };

    moderationService = {
      moderateContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RedisService, useValue: redisService },
        { provide: ModerationService, useValue: moderationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestReactivation', () => {
    it('should throw BadRequestException if user email does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestReactivation({ email: 'unknown@example.com' }),
      ).rejects.toThrow(new BadRequestException('No account found with this email address'));
    });

    it('should throw BadRequestException if account is already ACTIVE', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'active@example.com',
        status: UserStatus.ACTIVE,
      });

      await expect(
        service.requestReactivation({ email: 'active@example.com' }),
      ).rejects.toThrow(
        new BadRequestException('This account is already active. You can log in directly.'),
      );
    });

    it('should throw BadRequestException if account is BLOCKED', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'u2',
        email: 'blocked@example.com',
        status: UserStatus.BLOCKED,
      });

      await expect(
        service.requestReactivation({ email: 'blocked@example.com' }),
      ).rejects.toThrow(
        new BadRequestException(
          'This account has been blocked by an administrator. Please contact customer support.',
        ),
      );
    });

    it('should throw BadRequestException if request was submitted recently (within 5 mins)', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'u3',
        email: 'inactive@example.com',
        status: UserStatus.INACTIVE,
      });
      prismaService.contactSubmission.findFirst.mockResolvedValue({
        id: 'recent-sub',
        createdAt: new Date(),
      });

      await expect(
        service.requestReactivation({ email: 'inactive@example.com' }),
      ).rejects.toThrow(
        new BadRequestException(
          'You have already submitted a reactivation request recently. Please wait for the administrator to review it.',
        ),
      );
    });

    it('should create contact submission, notify admins, and invalidate cache on success', async () => {
      const mockUser = {
        id: 'u-inactive',
        email: 'inactive@example.com',
        fullName: 'Inactive User',
        status: UserStatus.INACTIVE,
        role: Role.CUSTOMER,
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.contactSubmission.findFirst.mockResolvedValue(null);
      prismaService.contactSubmission.create.mockResolvedValue({ id: 'sub-123' });
      prismaService.user.findMany.mockResolvedValue([{ id: 'admin-1', email: 'admin@example.com' }]);
      notificationService.createNotification.mockResolvedValue({});
      mailService.sendMail.mockResolvedValue(true);
      redisService.deleteByPattern.mockResolvedValue(1);

      const result = await service.requestReactivation({
        email: 'inactive@example.com',
        message: 'I want to come back',
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('sub-123');
      expect(prismaService.contactSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u-inactive',
          email: 'inactive@example.com',
          subject: ContactSubject.OTHER,
          message: '[Account Reactivation Request] I want to come back',
          status: ContactStatus.PENDING,
        }),
      });
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('deactivated-accounts:*');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('contacts:admin:*');
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('Account Reactivation Request'),
        }),
      );
    });
  });
});
