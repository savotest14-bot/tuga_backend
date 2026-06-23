import {
  BadRequestException,
} from '@nestjs/common';

import {
  diskStorage,
} from 'multer';

import { extname } from 'path';

export const multerOptions = (
  folder: string,
) => {
  return {
    storage: diskStorage({
      destination: `./uploads/${folder}`,

      filename: (
        req,
        file,
        callback,
      ) => {

        const uniqueName = `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}${extname(file.originalname)}`;

        callback(null, uniqueName);
      },
    }),

    fileFilter: (
      req,
      file,
      callback,
    ) => {

      const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',

        // Documents
        'application/pdf',

        // Videos
        'video/mp4',
        'video/mpeg',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/webm',
      ];

      if (
        !allowedMimeTypes.includes(
          file.mimetype,
        )
      ) {
        return callback(
          new BadRequestException(
            'Only image and pdf files are allowed',
          ),
          false,
        );
      }

      callback(null, true);
    },

    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  };
};