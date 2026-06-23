import { Test, TestingModule } from '@nestjs/testing';
import { TraderMatchingService } from './trader-matching.service';

describe('TraderMatchingService', () => {
  let service: TraderMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TraderMatchingService],
    }).compile();

    service = module.get<TraderMatchingService>(TraderMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
