import {
  Body,
  Controller,
  Post,
  Req,
  Put,
  Get
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { CustomerRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyForgotOtpDto } from './dto/verify-forgot-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TraderRegisterStep1Dto } from './dto/trader-register-step1.dto';
import { TraderRegisterStep2Dto } from './dto/trader-register-step2.dto';
import { TraderRegisterStep3Dto } from './dto/trader-register-step3.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import {
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';

import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';

import { multerOptions } from '../common/helpers/multer.helper';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { UpdateTraderAssetsDto } from './dto/update-trader-assest.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateTraderCategoriesDto } from './dto/update-trade-categories.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) { }

  @Post('customer/register')
  async customerRegister(
    @Body() body: CustomerRegisterDto,
  ) {
    return this.authService.customerRegister(
      body,
    );
  }

  @Post('trader/register-step-1')
  async traderRegisterStep1(
    @Body()
    body: TraderRegisterStep1Dto,
  ) {
    return this.authService.traderRegisterStep1(
      body,
    );
  }

  @Put('trader/register-step-2')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: {
          type: 'string',
          example: 'ABC Plumbing Ltd',
        },
        companyType: {
          type: 'string',
          example: 'Private Limited',
        },
        registrationNumber: {
          type: 'string',
          example: 'REG123456',
        },
        about: {
          type: 'string',
          example:
            'Professional plumbing services',
        },
        location: {
          type: 'string',
          example: 'Dubai Marina',
        },
        minimumExperience: {
          type: 'boolean',
          example: true,
        },
        authorisedBusiness: {
          type: 'boolean',
          example: true,
        },
        understandVettingPolicy: {
          type: 'boolean',
          example: true,
        },
        acceptedPrivacyPolicy: {
          type: 'boolean',
          example: true,
        },
        acceptedTermsConditions: {
          type: 'boolean',
          example: true,
        },
        logo: {
          type: 'string',
          format: 'binary',
        },
        document: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'logo',
          maxCount: 1,
        },

        {
          name: 'document',
          maxCount: 1,
        },
      ],

      multerOptions('traders'),
    ),
  )

  async traderRegisterStep2(
    @Req() req: Request,

    @Body()
    body: TraderRegisterStep2Dto,

    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];

      document?: Express.Multer.File[];
    },
  ) {
    return this.authService.traderRegisterStep2(
      req['user'].id,

      body,

      files,
    );
  }


  @ApiBearerAuth('access-token')
  @Put('trader/register-step-3')
  async traderRegisterStep3(
    @Req() req: Request,
    @Body()
    body: TraderRegisterStep3Dto,
  ) {

    return this.authService.traderRegisterStep3(
      req['user'].id,
      body,
    );
  }

  @ApiBearerAuth('access-token')
  @Get('trader/registration-status')
  async registrationStatus(
    @Req() req: Request,
  ) {
    return this.authService.registrationStatus(
      req['user'].id,
    );
  }

  @Put('trader/categories')
  @ApiBearerAuth('access-token')
  async updateTraderCategories(
    @Req() req: Request,
    @Body() body: UpdateTraderCategoriesDto,
  ) {
    return this.authService.updateTraderCategories(
      req['user'].id,
      body,
    );
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
  ) {
    return this.authService.login(body);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  async logout(
    @Req() req: Request,
  ) {
    return this.authService.logout(
      req['user'].id,
    );
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() body: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      body.email,
    );
  }

  @Post('verify-forgot-otp')
  verifyForgotOtp(
    @Body() body: VerifyForgotOtpDto,
  ) {
    return this.authService.verifyForgotOtp(
      body.email,
      body.otp,
    );
  }

  @Post('reset-password')
  resetPassword(
    @Body() body: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      body,
    );
  }

  @Post('resend-forgot-otp')
  async resendForgotOtp(
    @Body() body: ForgotPasswordDto,
  ) {
    return this.authService.resendForgotOtp(
      body.email,
    );
  }

  @ApiBearerAuth('access-token')
  @Post('change-password')
  async changePassword(
    @Req() req,

    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      body,
    );
  }

  @ApiBearerAuth('access-token')
  @Get('getMyProfile')
  async getMyProfile(
    @Req() req: any,
  ) {
    return this.authService.getMyProfile(
      req.user.id,
    );
  }

  @ApiBearerAuth('access-token')
  @Put('updateProfile')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [], // all optional

      properties: {

        /* ================= USER ================= */

        fullName: {
          type: 'string',
          example: 'John Doe',
        },

        email: {
          type: 'string',
          example: 'john@test.com',
        },

        phone: {
          type: 'string',
          example: '9876543210',
        },

        latitude: {
          type: 'number',
          example: 22.7196,
        },

        longitude: {
          type: 'number',
          example: 75.8577,
        },

        /* ================= TRADER ================= */

        companyName: {
          type: 'string',
          example: 'ABC Traders',
        },

        companyType: {
          type: 'string',
          example: 'Private Limited',
        },

        registrationNumber: {
          type: 'string',
          example: 'REG123456',
        },

        tradeCategories: {
          type: 'string',
          example: '["cat1","cat2"]',
        },

        skillsServices: {
          type: 'string',
          example: '["painting","tiles"]',
        },

        subCategories: {
          type: 'string',
          example: '["sub1","sub2"]',
        },

        workRadius: {
          type: 'number',
          example: 50,
        },

        location: {
          type: 'string',
          example: 'Indore',
        },

        about: {
          type: 'string',
          example: 'Experienced contractor',
        },

        /* ================= FILES ================= */

        profileImage: {
          type: 'string',
          format: 'binary',
        },

        logo: {
          type: 'string',
          format: 'binary',
        },

        document: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'profileImage',
          maxCount: 1,
        },
        {
          name: 'logo',
          maxCount: 1,
        },
        {
          name: 'document',
          maxCount: 1,
        },
      ],
      multerOptions('traders'),
    ),
  )
  async updateProfile(
    @Req()
    req: Request,

    @Body()
    body: UpdateProfileDto,

    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ) {
    return this.authService.updateProfile(
      req['user'].id,
      body,
      files,
    );
  }

  @ApiBearerAuth('access-token')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'portfolioImages',
          maxCount: 10,
        },
        {
          name: 'portfolioVideos',
          maxCount: 5,
        },
        {
          name: 'certificates',
          maxCount: 5,
        },
        {
          name: 'insuranceDocuments',
          maxCount: 5,
        },
      ],
      multerOptions('portfolio'),
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateTraderAssetsDto,
  })
  @Put('update-trader-assets')
  async updateTraderAssets(
    @Req()
    req: Request,

    @Body()
    body: UpdateTraderAssetsDto,

    @UploadedFiles()
    files: {
      portfolioImages?: Express.Multer.File[];
      portfolioVideos?: Express.Multer.File[];
      certificates?: Express.Multer.File[];
      insuranceDocuments?: Express.Multer.File[];
    },
  ) {
    return this.authService.updateTraderAssets(
      req['user'].id,
      body.aboutUs,
      files,
    );
  }

  @Post('resend-verification-otp')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Resend verification OTP' })
  async resendVerificationOtp(
    @Req() req: Request,
  ) {
    return this.authService.resendVerificationOtp(
      req['user'].id,
    );
  }

  @Post('verify-otp')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify email OTP' })
  async verifyOtp(
    @Req() req: Request,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(
      req['user'].id,
      dto,
    );
  }


}