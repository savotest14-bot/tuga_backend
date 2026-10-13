import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Ensure .env is loaded even before NestJS bootstrap
dotenv.config();

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private endpoint: string = '';
  private publicUrl: string = '';

  constructor() {
    this.initClient();
  }

  public initClient(): S3Client | null {
    const bucket = process.env.R2_BUCKET_NAME || 'tugatrades-storage';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const publicUrl = process.env.R2_PUBLIC_URL || 'https://cdn.tugatrades.com';

    this.bucketName = bucket;
    this.endpoint = endpoint || '';
    this.publicUrl = publicUrl;

    if (accessKeyId && secretAccessKey && endpoint) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        return this.s3Client;
      } catch (err: any) {
        this.logger.error(`Failed to initialize Cloudflare R2 Client: ${err?.message}`);
        this.s3Client = null;
      }
    } else {
      this.s3Client = null;
    }
    return null;
  }

  public getClient(): S3Client | null {
    if (!this.s3Client) {
      this.initClient();
    }
    return this.s3Client;
  }

  public isConfigured(): boolean {
    if (!this.s3Client) {
      this.initClient();
    }
    return !!(this.s3Client && this.bucketName);
  }

  public getBucketName(): string {
    return this.bucketName || process.env.R2_BUCKET_NAME || 'tugatrades-storage';
  }

  /**
   * Generates public URL for a given object key in Cloudflare R2
   */
  public getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    const publicUrl =
      process.env.R2_PUBLIC_URL ||
      this.publicUrl ||
      'https://cdn.tugatrades.com';

    if (publicUrl) {
      return `${publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
    }
    // Default R2 URL using S3 endpoint if public URL not explicitly provided
    if (this.endpoint) {
      const cleanEndpoint = this.endpoint.replace(/\/+$/, '');
      return `${cleanEndpoint}/${this.getBucketName()}/${cleanKey}`;
    }
    return `/${cleanKey}`;
  }

  /**
   * Uploads a file from local filesystem to Cloudflare R2
   */
  async uploadFile(localPath: string, key: string, mimeType?: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error('R2 S3 Client is not initialized (missing environment variables)');
    }

    const fileStream = fs.createReadStream(localPath);
    const cleanKey = key.replace(/^\/+/, '');

    await client.send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: cleanKey,
        Body: fileStream,
        ContentType: mimeType || 'application/octet-stream',
      }),
    );

    return this.getPublicUrl(cleanKey);
  }

  /**
   * Uploads a buffer directly to Cloudflare R2
   */
  async uploadBuffer(buffer: Buffer, key: string, mimeType?: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error('R2 S3 Client is not initialized (missing environment variables)');
    }

    const cleanKey = key.replace(/^\/+/, '');

    await client.send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: cleanKey,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
      }),
    );

    return this.getPublicUrl(cleanKey);
  }

  /**
   * Deletes an object from Cloudflare R2
   */
  async deleteFile(keyOrUrl: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !keyOrUrl) {
      return false;
    }

    const key = this.extractKeyFromUrl(keyOrUrl);
    if (!key) return false;

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.getBucketName(),
          Key: key,
        }),
      );
      this.logger.log(`Deleted object from Cloudflare R2: ${key}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to delete object from Cloudflare R2 (${key}): ${err?.message}`);
      return false;
    }
  }

  /**
   * Extract R2 key from either a full URL or relative path
   */
  public extractKeyFromUrl(keyOrUrl: string): string {
    if (!keyOrUrl) return '';
    try {
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        const url = new URL(keyOrUrl);
        let pathname = url.pathname.replace(/^\/+/, '');
        // If pathname starts with bucketName, strip it
        const bucket = this.getBucketName();
        if (bucket && pathname.startsWith(`${bucket}/`)) {
          pathname = pathname.substring(bucket.length + 1);
        }
        return pathname;
      }
      return keyOrUrl.replace(/^\/+/, '');
    } catch {
      return keyOrUrl.replace(/^\/+/, '');
    }
  }

  /**
   * Tests connection to Cloudflare R2
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: any }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'R2 S3 Client not initialized due to missing credentials.',
      };
    }

    const testKey = `test/connection-check-${Date.now()}.txt`;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: this.getBucketName(),
          Key: testKey,
          Body: 'Cloudflare R2 test connection',
          ContentType: 'text/plain',
        }),
      );

      // Clean up test file
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.getBucketName(),
          Key: testKey,
        }),
      ).catch(() => {});

      return {
        success: true,
        message: `Successfully connected to Cloudflare R2 bucket: ${this.bucketName}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloudflare R2 check failed: ${err?.name || 'Error'}: ${err?.message || err}`,
        error: err,
      };
    }
  }
}

// Singleton instance for multer storage engine helper
export const r2StorageInstance = new R2StorageService();
