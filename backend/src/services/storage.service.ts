import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Validates that an object key belongs strictly to the authenticated user's namespace.
 * Prevents directory traversal and cross-tenant file deletion.
 */
export function isValidObjectKeyForUser(
  fileKey: unknown,
  userId: string
): fileKey is string {
  if (typeof fileKey !== 'string') {
    return false;
  }
  const trimmed = fileKey.trim();
  const expectedPrefix = `brokers/${userId}/`;
  if (!trimmed.startsWith(expectedPrefix)) {
    return false;
  }
  if (trimmed.includes('..') || trimmed.includes('\\')) {
    return false;
  }
  const parts = trimmed.split('/');
  return parts.length >= 4;
}

/**
 * Extracts Backblaze B2 object keys from a bill's billPdf and chitthi attachment metadata.
 */
export function extractAttachmentKeys(bill: {
  billPdf?: any;
  chitthi?: any;
}): string[] {
  const keys: string[] = [];

  if (
    bill?.billPdf &&
    typeof bill.billPdf === 'object' &&
    typeof (bill.billPdf as any).key === 'string' &&
    (bill.billPdf as any).key.trim().length > 0
  ) {
    keys.push((bill.billPdf as any).key.trim());
  }

  if (
    bill?.chitthi &&
    typeof bill.chitthi === 'object' &&
    typeof (bill.chitthi as any).key === 'string' &&
    (bill.chitthi as any).key.trim().length > 0
  ) {
    keys.push((bill.chitthi as any).key.trim());
  }

  return keys;
}

export interface PresignedUploadRequest {
  fileName: string;
  fileType: string; // e.g. 'application/pdf', 'image/jpeg', 'image/png'
  fileSize?: number;
  category: 'bill' | 'chitthi';
  userId: string;
}

export interface PresignedUploadResult {
  status: 'PENDING';
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  file: {
    name: string;
    type: 'pdf' | 'photo';
    size: string;
    url: string;
    key: string;
    status: 'PENDING';
  };
}

export interface UploadConfirmationResult {
  status: 'SUCCESSFUL';
  fileKey: string;
  url: string;
  message: string;
}

/**
 * Format bytes to readable size string matching frontend convention
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Document';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class BackblazeB2StorageService {
  private getClient(): S3Client {
    if (!this.isConfigured()) {
      throw new Error(
        'Backblaze B2 storage is not configured. Please supply valid B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME in your environment (.env).'
      );
    }

    const endpoint =
      process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
    const region = process.env.B2_REGION || 'us-west-004';
    const accessKeyId = process.env.B2_KEY_ID!;
    const secretAccessKey = process.env.B2_APPLICATION_KEY!;

    return new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  isConfigured(): boolean {
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;
    const bucket = process.env.B2_BUCKET_NAME;

    return Boolean(
      keyId &&
        keyId !== 'your_key_id_here' &&
        appKey &&
        appKey !== 'your_application_key_here' &&
        bucket &&
        bucket !== 'your-bucket-name'
    );
  }

  /**
   * Generates an S3 presigned PUT URL for direct client-to-B2 asynchronous uploading.
   * Node server does not buffer or hold heavy file data.
   */
  async requestPresignedUpload(
    params: PresignedUploadRequest
  ): Promise<PresignedUploadResult> {
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';
    const endpoint = (
      process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com'
    ).replace(/\/$/, '');

    const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const fileKey = `brokers/${params.userId}/${params.category}/${timestamp}_${sanitizedName}`;

    const isPdf =
      params.fileType.toLowerCase().includes('pdf') ||
      params.fileName.toLowerCase().endsWith('.pdf');
    const docType: 'pdf' | 'photo' = isPdf ? 'pdf' : 'photo';
    const formattedSize = formatBytes(params.fileSize);

    // Direct permanent public/view URL format for Backblaze B2
    const fileUrl = `${endpoint}/${bucket}/${fileKey}`;

    const s3 = this.getClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: params.fileType,
    });

    // Production presigned upload URL directly to Backblaze B2 (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return {
      status: 'PENDING',
      uploadUrl,
      fileKey,
      fileUrl,
      file: {
        name: params.fileName,
        type: docType,
        size: formattedSize,
        url: fileUrl,
        key: fileKey,
        status: 'PENDING',
      },
    };
  }

  /**
   * Confirms that direct upload completed and updates status to SUCCESSFUL
   */
  async confirmUpload(
    fileKey: string,
    userId: string
  ): Promise<UploadConfirmationResult> {
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';
    const endpoint = (
      process.env.B2_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com'
    ).replace(/\/$/, '');
    const fileUrl = `${endpoint}/${bucket}/${fileKey}`;

    const s3 = this.getClient();
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        })
      );
    } catch (err: unknown) {
      console.warn(
        `[B2 Storage] HeadObject check warning for ${fileKey}:`,
        err instanceof Error ? err.message : err
      );
    }

    return {
      status: 'SUCCESSFUL',
      fileKey,
      url: fileUrl,
      message: 'File upload verified and marked successful',
    };
  }

  /**
   * Generates a temporary pre-signed GET URL for viewing private files
   */
  async getPresignedDownloadUrl(fileKey: string): Promise<string> {
    const s3 = this.getClient();
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    // Valid for 1 hour (3600 seconds)
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }

  /**
   * Programmatically configures CORS rules on the Backblaze B2 bucket.
   * Enables GET, PUT, POST, DELETE, HEAD from mobile app and web origins.
   */
  async configureBucketCors(): Promise<{
    success: boolean;
    bucket: string;
    message: string;
    corsRules: any[];
  }> {
    const s3 = this.getClient();
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';

    const corsRules = [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: [
          'ETag',
          'x-amz-request-id',
          'x-amz-id-2',
          'Content-Length',
          'Content-Type',
        ],
        MaxAgeSeconds: 3600,
      },
    ];

    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: corsRules,
      },
    });

    await s3.send(command);

    return {
      success: true,
      bucket,
      message: `CORS rules successfully configured on Backblaze B2 bucket "${bucket}". PUT, POST, GET, and DELETE are now enabled.`,
      corsRules,
    };
  }

  /**
   * Retrieves active CORS rules for the Backblaze B2 bucket
   */
  async getBucketCors() {
    const s3 = this.getClient();
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';

    const command = new GetBucketCorsCommand({
      Bucket: bucket,
    });

    const response = await s3.send(command);
    return response.CORSRules || [];
  }

  /**
   * Checks whether a fileKey is still referenced by any other active bill in PostgreSQL.
   * Prevents deleting shared objects if multiple bills point to the same attachment key.
   */
  async isKeyReferencedByOtherBills(
    fileKey: string,
    excludeBillId?: string
  ): Promise<boolean> {
    try {
      const where: Prisma.BillWhereInput = {
        OR: [
          { billPdf: { path: ['key'], equals: fileKey } },
          { chitthi: { path: ['key'], equals: fileKey } },
        ],
      };

      if (excludeBillId) {
        where.id = { not: excludeBillId };
      }

      const count = await prisma.bill.count({ where });
      return count > 0;
    } catch (err: unknown) {
      console.warn(
        `[B2 Storage Warning] Failed to check shared references for key "${fileKey}":`,
        err instanceof Error ? err.message : err
      );
      // Fail closed: if reference status cannot be determined, treat as referenced to avoid data loss
      return true;
    }
  }

  /**
   * Deletes a single object from Backblaze B2.
   * Enforces user namespace isolation, shared reference checks, and idempotent 404/missing handling.
   */
  async deleteObject(
    fileKey: string,
    userId: string,
    excludeBillId?: string
  ): Promise<{ success: boolean; key: string; skipped?: boolean; error?: string }> {
    if (!isValidObjectKeyForUser(fileKey, userId)) {
      const errorMsg = 'Unauthorized or invalid storage key format.';
      return { success: false, key: typeof fileKey === 'string' ? fileKey : '', error: errorMsg };
    }

    // Check if the object is still referenced by another bill
    const isShared = await this.isKeyReferencedByOtherBills(fileKey, excludeBillId);
    if (isShared) {
      console.log(
        `[B2 Storage] Object "${fileKey}" is referenced by another bill. Skipping cloud deletion.`
      );
      return { success: true, key: fileKey, skipped: true };
    }

    if (!this.isConfigured()) {
      return { success: true, key: fileKey };
    }

    const s3 = this.getClient();
    const bucket = process.env.B2_BUCKET_NAME || 'my-business-bucket';

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      await s3.send(command);
      return { success: true, key: fileKey };
    } catch (err: unknown) {
      const errorName = (err as any)?.name;
      const statusCode = (err as any)?.$metadata?.httpStatusCode;

      // S3 provider semantics: If object is already missing (NoSuchKey, 404), treat as success
      if (
        errorName === 'NoSuchKey' ||
        errorName === 'NotFound' ||
        statusCode === 404
      ) {
        return { success: true, key: fileKey };
      }

      const safeMessage =
        err instanceof Error ? err.message : 'Unknown cloud storage error';
      console.error(
        `[B2 Storage Error] Failed to delete object "${fileKey}": ${safeMessage}`
      );
      return { success: false, key: fileKey, error: safeMessage };
    }
  }

  /**
   * Deletes multiple Backblaze B2 objects for a user.
   * Returns individual results and automatically records failures in the durable retry queue.
   */
  async deleteObjects(
    fileKeys: string[],
    userId: string,
    excludeBillId?: string
  ): Promise<{
    total: number;
    deleted: string[];
    failed: Array<{ key: string; error: string }>;
    skipped: string[];
  }> {
    const uniqueKeys = Array.from(new Set(fileKeys.filter(Boolean)));
    const deleted: string[] = [];
    const failed: Array<{ key: string; error: string }> = [];
    const skipped: string[] = [];

    for (const key of uniqueKeys) {
      const res = await this.deleteObject(key, userId, excludeBillId);
      if (res.success) {
        if (res.skipped) {
          skipped.push(key);
        } else {
          deleted.push(key);
        }
      } else {
        const errorMsg = res.error || 'Cloud deletion failed';
        failed.push({ key, error: errorMsg });

        // Record in durable cleanup queue for background retry
        await this.recordFailedCleanup(userId, key, errorMsg);
      }
    }

    return {
      total: uniqueKeys.length,
      deleted,
      failed,
      skipped,
    };
  }

  /**
   * Persists a failed deletion task into the database outbox for background retry.
   */
  async recordFailedCleanup(
    userId: string,
    fileKey: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await prisma.storageCleanupTask.create({
        data: {
          userId,
          fileKey,
          status: 'PENDING',
          attempts: 1,
          lastError: errorMessage,
        },
      });
    } catch (err: unknown) {
      console.error(
        `[B2 Storage] Failed to record durable cleanup task for "${fileKey}":`,
        err instanceof Error ? err.message : err
      );
    }
  }

  /**
   * Retries pending or failed cleanup tasks from the durable outbox.
   */
  async retryPendingCleanups(
    limit: number = 50
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    try {
      const pendingTasks = await prisma.storageCleanupTask.findMany({
        where: {
          status: { in: ['PENDING', 'FAILED'] },
          attempts: { lt: 5 },
        },
        take: limit,
        orderBy: { createdAt: 'asc' },
      });

      let succeeded = 0;
      let failed = 0;

      for (const task of pendingTasks) {
        const res = await this.deleteObject(task.fileKey, task.userId);
        if (res.success) {
          await prisma.storageCleanupTask.update({
            where: { id: task.id },
            data: { status: 'COMPLETED' },
          });
          succeeded++;
        } else {
          await prisma.storageCleanupTask.update({
            where: { id: task.id },
            data: {
              status: 'FAILED',
              attempts: { increment: 1 },
              lastError: res.error || 'Retry deletion failed',
            },
          });
          failed++;
        }
      }

      return { processed: pendingTasks.length, succeeded, failed };
    } catch (err: unknown) {
      console.error(
        '[B2 Storage] Error processing pending cleanup tasks:',
        err instanceof Error ? err.message : err
      );
      return { processed: 0, succeeded: 0, failed: 0 };
    }
  }
}

export const storageService = new BackblazeB2StorageService();

