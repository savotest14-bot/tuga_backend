import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { TraderMatchingService } from './trader-matching.service';

@Processor('matching')
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(private readonly matchingService: TraderMatchingService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId } = job.data;
    
    this.logger.log(`Processing trader matching job ${job.id} for jobId ${jobId}`);
    
    try {
      const results = await this.matchingService.matchAndSendJob(jobId);
      this.logger.log(`Completed matching for job ${jobId}. Scored traders matched count: ${results?.length || 0}`);
      return { matchedCount: results?.length || 0 };
    } catch (error) {
      this.logger.error(`Matching failed for job ${jobId}: ${error.message}`);
      throw error;
    }
  }
}
