import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DirectJobStatus, Role } from '@prisma/client';
import { CustomerDashboardService } from 'src/modules/dashboard/customer-dashboard.service';
import { TraderDashboardService } from 'src/modules/dashboard/trader-dashboard.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { SocketService } from 'src/socket/socket.service';
import { CancelDirectJobDto } from './dto/cancel-direct-job.dto';
import { GetDirectJobsQueryDto } from './dto/get-direct-jobs-query.dto';
import { StartDirectJobDto } from './dto/start-direct-job.dto';

@Injectable()
export class DirectJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly socketService: SocketService,
    private readonly redisService: RedisService,
    private readonly traderDashboardService: TraderDashboardService,
    private readonly customerDashboardService: CustomerDashboardService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | GET CONVERSATION DIRECT JOB (CURRENT / LATEST ACTIVE)
  |--------------------------------------------------------------------------
  */
  async getConversationDirectJob(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.customerId !== userId &&
      conversation.traderId !== userId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // First check for active job (IN_PROGRESS or AWAITING_CONFIRMATION)
    let directJob = await this.prisma.directJob.findFirst({
      where: {
        conversationId,
        status: {
          in: [
            DirectJobStatus.IN_PROGRESS,
            DirectJobStatus.AWAITING_CONFIRMATION,
          ],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        reviews: {
          where: { deletedAt: null },
          select: {
            id: true,
            rating: true,
            review: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no active job, get the most recent completed or cancelled direct job
    if (!directJob) {
      directJob = await this.prisma.directJob.findFirst({
        where: { conversationId },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          trader: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          reviews: {
            where: { deletedAt: null },
            select: {
              id: true,
              rating: true,
              review: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      success: true,
      data: directJob || null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | START DIRECT JOB (TRADER ACTION)
  |--------------------------------------------------------------------------
  */
  async startDirectJob(userId: string, dto: StartDirectJobDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true },
        },
        trader: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Only trader can start the job (as specified in the business flow)
    if (conversation.traderId !== userId) {
      throw new ForbiddenException(
        'Only the trader in this conversation can start the job',
      );
    }

    // Prevent duplicate active direct jobs
    const existingActive = await this.prisma.directJob.findFirst({
      where: {
        conversationId: dto.conversationId,
        status: {
          in: [
            DirectJobStatus.IN_PROGRESS,
            DirectJobStatus.AWAITING_CONFIRMATION,
          ],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'A job from this conversation is already active',
      );
    }

    const directJob = await this.prisma.directJob.create({
      data: {
        conversationId: dto.conversationId,
        customerId: conversation.customerId,
        traderId: conversation.traderId,
        title: dto.title?.trim() || 'Direct Job',
        description: dto.description?.trim() || null,
        agreedPrice: dto.agreedPrice !== undefined ? dto.agreedPrice : null,
        status: DirectJobStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        reviews: true,
      },
    });

    // Post an automated system message in chat
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const systemMessageText = `📋 Job started by ${conversation.trader.fullName || 'Trader'} on ${formattedDate}.`;

    const chatMsg = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        message: systemMessageText,
        attachments: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            isOnline: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    // Invalidate Redis caches
    await this.redisService
      .del(`chat:conversations:${conversation.customerId}`)
      .catch(() => {});
    await this.redisService
      .del(`chat:conversations:${conversation.traderId}`)
      .catch(() => {});

    // Notify customer
    await this.notificationService
      .createNotification(
        conversation.customerId,
        'Job In Progress',
        `${conversation.trader.fullName || 'Trader'} has started a direct job with you.`,
        'DIRECT_JOB_STARTED',
        { directJobId: directJob.id, conversationId: dto.conversationId },
      )
      .catch(() => {});

    // Real-time socket emissions
    this.socketService.emitNewMessage(dto.conversationId, {
      ...chatMsg,
      receiverId: conversation.customerId,
    });
    this.socketService.emitToRoom(
      dto.conversationId,
      'directJobUpdated',
      directJob,
    );
    this.socketService.emitToUser(
      conversation.customerId,
      'directJobUpdated',
      directJob,
    );
    this.socketService.emitToUser(
      conversation.traderId,
      'directJobUpdated',
      directJob,
    );
    this.socketService.emitToRoom('admins', 'directJobUpdated', directJob);

    return {
      success: true,
      message: 'Direct job started successfully',
      data: directJob,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE DIRECT JOB (TRADER MARKS COMPLETE)
  |--------------------------------------------------------------------------
  */
  async closeDirectJob(userId: string, id: string) {
    const directJob = await this.prisma.directJob.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        trader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!directJob) {
      throw new NotFoundException('Direct job not found');
    }

    if (directJob.traderId !== userId) {
      throw new ForbiddenException(
        'Only the assigned trader can close this job',
      );
    }

    if (directJob.status !== DirectJobStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Job cannot be closed from status: ${directJob.status}`,
      );
    }

    const updatedJob = await this.prisma.directJob.update({
      where: { id },
      data: {
        status: DirectJobStatus.AWAITING_CONFIRMATION,
        completedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        reviews: true,
      },
    });

    // Post automated message into chat
    const systemMessageText = `✅ ${directJob.trader.fullName || 'Trader'} marked this job as complete. Awaiting customer confirmation.`;
    const chatMsg = await this.prisma.message.create({
      data: {
        conversationId: directJob.conversationId,
        senderId: userId,
        message: systemMessageText,
        attachments: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            isOnline: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: directJob.conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify customer
    await this.notificationService
      .createNotification(
        directJob.customerId,
        'Job Completion Confirmation Needed',
        `${directJob.trader.fullName || 'Trader'} has marked the job as completed. Please confirm to finalize.`,
        'DIRECT_JOB_COMPLETED_AWAITING_CONFIRMATION',
        { directJobId: id, conversationId: directJob.conversationId },
      )
      .catch(() => {});

    // Socket events
    this.socketService.emitNewMessage(directJob.conversationId, {
      ...chatMsg,
      receiverId: directJob.customerId,
    });
    this.socketService.emitToRoom(
      directJob.conversationId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.customerId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.traderId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToRoom('admins', 'directJobUpdated', updatedJob);

    return {
      success: true,
      message: 'Job marked as complete, awaiting customer confirmation',
      data: updatedJob,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | REMIND CUSTOMER (TRADER ACTION)
  |--------------------------------------------------------------------------
  */
  async remindCustomer(userId: string, id: string) {
    const directJob = await this.prisma.directJob.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        trader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!directJob) {
      throw new NotFoundException('Direct job not found');
    }

    if (directJob.traderId !== userId) {
      throw new ForbiddenException('Only the trader can send a reminder');
    }

    if (directJob.status !== DirectJobStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException(
        'Reminders can only be sent while awaiting customer confirmation',
      );
    }

    // Rate-limit reminders: once every 12 hours
    if (directJob.lastReminderSentAt) {
      const hoursSinceLast =
        (Date.now() - new Date(directJob.lastReminderSentAt).getTime()) /
        (1000 * 60 * 60);
      if (hoursSinceLast < 12) {
        const remainingHours = Math.ceil(12 - hoursSinceLast);
        throw new BadRequestException(
          `A reminder was recently sent. Please wait ${remainingHours} hour(s) before sending another.`,
        );
      }
    }

    await this.prisma.directJob.update({
      where: { id },
      data: {
        lastReminderSentAt: new Date(),
      },
    });

    // Notify customer
    await this.notificationService
      .createNotification(
        directJob.customerId,
        'Reminder: Confirm Job Completion',
        `${directJob.trader.fullName || 'Trader'} is waiting for your confirmation that the job is complete.`,
        'DIRECT_JOB_CONFIRMATION_REMINDER',
        { directJobId: id, conversationId: directJob.conversationId },
      )
      .catch(() => {});

    // Post chat notice
    const reminderMsg = await this.prisma.message.create({
      data: {
        conversationId: directJob.conversationId,
        senderId: userId,
        message: `🔔 Reminder: Trader is awaiting confirmation that the job has been completed.`,
        attachments: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            isOnline: true,
          },
        },
      },
    });

    this.socketService.emitNewMessage(directJob.conversationId, {
      ...reminderMsg,
      receiverId: directJob.customerId,
    });

    return {
      success: true,
      message: 'Reminder sent to customer successfully',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM DIRECT JOB COMPLETION (CUSTOMER ACTION)
  |--------------------------------------------------------------------------
  */
  async confirmDirectJob(userId: string, id: string) {
    const directJob = await this.prisma.directJob.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        trader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!directJob) {
      throw new NotFoundException('Direct job not found');
    }

    if (directJob.customerId !== userId) {
      throw new ForbiddenException(
        'Only the customer can confirm job completion',
      );
    }

    if (
      directJob.status !== DirectJobStatus.AWAITING_CONFIRMATION &&
      directJob.status !== DirectJobStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Job cannot be confirmed from status: ${directJob.status}`,
      );
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const completed = await tx.directJob.update({
        where: { id },
        data: {
          status: DirectJobStatus.COMPLETED,
          confirmedAt: new Date(),
          completedAt: directJob.completedAt || new Date(),
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          trader: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          reviews: true,
        },
      });

      // Increment trader's completedJobs in TraderMetrics
      await tx.traderMetrics.upsert({
        where: { traderId: directJob.traderId },
        create: {
          traderId: directJob.traderId,
          completedJobs: 1,
        },
        update: {
          completedJobs: { increment: 1 },
        },
      });

      return completed;
    });

    // Post chat notice
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const chatMsg = await this.prisma.message.create({
      data: {
        conversationId: directJob.conversationId,
        senderId: userId,
        message: `🎉 Customer confirmed job completion on ${formattedDate}. You can now leave a review!`,
        attachments: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            isOnline: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: directJob.conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify trader
    await this.notificationService
      .createNotification(
        directJob.traderId,
        'Job Completion Confirmed!',
        `${directJob.customer.fullName || 'Customer'} confirmed completion of the direct job. It has been added to your completed jobs profile metric.`,
        'DIRECT_JOB_CONFIRMED',
        { directJobId: id, conversationId: directJob.conversationId },
      )
      .catch(() => {});

    // Socket events
    this.socketService.emitNewMessage(directJob.conversationId, {
      ...chatMsg,
      receiverId: directJob.traderId,
    });
    this.socketService.emitToRoom(
      directJob.conversationId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.customerId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.traderId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToRoom('admins', 'directJobUpdated', updatedJob);

    // Refresh dashboards
    this.traderDashboardService.emitDashboardUpdate(directJob.traderId);
    this.customerDashboardService.emitDashboardUpdate(directJob.customerId);

    return {
      success: true,
      message: 'Job completed and confirmed successfully',
      data: updatedJob,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL DIRECT JOB (CUSTOMER OR TRADER)
  |--------------------------------------------------------------------------
  */
  async cancelDirectJob(
    userId: string,
    id: string,
    dto: CancelDirectJobDto,
    isAdmin = false,
  ) {
    const directJob = await this.prisma.directJob.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        trader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!directJob) {
      throw new NotFoundException('Direct job not found');
    }

    if (
      !isAdmin &&
      directJob.customerId !== userId &&
      directJob.traderId !== userId
    ) {
      throw new ForbiddenException('Not authorized to cancel this job');
    }

    if (directJob.status === DirectJobStatus.COMPLETED) {
      throw new BadRequestException('A completed job cannot be cancelled');
    }

    const updatedJob = await this.prisma.directJob.update({
      where: { id },
      data: {
        status: DirectJobStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: dto.reason || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        reviews: true,
      },
    });

    const otherUserId =
      userId === directJob.customerId
        ? directJob.traderId
        : directJob.customerId;

    await this.notificationService
      .createNotification(
        otherUserId,
        'Direct Job Cancelled',
        `The direct job has been cancelled.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
        'DIRECT_JOB_CANCELLED',
        { directJobId: id, conversationId: directJob.conversationId },
      )
      .catch(() => {});

    this.socketService.emitToRoom(
      directJob.conversationId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.customerId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToUser(
      directJob.traderId,
      'directJobUpdated',
      updatedJob,
    );
    this.socketService.emitToRoom('admins', 'directJobUpdated', updatedJob);

    return {
      success: true,
      message: 'Direct job cancelled successfully',
      data: updatedJob,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GET MY DIRECT JOBS
  |--------------------------------------------------------------------------
  */
  async getMyDirectJobs(userId: string, query: GetDirectJobsQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ customerId: userId }, { traderId: userId }],
    };

    if (status) {
      where.status = status;
    }

    const [total, data] = await Promise.all([
      this.prisma.directJob.count({ where }),
      this.prisma.directJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          trader: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          reviews: {
            where: { deletedAt: null },
            select: {
              id: true,
              rating: true,
              review: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GET DIRECT JOB BY ID
  |--------------------------------------------------------------------------
  */
  async getDirectJobById(userId: string, id: string, role?: Role) {
    const directJob = await this.prisma.directJob.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            messages: {
              take: 20,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: { id: true, fullName: true, profileImage: true },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        trader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        reviews: {
          where: { deletedAt: null },
          include: {
            proofs: true,
          },
        },
      },
    });

    if (!directJob) {
      throw new NotFoundException('Direct job not found');
    }

    if (
      role !== Role.ADMIN &&
      directJob.customerId !== userId &&
      directJob.traderId !== userId
    ) {
      throw new ForbiddenException('Access denied to this direct job');
    }

    return {
      success: true,
      data: directJob,
    };
  }
}
