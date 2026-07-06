import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

import { CustomerRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import { Role } from '@prisma/client';
import { MailService } from '../common/mail/mail.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TraderRegisterStep1Dto } from './dto/trader-register-step1.dto';
import { TraderRegisterStep2Dto } from './dto/trader-register-step2.dto';
import { TraderRegisterStep3Dto } from './dto/trader-register-step3.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { NotificationService } from 'src/modules/notification/notification.service';
import { Prisma, ContentType } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';
import { ModerationService } from 'src/modules/moderation/moderation.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
        private notificationService: NotificationService,
        private redisService: RedisService,
        private readonly moderationService: ModerationService,
    ) { }

    async customerRegister(
        data: CustomerRegisterDto,
    ) {

        // Password Match Check
        if (
            data.password !==
            data.confirmPassword
        ) {
            throw new BadRequestException(
                'Passwords do not match',
            );
        }

        const existingUser =
            await this.prisma.user.findUnique({
                where: {
                    email: data.email,
                },
            });

        if (existingUser) {
            throw new BadRequestException(
                'Email already exists',
            );
        }

        const hashedPassword =
            await bcrypt.hash(data.password, 10);

        const user =
            await this.prisma.user.create({
                data: {
                    fullName: data.fullName,

                    email: data.email,

                    password: hashedPassword,

                    role: Role.CUSTOMER,

                    status: 'ACTIVE',

                    acceptedTerms:
                        data.isCheckedTermsCondition,

                    latitude: data.latitude,

                    longitude: data.longitude,
                },
            });

        const accessToken =
            await this.jwtService.signAsync({
                id: user.id,
                email: user.email,
                role: user.role,
            });

        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                token: accessToken,
            },
        });
        return {
            message:
                'Customer registered successfully',

            accessToken,

            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }

    async traderRegisterStep1(
        data: TraderRegisterStep1Dto,
    ) {

        // Password Check

        if (
            data.password !==
            data.confirmPassword
        ) {
            throw new BadRequestException(
                'Passwords do not match',
            );
        }

        // Existing User Check

        const existingUser =
            await this.prisma.user.findFirst({
                where: {
                    OR: [
                        {
                            email: data.email,
                        },

                        {
                            phone:
                                data.contactNumber,
                        },
                    ],
                },
            });

        if (existingUser) {

            if (
                existingUser.email ===
                data.email
            ) {
                throw new BadRequestException(
                    'Email already exists',
                );
            }

            if (
                existingUser.phone ===
                data.contactNumber
            ) {
                throw new BadRequestException(
                    'Phone number already exists',
                );
            }
        }

        // Hash Password

        const hashedPassword =
            await bcrypt.hash(data.password, 10);
        
            // Create User

        const user =
            await this.prisma.user.create({
                data: {
                    fullName: data.fullName,

                    email: data.email,

                    phone:
                        data.contactNumber,

                    password: hashedPassword,

                    role: Role.TRADER,

                    status: 'PENDING',


                    // Coordinates

                    latitude:
                        data.latitude,

                    longitude:
                        data.longitude,

                    acceptedTerms:
                        data.isCheckedTermsCondition,

                    traderProfile: {
                        create: {
                            tradeCategories:
                                data.tradeCategories || [],

                            workRadius:
                                data.workRadius,

                            registrationStep: 1,
                        },
                    },
                },

                include: {
                    traderProfile: true,
                },
            });

        // JWT Token

        const accessToken =
            await this.jwtService.signAsync({
                id: user.id,
                email: user.email,
                role: user.role,
            });
        await this.prisma.user.update({
            where: {
                id: user.id,
            },

            data: {
                token: accessToken,
            },
        });

        return {
            message:
                'Step 1 completed',

            accessToken,

            registrationStep:
                user.traderProfile
                    ?.registrationStep,
        };
    }
    async traderRegisterStep2(
        userId: string,

        data: TraderRegisterStep2Dto,

        files: {
            logo?: Express.Multer.File[];

            document?: Express.Multer.File[];
        },
    ) {

        const trader =
            await this.prisma.traderProfile.findUnique({
                where: {
                    userId,
                },
            });

        if (!trader) {
            throw new BadRequestException(
                'Trader profile not found',
            );
        }

        // Uploaded Files

        const logo =
            files?.logo?.[0]
                ? `/uploads/traders/${files.logo[0].filename}`
                : null;

        const document =
            files?.document?.[0]
                ? `/uploads/traders/${files.document[0].filename}`
                : null;

        await this.prisma.traderProfile.update({
            where: {
                userId,
            },

            data: {
                companyName:
                    data.companyName,

                companyType:
                    data.companyType,

                registrationNumber:
                    data.registrationNumber,

                skillsServices:
                    data.skillServiceIds || [],

                subCategories:
                    data.subCategoryIds || [],

                about:
                    data.about,

                location:
                    data.location,

                logo,

                document,

                minimumExperience:
                    data.minimumExperience,

                authorisedBusiness:
                    data.authorisedBusiness,

                understandVettingPolicy:
                    data.understandVettingPolicy,

                acceptedPrivacyPolicy:
                    data.acceptedPrivacyPolicy,

                acceptedTermsConditions: data.acceptedTermsConditions,

                registrationStep: 2,
            },
        });

        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN', },
            select: { id: true, },
        });
        for (const admin of admins) {
            await this.notificationService.createNotification(
                admin.id,
                'Trader Verification Required',
                'A trader completed registration and requires verification before payment.',
                'TRADER_VERIFICATION',
                { traderId: userId, companyName: data.companyName, },
            );
        }

        // redis cache cleanup

        await Promise.all([
            this.redisService.del(
                `admin:user-details:${userId}`,
            ),

            this.redisService.del(
                `profile:${userId}`,
            ),

            this.redisService.del(
                `registration-status:${userId}`,
            ),

            this.redisService.deleteByPattern(
                'traders:*',
            ),
        ]);

        return {
            message:
                'Step 2 completed',

            registrationStep: 2,
        };
    }
    async traderRegisterStep3(
        userId: string,

        data: TraderRegisterStep3Dto,
    ) {
        /*
        |--------------------------------------------------------------------------
        | FIND TRADER
        |--------------------------------------------------------------------------
        */

        const trader =
            await this.prisma.traderProfile.findUnique({
                where: {
                    userId,
                },

                include: {
                    subscription: true,
                },
            });

        if (!trader) {
            throw new BadRequestException(
                'Trader profile not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFICATION CHECK
        |--------------------------------------------------------------------------
        */

        if (
            trader.verificationStatus !==
            'APPROVED'
        ) {
            throw new BadRequestException(
                'Your account verification is pending',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE SUBSCRIPTION
        |--------------------------------------------------------------------------
        */

        if (trader.subscription) {
            throw new BadRequestException(
                'Subscription already exists',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FIND PLAN
        |--------------------------------------------------------------------------
        */
        const plan =
            await this.prisma.subscriptionPlan.findUnique({
                where: {
                    id: data.planId,
                },
            });

        if (!plan) {
            throw new BadRequestException(
                'Subscription plan not found',
            );
        }
        /*
        |--------------------------------------------------------------------------
        | FIND PRICE
        |--------------------------------------------------------------------------
        */
        const price =
            await this.prisma.subscriptionPrice.findUnique({
                where: {
                    id: data.priceId,
                },
            });

        if (!price) {
            throw new BadRequestException(
                'Subscription price not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE PRICE BELONGS TO PLAN
        |--------------------------------------------------------------------------
        */

        if (price.planId !== plan.id) {
            throw new BadRequestException(
                'Invalid price selected for this plan',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DATES
        |--------------------------------------------------------------------------
        */

        const now = new Date();

        /*
        |--------------------------------------------------------------------------
        | DEFAULT VALUES
        |--------------------------------------------------------------------------
        */

        let isTrial = false;

        let subscriptionStatus: any =
            'ACTIVE';

        let trialStartDate: Date | null =
            null;

        let trialEndDate: Date | null =
            null;

        /*
        |--------------------------------------------------------------------------
        | SUBSCRIPTION START DATE
        |--------------------------------------------------------------------------
        | Default = immediate start
        |--------------------------------------------------------------------------
        */

        let subscriptionStartDate =
            new Date(now);

        /*
        |--------------------------------------------------------------------------
        | TRIAL ENABLED
        |--------------------------------------------------------------------------
        */

        if (
            plan.trialEnabled &&
            plan.trialDays > 0
        ) {
            isTrial = true;

            subscriptionStatus =
                'TRIAL';

            /*
            |--------------------------------------------------------------------------
            | TRIAL START DATE
            |--------------------------------------------------------------------------
            */

            trialStartDate =
                new Date(now);

            /*
            |--------------------------------------------------------------------------
            | TRIAL END DATE
            |--------------------------------------------------------------------------
            */

            trialEndDate =
                new Date(now);

            trialEndDate.setDate(
                trialEndDate.getDate() +
                plan.trialDays,
            );

            /*
            |--------------------------------------------------------------------------
            | SUBSCRIPTION STARTS AFTER TRIAL
            |--------------------------------------------------------------------------
            */

            subscriptionStartDate =
                new Date(trialEndDate);
        }

        /*
        |--------------------------------------------------------------------------
        | SUBSCRIPTION END DATE
        |--------------------------------------------------------------------------
        */

        const subscriptionEndDate =
            new Date(subscriptionStartDate);

        /*
        |--------------------------------------------------------------------------
        | MONTHLY PLAN
        |--------------------------------------------------------------------------
        */

        if (
            price.billingCycle ===
            'MONTHLY'
        ) {
            subscriptionEndDate.setMonth(
                subscriptionEndDate.getMonth() +
                1,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | YEARLY PLAN
        |--------------------------------------------------------------------------
        */

        if (
            price.billingCycle ===
            'YEARLY'
        ) {
            subscriptionEndDate.setFullYear(
                subscriptionEndDate.getFullYear() +
                1,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE SUBSCRIPTION
        |--------------------------------------------------------------------------
        */

        const subscription =
            await this.prisma.subscription.create({
                data: {
                    traderProfileId:
                        trader.id,

                    planId:
                        plan.id,

                    priceId:
                        price.id,

                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */

                    status:
                        subscriptionStatus,

                    /*
                    |--------------------------------------------------------------------------
                    | TRIAL
                    |--------------------------------------------------------------------------
                    */

                    isTrial:
                        isTrial,

                    trialStartDate:
                        trialStartDate,

                    trialEndDate:
                        trialEndDate,

                    /*
                    |--------------------------------------------------------------------------
                    | SUBSCRIPTION DATES
                    |--------------------------------------------------------------------------
                    */

                    startDate:
                        subscriptionStartDate,

                    endDate:
                        subscriptionEndDate,
                },
            });

        /*
        |--------------------------------------------------------------------------
        | CREATE PAYMENT
        |--------------------------------------------------------------------------
        */

        await this.prisma.subscriptionPayment.create({
            data: {
                subscriptionId:
                    subscription.id,

                amount:
                    price.amount,

                currency:
                    price.currency,

                status: 'SUCCESS',

                paymentProvider:
                    'STRIPE',

                transactionId:
                    `txn_${Date.now()}`,

                paidAt:
                    now,
            },
        });

        /*
        |--------------------------------------------------------------------------
        | UPDATE TRADER PROFILE
        |--------------------------------------------------------------------------
        */

        await this.prisma.traderProfile.update({
            where: {
                userId,
            },

            data: {
                subscriptionTier:
                    plan.name,

                /*
                |--------------------------------------------------------------------------
                | SUBSCRIPTION STATUS
                |--------------------------------------------------------------------------
                */

                subscriptionStatus:
                    subscriptionStatus,

                /*
                |--------------------------------------------------------------------------
                | SUBSCRIPTION DATES
                |--------------------------------------------------------------------------
                */

                subscriptionStartDate:
                    subscriptionStartDate,

                subscriptionEndDate:
                    subscriptionEndDate,

                trialEndsAt:
                    trialEndDate,

                /*
                |--------------------------------------------------------------------------
                | REGISTRATION
                |--------------------------------------------------------------------------
                */

                registrationStep: 3,

                isRegistrationCompleted:
                    true,
            },
        });


        const admins = await this.prisma.user.findMany(
            {
                where: { role: 'ADMIN', },
                select: { id: true, },
            }
        );
        for (const admin of admins) {
            await this.notificationService.createNotification(
                admin.id,
                'Trader Subscription Payment Completed',
                `${trader.companyName} completed subscription payment successfully.`,
                'TRADER_PAYMENT_COMPLETED',
                { traderId: userId, traderProfileId: trader.id, subscriptionId: subscription.id, paymentAmount: price.amount, currency: price.currency, planId: plan.id, planName: plan.name, billingCycle: price.billingCycle, },
            );
        }

        await this.prisma.traderMetrics.create({ data: { traderId: userId, }, });
        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        await Promise.all([
            this.redisService.del(
                `admin:user-details:${userId}`,
            ),

            this.redisService.del(
                `profile:${userId}`,
            ),

            this.redisService.del(
                `registration-status:${userId}`,
            ),

            this.redisService.deleteByPattern(
                'traders:*',
            ),
        ]);

        return {
            success: true,

            message:
                'Trader registration completed successfully',

            registrationStep: 3,

            isRegistrationCompleted:
                true,

            /*
            |--------------------------------------------------------------------------
            | TRIAL INFO
            |--------------------------------------------------------------------------
            */

            isTrial,

            trialStartDate,

            trialEndDate,

            /*
            |--------------------------------------------------------------------------
            | SUBSCRIPTION INFO
            |--------------------------------------------------------------------------
            */

            subscriptionStartDate,

            subscriptionEndDate,

            subscription,
        };
    }
    async registrationStatus(
        userId: string,
    ) {
        const cacheKey =
            `registration-status:${userId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }
        // Trader

        const trader =
            await this.prisma.traderProfile.findUnique({
                where: {
                    userId,
                },

                select: {

                    // Step 1
                    tradeCategories: true,
                    workRadius: true,

                    // Step 2
                    companyName: true,
                    companyType: true,
                    registrationNumber: true,
                    skillsServices: true,
                    subCategories: true,
                    about: true,
                    location: true,
                    logo: true,
                    document: true,

                    // Step 3
                    subscriptionTier: true,

                    // NEW
                    verificationStatus: true,
                    rejectReason: true,

                    registrationStep: true,

                    isRegistrationCompleted:
                        true,
                },
            });

        if (!trader) {
            throw new BadRequestException(
                'Trader profile not found',
            );
        }

        // Selected Categories

        const categories =
            await this.prisma.category.findMany({
                where: {
                    id: {
                        in:
                            trader.tradeCategories || [],
                    },
                },

                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            });

        // Selected Skill Services

        const skills =
            await this.prisma.skillService.findMany({
                where: {
                    id: {
                        in:
                            trader.skillsServices || [],
                    },
                },

                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            });

        // Selected Sub Categories

        const subCategories =
            await this.prisma.subCategory.findMany({
                where: {
                    id: {
                        in:
                            trader.subCategories || [],
                    },
                },

                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            });

        // STEP 1 CHECK

        const step1Completed =
            !!(
                trader.tradeCategories?.length &&
                trader.workRadius
            );

        // STEP 2 REQUIRED FIELDS

        const step2Fields = {

            companyName:
                !!trader.companyName,

            companyType:
                !!trader.companyType,

            registrationNumber:
                !!trader.registrationNumber,

            skillsServices:
                !!trader.skillsServices?.length,

            subCategories:
                !!trader.subCategories?.length,

            about:
                !!trader.about,

            location:
                !!trader.location,

            logo:
                !!trader.logo,

            document:
                !!trader.document,
        };

        // Pending Step 2 Fields

        const pendingStep2Fields =
            Object.keys(step2Fields).filter(
                key => !step2Fields[key],
            );

        // STEP 2 COMPLETED

        const step2Completed =
            pendingStep2Fields.length === 0;

        // STEP 3 COMPLETED

        const step3Completed =
            !!trader.subscriptionTier;

        // CURRENT STEP

        let currentStep = 1;

        if (
            step1Completed &&
            !step2Completed
        ) {
            currentStep = 2;
        }

        if (
            step1Completed &&
            step2Completed &&
            !step3Completed
        ) {
            currentStep = 3;
        }

        if (
            step1Completed &&
            step2Completed &&
            step3Completed
        ) {
            currentStep = 3;
        }

        // COMPLETED STEPS

        const completedSteps = [
            step1Completed,
            step2Completed,
            step3Completed,
        ].filter(Boolean).length;

        // COMPLETED %

        const completedPercentage =
            Math.round(
                (completedSteps / 3) * 100,
            );

        // NEW

        const canAccessDashboard =
            trader.verificationStatus ===
            'APPROVED' &&
            trader.isRegistrationCompleted;

        const result = {

            currentStep,

            completedSteps,

            completedPercentage,

            isRegistrationCompleted:
                trader.isRegistrationCompleted,

            step1Completed,

            step2Completed,

            step3Completed,

            // NEW

            verificationStatus:
                trader.verificationStatus,

            rejectReason: trader.rejectReason,

            // NEW

            canAccessDashboard,

            pendingStep2Fields,

            // Selected Data

            selectedCategories:
                categories,

            selectedSkillServices:
                skills,

            selectedSubCategories:
                subCategories,

            // Existing Data

            traderData: {

                workRadius:
                    trader.workRadius,

                companyName:
                    trader.companyName,

                companyType:
                    trader.companyType,

                registrationNumber:
                    trader.registrationNumber,

                about:
                    trader.about,

                location:
                    trader.location,

                logo:
                    trader.logo,

                document:
                    trader.document,

                subscriptionTier:
                    trader.subscriptionTier,
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 minutes
        );

        return result;
    }

    async login(data: LoginDto) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    email: data.email,
                },
            });

        if (!user) {
            throw new UnauthorizedException(
                'Invalid credentials',
            );
        }

        if (user.status === 'BLOCKED') {
            throw new UnauthorizedException(
                'Account blocked',
            );
        }

        const isPasswordValid =
            await bcrypt.compare(
                data.password,
                user.password,
            );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Invalid credentials',
            );
        }

        const accessToken =
            await this.jwtService.signAsync({
                id: user.id,
                email: user.email,
                role: user.role,
            });

        await this.prisma.user.update({
            where: {
                id: user.id,
            },

            data: {
                token: accessToken,
            },
        });

        return {
            message: 'Login successful',

            accessToken,

            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }

    async logout(
        userId: string,
    ) {

        await this.prisma.user.update({
            where: {
                id: userId,
            },

            data: {
                token: null,
            },
        });

        return {
            message:
                'Logout successful',
        };
    }

    async forgotPassword(email: string) {
        const user =
            await this.prisma.user.findUnique({
                where: { email },
            });

        if (!user) {
            throw new BadRequestException(
                'Email not registered',
            );
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000,
        ).toString();

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000,
        );

        await this.prisma.passwordResetOtp.create({
            data: {
                userId: user.id,
                email,
                otp,
                expiresAt,
            },
        });

        await this.mailService.sendForgotPasswordOtp(
            email,
            otp,
        );

        return {
            Otp: otp,
            message: 'OTP sent successfully',
        };
    }

    async resendForgotOtp(
        email: string,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: { email },
            });

        if (!user) {
            throw new BadRequestException(
                'Email not registered',
            );
        }

        // Optional: invalidate previous OTPs
        await this.prisma.passwordResetOtp.updateMany({
            where: {
                email,
                isVerified: false,
            },

            data: {
                expiresAt: new Date(),
            },
        });

        const otp = Math.floor(
            100000 + Math.random() * 900000,
        ).toString();

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000,
        );

        await this.prisma.passwordResetOtp.create({
            data: {
                userId: user.id,
                email,
                otp,
                expiresAt,
            },
        });

        await this.mailService.sendForgotPasswordOtp(
            email,
            otp,
        );

        return {
            Otp: otp,
            message:
                'OTP resent successfully',
        };
    }

    async verifyForgotOtp(
        email: string,
        otp: string,
    ) {
        const otpRecord =
            await this.prisma.passwordResetOtp.findFirst({
                where: {
                    email,
                    otp,
                    isVerified: false,
                },

                orderBy: {
                    createdAt: 'desc',
                },
            });

        if (!otpRecord) {
            throw new BadRequestException(
                'Invalid OTP',
            );
        }

        if (
            new Date() > otpRecord.expiresAt
        ) {
            throw new BadRequestException(
                'OTP expired',
            );
        }

        const resetToken = uuidv4();

        const tokenExpiry = new Date(
            Date.now() + 10 * 60 * 1000,
        );

        await this.prisma.passwordResetOtp.update({
            where: {
                id: otpRecord.id,
            },

            data: {
                isVerified: true,
                resetToken,
                resetTokenExpiresAt:
                    tokenExpiry,
            },
        });

        return {
            message:
                'OTP verified successfully',

            resetToken,
        };
    }

    async resetPassword(
        data: ResetPasswordDto,
    ) {
        if (
            data.password !==
            data.confirmPassword
        ) {
            throw new BadRequestException(
                'Passwords do not match',
            );
        }

        const otpRecord =
            await this.prisma.passwordResetOtp.findFirst({
                where: {
                    resetToken: data.resetToken,
                    isVerified: true,
                    usedAt: null,
                },
            });

        if (!otpRecord) {
            throw new BadRequestException(
                'Invalid reset token',
            );
        }

        if (
            !otpRecord.resetTokenExpiresAt ||
            new Date() > otpRecord.resetTokenExpiresAt
        ) {
            throw new BadRequestException(
                'Reset token expired',
            );
        }

        const hashedPassword =
            await bcrypt.hash(data.password, 10);

        await this.prisma.user.update({
            where: {
                id: otpRecord.userId,
            },

            data: {
                password: hashedPassword,
            },
        });

        await this.prisma.passwordResetOtp.update({
            where: {
                id: otpRecord.id,
            },

            data: {
                usedAt: new Date(),
            },
        });

        return {
            message:
                'Password reset successfully',
        };
    }

    async changePassword(
        userId: string,

        data: ChangePasswordDto,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!user) {
            throw new BadRequestException(
                'User not found',
            );
        }

        const isOldPasswordValid =
            await bcrypt.compare(
                data.oldPassword,
                user.password,
            );

        if (!isOldPasswordValid) {
            throw new BadRequestException(
                'Old password is incorrect',
            );
        }

        if (
            data.newPassword !==
            data.confirmPassword
        ) {
            throw new BadRequestException(
                'Passwords do not match',
            );
        }

        const hashedPassword =
            await bcrypt.hash(
                data.newPassword,
                10,
            );

        await this.prisma.user.update({
            where: {
                id: userId,
            },

            data: {
                password: hashedPassword,
            },
        });

        return {
            message:
                'Password changed successfully',
        };
    }


    async getMyProfile(
        userId: string,
    ) {

        const cacheKey =
            `profile:${userId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }


        /*
        |--------------------------------------------------------------------------
        | GET USER
        |--------------------------------------------------------------------------
        */

        const user =
            await this.prisma.user.findUnique({

                where: {
                    id: userId,
                },

                select: {

                    id: true,

                    fullName: true,

                    email: true,

                    phone: true,

                    profileImage: true,

                    latitude: true,

                    longitude: true,

                    role: true,

                    status: true,

                    isVerified: true,

                    acceptedTerms: true,

                    createdAt: true,

                    updatedAt: true,

                    traderProfile: {

                        include: {

                            subscription: {

                                include: {

                                    plan: true,

                                    price: true,
                                },
                            },

                            portfolioItems: {

                                orderBy: {
                                    createdAt: 'desc',
                                },
                            },

                            certificates: {

                                orderBy: {
                                    createdAt: 'desc',
                                },
                            },

                            insuranceDocuments: {

                                orderBy: {
                                    createdAt: 'desc',
                                },
                            },
                        },
                    },
                },
            });

        /*
        |--------------------------------------------------------------------------
        | USER NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (!user) {

            throw new BadRequestException(
                'User not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER RESPONSE
        |--------------------------------------------------------------------------
        */

        if (user.role !== 'TRADER') {

            return {

                ...user,

                traderProfile: null,
            };
        }

        /*
        |--------------------------------------------------------------------------
        | TRADER RESPONSE
        |--------------------------------------------------------------------------
        */
        await this.redisService.set(
            cacheKey,
            user,
            300, // 5 min
        );
        return user;
    }



    async updateProfile(
        userId: string,
        body: UpdateProfileDto,
        files: {
            profileImage?: Express.Multer.File[];
            logo?: Express.Multer.File[];
            document?: Express.Multer.File[];
        },
    ) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { traderProfile: true },
            });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            // 1. Trader validation immediately after fetch
            const traderProfile = user.traderProfile;
            if (user.role === 'TRADER' && !traderProfile) {
                throw new BadRequestException('Trader profile not found');
            }

            /* ===================== EMAIL CHECK ===================== */
            if (body.email && body.email !== user.email) {
                const emailExists = await this.prisma.user.findFirst({
                    where: {
                        email: body.email,
                        NOT: { id: userId },
                    },
                });

                if (emailExists) {
                    throw new BadRequestException('Email already exists');
                }
            }

            /* ===================== PHONE CHECK ===================== */
            if (body.phone && body.phone !== user.phone) {
                const phoneExists = await this.prisma.user.findFirst({
                    where: {
                        phone: body.phone,
                        NOT: { id: userId },
                    },
                });

                if (phoneExists) {
                    throw new BadRequestException('Phone already exists');
                }
            }

            /* ===================== FILE BACKUPS ===================== */
            let oldProfileImage = user.profileImage;
            let oldLogo = user.traderProfile?.logo;
            let oldDocument = user.traderProfile?.document;

            let profileImage = user.profileImage;
            let logo = user.traderProfile?.logo;
            let document = user.traderProfile?.document;
            let documentChanged = false;

            /* ===================== PROFILE IMAGE ===================== */
            if (files?.profileImage?.[0]) {
                profileImage = `/uploads/traders/${files.profileImage[0].filename}`;
            }

            /* ===================== LOGO ===================== */
            if (files?.logo?.[0]) {
                logo = `/uploads/traders/${files.logo[0].filename}`;
            }

            /* ===================== DOCUMENT ===================== */
            if (files?.document?.[0]) {
                document = `/uploads/traders/${files.document[0].filename}`;
                documentChanged = true;
            }

            /* ===================== USER UPDATE DATA ===================== */
            const updateUserData: Prisma.UserUpdateInput = {};

            if (body.fullName !== undefined) updateUserData.fullName = body.fullName;
            if (body.email !== undefined) updateUserData.email = body.email;
            if (body.phone !== undefined) updateUserData.phone = body.phone;
            if (body.latitude !== undefined) updateUserData.latitude = body.latitude;
            if (body.longitude !== undefined) updateUserData.longitude = body.longitude;
            if (profileImage !== user.profileImage) {
                updateUserData.profileImage = profileImage;
            }

            /* ===================== TRADER UPDATE DATA ===================== */
            const traderData: Prisma.TraderProfileUpdateInput = {};

            if (user.role === 'TRADER') {
                if (body.companyName !== undefined) traderData.companyName = body.companyName;
                if (body.companyType !== undefined) traderData.companyType = body.companyType;
                if (body.registrationNumber !== undefined) traderData.registrationNumber = body.registrationNumber;
                if (body.workRadius !== undefined) traderData.workRadius = body.workRadius;
                if (body.location !== undefined) traderData.location = body.location;
                if (body.about !== undefined) traderData.about = body.about;

                if (logo !== user.traderProfile?.logo) traderData.logo = logo;
                if (document !== user.traderProfile?.document) traderData.document = document;

                if (documentChanged) {
                    traderData.verificationStatus = 'PENDING';
                    traderData.verifiedAt = null;
                    traderData.verifiedBy = null;
                    traderData.rejectReason = null;
                }
            }

            /* ===================== DATABASE TRANSACTION ===================== */
            await this.prisma.$transaction(async (tx) => {
                // Update User
                await tx.user.update({
                    where: { id: userId },
                    data: updateUserData,
                });

                // Update Trader Profile
                if (user.role === 'TRADER') {
                    const categoryChanged =
                        body.tradeCategories !== undefined ||
                        body.skillsServices !== undefined ||
                        body.subCategories !== undefined;

                    // Category Change Request
                    if (categoryChanged && traderProfile) {
                        const subscription =
                            await tx.subscription.findUnique({
                                where: {
                                    traderProfileId: traderProfile.id,
                                },
                                include: {
                                    plan: true,
                                },
                            });

                        if (!subscription?.plan) {
                            throw new BadRequestException(
                                'No active subscription plan found',
                            );
                        }

                        const selectedTrades =
                            body.tradeCategories
                                ? [...new Set(body.tradeCategories)]
                                : traderProfile.tradeCategories;

                        if (
                            !subscription.plan.unlimitedTrades &&
                            selectedTrades.length >
                            subscription.plan.maxTrades
                        ) {
                            throw new BadRequestException(
                                `Your ${subscription.plan.name} plan allows only ${subscription.plan.maxTrades} trade categories`,
                            );
                        }
                        const pendingRequest = await tx.traderCategoryChangeRequest.findFirst({
                            where: {
                                traderProfileId: traderProfile.id,
                                status: 'PENDING',
                            },
                        });

                        if (pendingRequest) {
                            throw new BadRequestException('You already have a pending category change request');
                        }

                        await tx.traderCategoryChangeRequest.create({
                            data: {
                                traderProfileId: traderProfile.id,
                                tradeCategories: body.tradeCategories
                                    ? [...new Set(body.tradeCategories)]
                                    : traderProfile.tradeCategories,
                                skillsServices: body.skillsServices
                                    ? [...new Set(body.skillsServices)]
                                    : traderProfile.skillsServices,
                                subCategories: body.subCategories
                                    ? [...new Set(body.subCategories)]
                                    : traderProfile.subCategories,
                            },
                        });

                        // redis cache clear
                        await this.redisService.deleteByPattern(
                            'admin:category-change-requests:*',
                        );

                        const admins = await tx.user.findMany({
                            where: { role: 'ADMIN' },
                            select: { id: true },
                        });

                        const companyName = traderData.companyName || traderProfile.companyName || 'Trader';

                        await Promise.all(
                            admins.map((admin) =>
                                this.notificationService.createNotification(
                                    admin.id,
                                    'Category Change Request',
                                    `${companyName} requested category changes`,
                                    'TRADER_CATEGORY_CHANGE_REQUEST',
                                    { traderId: userId, companyName },
                                ),
                            ),
                        );
                    }

                    // Document update notification
                    if (documentChanged) {
                        const admins = await tx.user.findMany({
                            where: { role: 'ADMIN' },
                            select: { id: true },
                        });

                        const companyName = traderData.companyName || traderProfile?.companyName || 'Trader';

                        await Promise.all(
                            admins.map((admin) =>
                                this.notificationService.createNotification(
                                    admin.id,
                                    'Trader Document Updated',
                                    `${companyName} updated verification documents. Please review and verify.`,
                                    'TRADER_DOCUMENT_UPDATED',
                                    { traderId: userId, companyName },
                                ),
                            ),
                        );

                    }

                    // Final Trader Profile Update
                    await tx.traderProfile.update({
                        where: { userId },
                        data: traderData,
                    });
                }
            });

            /* ===================== DELETE OLD FILES AFTER SUCCESS ===================== */
            const deleteFile = (filePath?: string | null) => {
                if (!filePath) return;

                const fullPath = path.join(
                    process.cwd(),
                    filePath.replace(/^\/+/, ''),
                );

                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            };

            if (files?.profileImage?.[0]) deleteFile(oldProfileImage);
            if (files?.logo?.[0]) deleteFile(oldLogo);
            if (files?.document?.[0]) deleteFile(oldDocument);            /* ===================== CLEAR REDIS CACHE ===================== */

            // clear redis cache

            await Promise.all([
                this.redisService.del(
                    `admin:user-details:${userId}`,
                ),

                this.redisService.del(
                    `profile:${userId}`,
                ),
                this.redisService.deleteByPattern(
                    'customers:*',
                ),
                this.redisService.deleteByPattern(
                    'traders:*',
                ),
                this.redisService.del(
                    `registration-status:${userId}`,
                ),
            ]);

            return { message: 'Profile updated successfully' };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException('Email or phone already exists');
            }
            throw error;
        }
    }

    async updateTraderAssets(
        userId: string,
        aboutUs: string,
        files: {
            portfolioImages?: Express.Multer.File[];
            portfolioVideos?: Express.Multer.File[];
            certificates?: Express.Multer.File[];
            insuranceDocuments?: Express.Multer.File[];
        },
    ) {
        const trader = await this.prisma.traderProfile.findUnique({
            where: {
                userId,
            },
            include: {
                portfolioItems: true,
                certificates: true,
                insuranceDocuments: true,
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!trader) {
            throw new BadRequestException(
                'Trader profile not found',
            );
        }

        const plan = trader.subscription?.plan;

        if (!plan) {
            throw new BadRequestException(
                'Subscription plan not found',
            );
        }

        const imageFiles =
            files?.portfolioImages ?? [];

        const videoFiles =
            files?.portfolioVideos ?? [];

        const certificateFiles =
            files?.certificates ?? [];

        const insuranceFiles =
            files?.insuranceDocuments ?? [];

        const newPortfolioCount =
            imageFiles.length +
            videoFiles.length;

        const currentPortfolioCount =
            trader.portfolioItems.length;

        /*
        |--------------------------------------------------------------------------
        | PORTFOLIO LIMIT
        |--------------------------------------------------------------------------
        */

        if (
            currentPortfolioCount +
            newPortfolioCount >
            plan.maxPortfolioUploads
        ) {
            throw new BadRequestException(
                `Your ${plan.name} plan allows only ${plan.maxPortfolioUploads} portfolio uploads`,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VIDEO VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
            videoFiles.length > 0 &&
            !plan.allowPortfolioVideos
        ) {
            throw new BadRequestException(
                `Video uploads are not allowed in ${plan.name} plan`,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE ABOUT US
        |--------------------------------------------------------------------------
        */

        await this.prisma.traderProfile.update({
            where: {
                userId,
            },
            data: {
                aboutUs,
            },
        });

        /*
        |--------------------------------------------------------------------------
        | SAVE PORTFOLIO IMAGES
        |--------------------------------------------------------------------------
        */

        if (imageFiles.length) {
            await this.prisma.traderPortfolio.createMany({
                data: imageFiles.map((file) => ({
                    traderProfileId: trader.id,
                    fileUrl: `uploads/portfolio/${file.filename}`,
                    type: 'IMAGE',
                })),
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE PORTFOLIO VIDEOS
        |--------------------------------------------------------------------------
        */

        if (videoFiles.length) {
            await this.prisma.traderPortfolio.createMany({
                data: videoFiles.map((file) => ({
                    traderProfileId: trader.id,
                    fileUrl: `uploads/portfolio/${file.filename}`,
                    type: 'VIDEO',
                })),
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE CERTIFICATES
        |--------------------------------------------------------------------------
        */

        if (certificateFiles.length) {
            await this.prisma.traderCertificate.createMany({
                data: certificateFiles.map((file) => ({
                    traderProfileId: trader.id,
                    fileUrl: `uploads/portfolio/${file.filename}`,
                })),
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE INSURANCE DOCUMENTS
        |--------------------------------------------------------------------------
        */

        if (insuranceFiles.length) {
            await this.prisma.traderInsuranceDocument.createMany({
                data: insuranceFiles.map((file) => ({
                    traderProfileId: trader.id,
                    fileUrl: `uploads/portfolio/${file.filename}`,
                })),
            });
        }

        //checking moderation
        await this.moderationService.scanContent(
            userId,
            aboutUs,
            ContentType.PROFILE,
        );

        // clear redis cache

        await Promise.all([
            this.redisService.del(
                `admin:user-details:${userId}`,
            ),

            this.redisService.del(
                `profile:${userId}`,
            ),
            this.redisService.deleteByPattern(
                'traders:*',
            ),
        ]);

        return {
            message:
                'Trader assets updated successfully',
        };
    }


}