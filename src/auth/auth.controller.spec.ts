jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      requestReactivation: jest.fn(),
      deactivateAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestReactivation', () => {
    it('should call authService.requestReactivation with dto', async () => {
      const dto = { email: 'user@example.com', message: 'Please reactivate my account' };
      const mockResult = { success: true, message: 'Request submitted' };
      authService.requestReactivation.mockResolvedValue(mockResult);

      const result = await controller.requestReactivation(dto);

      expect(result).toBe(mockResult);
      expect(authService.requestReactivation).toHaveBeenCalledWith(dto);
    });
  });
});
