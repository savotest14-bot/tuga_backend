import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSkillServiceDto } from './dto/create-skill-service.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSkillServiceDto } from './dto/update-skill-service.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class MasterService {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    
    // CREATE CATEGORY with redis

    async createCategory(
        data: CreateCategoryDto,

        file?: Express.Multer.File,
    ) {

        const existingCategory =
            await this.prisma.category.findFirst({
                where: {
                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },

                    isActive: true,
                },
            });

        if (existingCategory) {
            throw new BadRequestException(
                'Category already exists',
            );
        }

        const image = file
            ? `/uploads/categories/${file.filename}`
            : null;

        const category =
            await this.prisma.category.create({
                data: {
                    ...data,
                    image,
                },
            });

        // CLEAR CACHE

        await this.redisService.del(
            'categories',
        );

        return category;
    }


    // CREATE SKILL SERVICE

    async createSkillService(
        data: CreateSkillServiceDto,

        file?: Express.Multer.File,
    ) {

        const category =
            await this.prisma.category.findUnique({
                where: {
                    id: data.categoryId,
                },
            });

        if (!category) {
            throw new BadRequestException(
                'Category not found',
            );
        }

        const existingSkillService =
            await this.prisma.skillService.findFirst({
                where: {

                    categoryId:
                        data.categoryId,

                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },

                    isActive: true,
                },
            });

        if (existingSkillService) {
            throw new BadRequestException(
                'Skill service already exists in this category',
            );
        }

        const image = file
            ? `/uploads/skill-services/${file.filename}`
            : null;

        const skillService =
            await this.prisma.skillService.create({
                data: {
                    ...data,
                    image,
                },
            });

        // CLEAR CACHE

        await this.redisService.del(
            `skill-services-${data.categoryId}`,
        );

        return skillService;
    }

    // CREATE SUB CATEGORY

    async createSubCategory(
        data: CreateSubCategoryDto,

        file?: Express.Multer.File,
    ) {

        const skillService =
            await this.prisma.skillService.findUnique({
                where: {
                    id: data.skillServiceId,
                },
            });

        if (!skillService) {
            throw new BadRequestException(
                'Skill service not found',
            );
        }

        const existingSubCategory =
            await this.prisma.subCategory.findFirst({
                where: {

                    skillServiceId:
                        data.skillServiceId,

                    name: {
                        equals: data.name,
                        mode: 'insensitive',
                    },

                    isActive: true,
                },
            });

        if (existingSubCategory) {
            throw new BadRequestException(
                'Sub category already exists in this skill service',
            );
        }

        const image = file
            ? `/uploads/sub-categories/${file.filename}`
            : null;

        const subCategory =
            await this.prisma.subCategory.create({
                data: {
                    ...data,
                    image,
                },
            });

        // CLEAR CACHE

        await this.redisService.del(
            `sub-categories-${data.skillServiceId}`,
        );

        return subCategory;
    }

    // Get Full Nested Data
    async getAllCategories() {

        // CHECK CACHE

        const cachedCategories =
            await this.redisService.get(
                'categories',
            );

        if (cachedCategories) {

            return {
                message:
                    'Categories fetched from Redis',

                data:
                    cachedCategories,
            };
        }

        // DB QUERY

        const categories =
            await this.prisma.category.findMany({
                where: {
                    isActive: true,
                },

                orderBy: {
                    createdAt: 'asc',
                },
            });

        // STORE CACHE (1 HOUR)

        await this.redisService.set(
            'categories',

            categories,

            60 * 60,
        );

        return {
            message:
                'Categories fetched from DB',

            data:
                categories,
        };
    }

    // Get Skill Services By Category
    async getSkillServicesByCategory(
        categoryId: string,
    ) {

        const cacheKey =
            `skill-services-${categoryId}`;

        // CHECK CACHE

        const cachedSkills =
            await this.redisService.get(
                cacheKey,
            );

        if (cachedSkills) {

            return {
                message:
                    'Skill services fetched from Redis',

                data:
                    cachedSkills,
            };
        }

        const category =
            await this.prisma.category.findUnique({
                where: {
                    id: categoryId,
                    isActive: true,
                },
            });

        if (!category) {
            throw new BadRequestException(
                'Category not found',
            );
        }

        const skillServices =
            await this.prisma.skillService.findMany({
                where: {
                    categoryId,
                    isActive: true,
                },

                orderBy: {
                    createdAt: 'asc',
                },
            });

        // STORE CACHE

        await this.redisService.set(
            cacheKey,

            skillServices,

            60 * 60,
        );

        return {
            message:
                'Skill services fetched from DB',

            data:
                skillServices,
        };
    }


    // Get Sub Categories By Skill Service
    async getSubCategoriesBySkillService(
        skillServiceId: string,
    ) {

        const cacheKey =
            `sub-categories-${skillServiceId}`;

        // CHECK CACHE

        const cachedSubCategories =
            await this.redisService.get(
                cacheKey,
            );

        if (cachedSubCategories) {

            return {
                message:
                    'Sub categories fetched from Redis',

                data:
                    cachedSubCategories,
            };
        }

        const skillService =
            await this.prisma.skillService.findUnique({
                where: {
                    id: skillServiceId,
                    isActive: true,
                },
            });

        if (!skillService) {
            throw new BadRequestException(
                'Skill service not found',
            );
        }

        const subCategories =
            await this.prisma.subCategory.findMany({
                where: {
                    skillServiceId,
                    isActive: true,
                },

                orderBy: {
                    createdAt: 'asc',
                },
            });

        // STORE CACHE

        await this.redisService.set(
            cacheKey,

            subCategories,

            60 * 60,
        );

        return {
            message:
                'Sub categories fetched from DB',

            data:
                subCategories,
        };
    }

    async toggleCategory(
        id: string,
    ) {

        const category =
            await this.prisma.category.findUnique({
                where: { id },
            });

        if (!category) {
            throw new BadRequestException(
                'Category not found',
            );
        }

        const updatedCategory =
            await this.prisma.category.update({
                where: { id },

                data: {
                    isActive:
                        !category.isActive,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            'categories',
        );

        return updatedCategory;
    }

    // TOGGLE SKILL SERVICE

    async toggleSkillService(
        id: string,
    ) {

        const skillService =
            await this.prisma.skillService.findUnique({
                where: { id },
            });

        if (!skillService) {
            throw new BadRequestException(
                'Skill service not found',
            );
        }

        const updatedSkillService =
            await this.prisma.skillService.update({
                where: { id },

                data: {
                    isActive:
                        !skillService.isActive,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            `skill-services-${skillService.categoryId}`,
        );

        return updatedSkillService;
    }

    // TOGGLE SUB CATEGORY

    async toggleSubCategory(
        id: string,
    ) {

        const subCategory =
            await this.prisma.subCategory.findUnique({
                where: { id },
            });

        if (!subCategory) {
            throw new BadRequestException(
                'Sub category not found',
            );
        }

        const updatedSubCategory =
            await this.prisma.subCategory.update({
                where: { id },

                data: {
                    isActive:
                        !subCategory.isActive,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            `sub-categories-${subCategory.skillServiceId}`,
        );

        return updatedSubCategory;
    }

    async updateCategory(
        id: string,

        body: UpdateCategoryDto,

        file?: Express.Multer.File,
    ) {

        const category =
            await this.prisma.category.findUnique({
                where: { id },
            });

        if (!category) {
            throw new BadRequestException(
                'Category not found',
            );
        }

        let image =
            category.image;

        // DELETE OLD IMAGE

        if (file) {

            if (category.image) {

                const oldImagePath =
                    path.join(
                        process.cwd(),
                        category.image,
                    );

                if (
                    fs.existsSync(oldImagePath)
                ) {
                    fs.unlinkSync(
                        oldImagePath,
                    );
                }
            }

            image =
                `/uploads/categories/${file.filename}`;
        }

        const updatedCategory =
            await this.prisma.category.update({
                where: { id },

                data: {
                    ...body,
                    image,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            'categories',
        );

        return updatedCategory;
    }

    // UPDATE SKILL SERVICE

    async updateSkillService(
        id: string,

        body: UpdateSkillServiceDto,

        file?: Express.Multer.File,
    ) {

        const skillService =
            await this.prisma.skillService.findUnique({
                where: { id },
            });

        if (!skillService) {
            throw new BadRequestException(
                'Skill service not found',
            );
        }

        let image =
            skillService.image;

        // DELETE OLD IMAGE

        if (file) {

            if (skillService.image) {

                const oldImagePath =
                    path.join(
                        process.cwd(),
                        skillService.image,
                    );

                if (
                    fs.existsSync(oldImagePath)
                ) {
                    fs.unlinkSync(
                        oldImagePath,
                    );
                }
            }

            image =
                `/uploads/skill-services/${file.filename}`;
        }

        const updatedSkillService =
            await this.prisma.skillService.update({
                where: { id },

                data: {
                    ...body,
                    image,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            `skill-services-${skillService.categoryId}`,
        );

        return updatedSkillService;
    }

    // UPDATE SUB CATEGORY

    async updateSubCategory(
        id: string,

        body: UpdateSubCategoryDto,

        file?: Express.Multer.File,
    ) {

        const subCategory =
            await this.prisma.subCategory.findUnique({
                where: { id },
            });

        if (!subCategory) {
            throw new BadRequestException(
                'Sub category not found',
            );
        }

        let image =
            subCategory.image;

        // DELETE OLD IMAGE

        if (file) {

            if (subCategory.image) {

                const oldImagePath =
                    path.join(
                        process.cwd(),
                        subCategory.image,
                    );

                if (
                    fs.existsSync(oldImagePath)
                ) {
                    fs.unlinkSync(
                        oldImagePath,
                    );
                }
            }

            image =
                `/uploads/sub-categories/${file.filename}`;
        }

        const updatedSubCategory =
            await this.prisma.subCategory.update({
                where: { id },

                data: {
                    ...body,
                    image,
                },
            });

        // CLEAR REDIS CACHE

        await this.redisService.del(
            `sub-categories-${subCategory.skillServiceId}`,
        );

        return updatedSubCategory;
    }
}