import {
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StorageEngine } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { extname } from 'path';
import { r2StorageInstance } from '../services/r2-storage.service';

const logger = new Logger('StorageEngine');

/**
 * Custom Multer storage engine that:
 * 1. Writes files to local disk under ./uploads/${folder}/${filename}
 * 2. Attempts to upload to Cloudflare R2
 * 3. If R2 succeeds: sets file.url / file.path to R2 URL
 * 4. If R2 fails (or not configured): gracefully falls back to local storage URL
 *    WITHOUT failing the request, ensuring uninterrupted service.
 */
export class R2WithLocalFallbackStorage implements StorageEngine {
  constructor(private readonly folder: string) {}

  _handleFile(
    req: any,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    // 1. Determine destination subfolder
    let destFolder = this.folder;
    if (
      file.fieldname === 'certificates' ||
      file.fieldname === 'insuranceDocuments' ||
      file.fieldname === 'portfolioImages' ||
      file.fieldname === 'portfolioVideos'
    ) {
      destFolder = 'portfolio';
    }

    // 2. Generate unique filename
    const ext = extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetDir = path.join(process.cwd(), 'uploads', destFolder);

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (dirErr: any) {
        return cb(dirErr);
      }
    }

    const localFilePath = path.join(targetDir, uniqueName);
    const outStream = fs.createWriteStream(localFilePath);

    file.stream.pipe(outStream);

    outStream.on('error', (err) => {
      logger.error(`Error writing file to local disk: ${err.message}`);
      cb(err);
    });

    outStream.on('finish', async () => {
      const bytesWritten = outStream.bytesWritten;
      const r2Key = `uploads/${destFolder}/${uniqueName}`;
      const localRelativeUrl = `/uploads/${destFolder}/${uniqueName}`;

      let r2Success = false;
      let finalUrl = localRelativeUrl;
      let storageType: 'r2' | 'local' = 'local';

      // 3. Attempt upload to Cloudflare R2 if configured
      if (r2StorageInstance.isConfigured()) {
        try {
          finalUrl = await r2StorageInstance.uploadFile(
            localFilePath,
            r2Key,
            file.mimetype,
          );
          r2Success = true;
          storageType = 'r2';
          logger.log(`[R2 Storage] Uploaded ${uniqueName} to Cloudflare R2: ${finalUrl}`);
        } catch (r2Err: any) {
          logger.warn(
            `[R2 Storage] Cloudflare R2 upload failed (${r2Err?.name || 'Error'}: ${r2Err?.message || r2Err}). Seamlessly falling back to local storage: ${localRelativeUrl}`,
          );
        }
      } else {
        logger.debug(
          `[R2 Storage] R2 not fully configured. Using local disk upload: ${localRelativeUrl}`,
        );
      }

      // 4. Populate file info object
      const fileInfo: any = {
        destination: targetDir,
        filename: uniqueName,
        path: r2Success ? finalUrl : localRelativeUrl,
        size: bytesWritten,
        url: finalUrl,
        r2Url: r2Success ? finalUrl : undefined,
        storage: storageType,
        localPath: localFilePath,
      };

      // Mutate file directly as well
      Object.assign(file, fileInfo);

      cb(null, fileInfo);
    });
  }

  _removeFile(
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ): void {
    const localPath =
      (file as any).localPath ||
      path.join(process.cwd(), 'uploads', file.filename);

    if (fs.existsSync(localPath)) {
      fs.unlink(localPath, (err) => {
        if (err) logger.warn(`Failed to remove file ${localPath}: ${err.message}`);
        cb(err);
      });
    } else {
      cb(null);
    }
  }
}

/**
 * Returns Multer options configured with R2 + Local Fallback storage.
 */
export const multerOptions = (folder: string) => {
  return {
    storage: new R2WithLocalFallbackStorage(folder),

    fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
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

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Only image and pdf files are allowed'),
          false,
        );
      }

      callback(null, true);
    },

    limits: {
      fileSize: 20 * 1024 * 1024, // 20 MB
    },
  };
};

/**
 * Helper to get the canonical URL of an uploaded file.
 * If R2 succeeded, returns the R2 URL.
 * If fallback to local storage occurred, returns the local URL (/uploads/...).
 */
export const getFileUrl = (
  file?: Express.Multer.File,
  fallbackFolder?: string,
  leadingSlash: boolean = true,
): string => {
  if (!file) return '';

  // 1. If explicit URL attached by storage engine
  if ((file as any).url) {
    return (file as any).url;
  }

  // 2. If R2 URL is present
  if ((file as any).r2Url) {
    return (file as any).r2Url;
  }

  // 3. If file.path is already an HTTP(S) URL
  if (
    file.path &&
    (file.path.startsWith('http://') || file.path.startsWith('https://'))
  ) {
    return file.path;
  }

  // 4. Construct local path from filename
  if (file.filename) {
    const folder = fallbackFolder ? `/${fallbackFolder}` : '';
    const prefix = leadingSlash ? '/uploads' : 'uploads';
    return `${prefix}${folder}/${file.filename}`;
  }

  // 5. Fallback to file.path
  if (file.path) {
    const clean = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    return leadingSlash ? `/${clean}` : clean;
  }

  return '';
};

/**
 * Helper to get canonical URLs for an array of uploaded files.
 */
export const getFileUrls = (
  files?: Express.Multer.File[],
  fallbackFolder?: string,
  leadingSlash: boolean = true,
): string[] => {
  if (!files || !Array.isArray(files)) return [];
  return files
    .map((f) => getFileUrl(f, fallbackFolder, leadingSlash))
    .filter(Boolean);
};

/**
 * Safely deletes a stored file from either Cloudflare R2 or local disk.
 */
export const deleteStoredFile = async (
  filePathOrUrl?: string | null,
): Promise<void> => {
  if (!filePathOrUrl) return;

  // R2 URL
  if (
    filePathOrUrl.startsWith('http://') ||
    filePathOrUrl.startsWith('https://')
  ) {
    try {
      await r2StorageInstance.deleteFile(filePathOrUrl);
    } catch (err: any) {
      logger.warn(`Failed to delete R2 object: ${filePathOrUrl}: ${err?.message}`);
    }
    return;
  }

  // Local file
  try {
    const cleanPath = filePathOrUrl.replace(/^\/+/, '');
    const fullPath = path.join(process.cwd(), cleanPath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (err: any) {
    logger.warn(`Failed to delete local file ${filePathOrUrl}: ${err?.message}`);
  }
};