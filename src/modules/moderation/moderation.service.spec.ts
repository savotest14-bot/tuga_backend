import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { ContentType, ViolationCategory } from '@prisma/client';

describe('ModerationService', () => {
  let service: ModerationService;
  let mockPrisma: any;
  let mockRedis: any;

  const mockKeywords = [
    {
      id: '1',
      keyword: 'bribe',
      category: ViolationCategory.FRAUD,
      severity: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: '2',
      keyword: 'ass',
      category: ViolationCategory.ABUSE,
      severity: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: '3',
      keyword: 'cabrón',
      category: ViolationCategory.ABUSE,
      severity: 3,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: '4',
      keyword: 'foda-se',
      category: ViolationCategory.ABUSE,
      severity: 2,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockPrisma = {
      violationKeyword: {
        findMany: jest.fn().mockResolvedValue(mockKeywords),
      },
      contentFlag: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scanContent', () => {
    it('should flag content containing a violation keyword', async () => {
      const result = await service.scanContent(
        'user-1',
        'You should take this bribe today',
        ContentType.MESSAGE,
        'msg-1',
      );

      expect(result.flagged).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detectedText).toBe('bribe');
      expect(result.violations[0].reason).toBe(ViolationCategory.FRAUD);
      expect(mockPrisma.contentFlag.createMany).toHaveBeenCalledTimes(1);
    });

    it('should NOT flag innocent words containing substring of violation keywords', async () => {
      // "classic assistant" contains "ass" as substring, but is NOT the word "ass"
      const result = await service.scanContent(
        'user-1',
        'I am attending a classic painting class with my assistant',
        ContentType.MESSAGE,
        'msg-2',
      );

      expect(result.flagged).toBe(false);
      expect(result.violations).toHaveLength(0);
      expect(mockPrisma.contentFlag.createMany).not.toHaveBeenCalled();
    });

    it('should flag exact violation keyword with punctuation or boundary', async () => {
      const result = await service.scanContent(
        'user-1',
        'You are a real ass!',
        ContentType.MESSAGE,
        'msg-3',
      );

      expect(result.flagged).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detectedText).toBe('ass');
    });

    it('should match unicode accented keywords and hyphenated words', async () => {
      const result = await service.scanContent(
        'user-1',
        'Eres un cabrón y vai para foda-se',
        ContentType.REVIEW,
        'rev-1',
      );

      expect(result.flagged).toBe(true);
      expect(result.violations).toHaveLength(2);
      const detected = result.violations.map((v) => v.detectedText);
      expect(detected).toContain('cabrón');
      expect(detected).toContain('foda-se');
    });

    it('should NOT flag phone numbers, emails, or URLs (only violation keywords allowed)', async () => {
      const text =
        'Contact me at +351 912 345 678 or john.doe@gmail.com, visit https://tugatrades.com';
      const result = await service.scanContent(
        'user-1',
        text,
        ContentType.JOB,
        'job-1',
      );

      expect(result.flagged).toBe(false);
      expect(result.violations).toHaveLength(0);
      expect(mockPrisma.contentFlag.createMany).not.toHaveBeenCalled();
    });

    it('should mask violation keywords in cleanContent', async () => {
      const result = await service.scanContent(
        'user-1',
        'take this bribe now',
        ContentType.MESSAGE,
        'msg-4',
      );

      expect(result.flagged).toBe(true);
      expect(result.cleanContent).toBe('take this ***** now');
    });

    it('should handle empty or null content gracefully without error', async () => {
      const resNull = await service.scanContent(
        'user-1',
        null as any,
        ContentType.PROFILE,
      );
      expect(resNull.flagged).toBe(false);
      expect(resNull.violations).toHaveLength(0);

      const resEmpty = await service.scanContent(
        'user-1',
        '   ',
        ContentType.PROFILE,
      );
      expect(resEmpty.flagged).toBe(false);
      expect(resEmpty.violations).toHaveLength(0);
    });

    it('should deduplicate violations if the same keyword appears multiple times', async () => {
      const result = await service.scanContent(
        'user-1',
        'bribe bribe bribe',
        ContentType.MESSAGE,
        'msg-5',
      );

      expect(result.flagged).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.cleanContent).toBe('***** ***** *****');
    });
  });
});
