import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role } from '@prisma/client';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getDeactivatedAccounts: jest.fn(),
      reactivateAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDeactivatedAccounts', () => {
    it('should call adminService.getDeactivatedAccounts with query params', async () => {
      const mockResult = {
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      adminService.getDeactivatedAccounts.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10, email: 'test@example.com', search: 'test', role: Role.CUSTOMER, hasReactivationRequest: true };
      const result = await controller.getDeactivatedAccounts(query);

      expect(result).toBe(mockResult);
      expect(adminService.getDeactivatedAccounts).toHaveBeenCalledWith(1, 10, 'test@example.com', 'test', Role.CUSTOMER, true);
    });

    it('should use default page 1 and limit 10 when not provided', async () => {
      adminService.getDeactivatedAccounts.mockResolvedValue({ success: true, data: [] });

      await controller.getDeactivatedAccounts({});

      expect(adminService.getDeactivatedAccounts).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined, undefined);
    });
  });

  describe('reactivateAccount', () => {
    it('should call adminService.reactivateAccount with userId', async () => {
      const mockResponse = {
        success: true,
        message: 'Account reactivated successfully',
      };
      adminService.reactivateAccount.mockResolvedValue(mockResponse);

      const result = await controller.reactivateAccount('test-user-id');

      expect(result).toBe(mockResponse);
      expect(adminService.reactivateAccount).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('reactivateUser (alias)', () => {
    it('should call adminService.reactivateAccount with userId', async () => {
      const mockResponse = {
        success: true,
        message: 'Account reactivated successfully',
      };
      adminService.reactivateAccount.mockResolvedValue(mockResponse);

      const result = await controller.reactivateUser('test-user-id');

      expect(result).toBe(mockResponse);
      expect(adminService.reactivateAccount).toHaveBeenCalledWith('test-user-id');
    });
  });
});
