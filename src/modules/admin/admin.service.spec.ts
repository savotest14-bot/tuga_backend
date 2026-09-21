import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/common/mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import { BadRequestException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: any;
  let redisService: any;
  let mailService: any;
  let notificationService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      contactSubmission: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      deleteByPattern: jest.fn(),
    };

    mailService = {
      sendMail: jest.fn(),
    };

    notificationService = {
      sendPushNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaService },
        { provide: MailService, useValue: mailService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeactivatedAccounts', () => {
    it('should return cached data if present in redis', async () => {
      const cachedData = { success: true, data: [{ id: '1' }] };
      redisService.get.mockResolvedValue(cachedData);

      const result = await service.getDeactivatedAccounts(1, 10, 'test@example.com');
      expect(result).toBe(cachedData);
      expect(prismaService.user.findMany).not.toHaveBeenCalled();
    });

    it('should fetch deactivated users from db, format contact submissions, and cache them', async () => {
      redisService.get.mockResolvedValue(null);
      const mockDbUsers = [
        {
          id: 'user-1',
          fullName: 'John Doe',
          email: 'john@example.com',
          status: UserStatus.INACTIVE,
          role: Role.CUSTOMER,
          contactSubmissions: [
            {
              id: 'contact-1',
              subject: 'OTHER',
              message: '[Account Reactivation Request] Please reactivate me',
              status: 'PENDING',
              createdAt: new Date(),
            },
          ],
        },
      ];
      prismaService.user.findMany.mockResolvedValue(mockDbUsers);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.getDeactivatedAccounts(1, 10, 'john@example.com', undefined, undefined, true);

      expect(result.success).toBe(true);
      expect(result.data[0].hasReactivationRequest).toBe(true);
      expect(result.data[0].latestReactivationRequest.message).toBe('Please reactivate me');
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: UserStatus.INACTIVE,
            contactSubmissions: {
              some: {
                status: 'PENDING',
              },
            },
            email: {
              contains: 'john@example.com',
              mode: 'insensitive',
            },
          }),
        }),
      );
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('reactivateAccount', () => {
    it('should throw BadRequestException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.reactivateAccount('non-existent')).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });

    it('should throw BadRequestException if account is already active', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-active',
        status: UserStatus.ACTIVE,
      });

      await expect(service.reactivateAccount('user-active')).rejects.toThrow(
        new BadRequestException('Account is already active'),
      );
    });

    it('should throw BadRequestException if account is not inactive', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-blocked',
        status: UserStatus.BLOCKED,
      });

      await expect(service.reactivateAccount('user-blocked')).rejects.toThrow(
        new BadRequestException('Only deactivated accounts can be reactivated (current status: BLOCKED)'),
      );
    });

    it('should reactivate account, resolve contact submissions, clear redis caches, and send email', async () => {
      const mockInactiveUser = {
        id: 'user-inactive',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        status: UserStatus.INACTIVE,
      };
      const mockUpdatedUser = {
        ...mockInactiveUser,
        status: UserStatus.ACTIVE,
      };

      prismaService.user.findUnique.mockResolvedValue(mockInactiveUser);
      prismaService.user.update.mockResolvedValue(mockUpdatedUser);
      redisService.del.mockResolvedValue(1);
      redisService.deleteByPattern.mockResolvedValue(1);
      mailService.sendMail.mockResolvedValue(true);

      const result = await service.reactivateAccount('user-inactive');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account reactivated successfully');
      expect(result.data).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-inactive' },
        data: { status: UserStatus.ACTIVE },
        select: expect.any(Object),
      });
      expect(prismaService.contactSubmission.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-inactive', status: 'PENDING' },
        data: { status: 'RESOLVED' },
      });
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('deactivated-accounts:*');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('contacts:admin:*');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('customers:*');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('traders:*');
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: 'Your Account Has Been Reactivated',
        }),
      );
    });
  });
});
