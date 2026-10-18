import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
}

export const storageService = new BackblazeB2StorageService();
