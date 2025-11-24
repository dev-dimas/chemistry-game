import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let memoryHealthIndicator: MemoryHealthIndicator;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(
      MemoryHealthIndicator,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should perform health check with memory indicators', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };

      mockMemoryHealthIndicator.checkHeap.mockReturnValue({
        memory_heap: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkRSS.mockReturnValue({
        memory_rss: { status: 'up' },
      });
      mockHealthCheckService.check.mockResolvedValue(mockHealthResult);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toEqual(mockHealthResult);
    });

    it('should check heap memory with correct threshold', async () => {
      const heapThreshold = 150 * 1024 * 1024;
      mockMemoryHealthIndicator.checkHeap.mockReturnValue({
        memory_heap: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkRSS.mockReturnValue({
        memory_rss: { status: 'up' },
      });
      mockHealthCheckService.check.mockResolvedValue({ status: 'ok' });

      await controller.check();

      const checkCall = mockHealthCheckService.check.mock.calls[0][0];
      const heapCheck = checkCall[0]();

      expect(mockMemoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        heapThreshold,
      );
    });

    it('should check RSS memory with correct threshold', async () => {
      const rssThreshold = 150 * 1024 * 1024;
      mockMemoryHealthIndicator.checkHeap.mockReturnValue({
        memory_heap: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkRSS.mockReturnValue({
        memory_rss: { status: 'up' },
      });
      mockHealthCheckService.check.mockResolvedValue({ status: 'ok' });

      await controller.check();

      const checkCall = mockHealthCheckService.check.mock.calls[0][0];
      const rssCheck = checkCall[1]();

      expect(mockMemoryHealthIndicator.checkRSS).toHaveBeenCalledWith(
        'memory_rss',
        rssThreshold,
      );
    });
  });

  describe('simpleCheck', () => {
    it('should return simple health status', () => {
      const beforeUptime = process.uptime();
      const result = controller.simpleCheck();
      const afterUptime = process.uptime();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
      expect(result.uptime).toBeGreaterThanOrEqual(beforeUptime);
      expect(result.uptime).toBeLessThanOrEqual(afterUptime);
    });

    it('should return timestamp in ISO format', () => {
      const result = controller.simpleCheck();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should return uptime as a number', () => {
      const result = controller.simpleCheck();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });
  });
});
