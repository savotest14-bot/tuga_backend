import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeeder implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async seedAdmin() {
        const adminEmail =
            this.configService.get<string>('ADMIN_EMAIL');

        const adminPassword =
            this.configService.get<string>('ADMIN_PASSWORD');

        const existingAdmin = await this.prisma.user.findFirst({
            where: {
                email: adminEmail,
            },
        });

        if (existingAdmin) {
            console.log('✅ Admin already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(
            adminPassword!,
            10,
        );

        await this.prisma.user.create({
            data: {
                fullName: 'Super Admin',
                email: adminEmail!,
                password: hashedPassword,
                role: Role.ADMIN,
            },
        });
        
        console.log('🚀 Admin created successfully');
    }
}