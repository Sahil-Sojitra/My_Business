import multer from 'multer';

export interface StorageUploadResult {
  url: string;
  key: string;
  name: string;
  type: 'pdf' | 'photo';
  size: string;
}

export interface IStorageProvider {
  isConfigured(): boolean;
  uploadFile(
    file: Express.Multer.File,
    category: 'bill' | 'chitthi',
    userId: string
  ): Promise<StorageUploadResult>;
}

/**
 * Default external cloud storage provider placeholder.
 * Checks whether cloud object storage environment variables (e.g., S3/Cloudinary/Supabase) are provided.
 */
class CloudStorageProvider implements IStorageProvider {
  isConfigured(): boolean {
    // Check if cloud storage credentials are configured in environment
    return Boolean(
      process.env.STORAGE_BUCKET ||
      process.env.AWS_S3_BUCKET ||
      process.env.CLOUDINARY_URL ||
      process.env.SUPABASE_STORAGE_URL
    );
  }

  async uploadFile(
    _file: Express.Multer.File,
    _category: 'bill' | 'chitthi',
    _userId: string
  ): Promise<StorageUploadResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'External cloud object storage provider is not yet configured. Please supply storage credentials in .env.'
      );
    }

    // When storage credentials are added, the provider uploads here
    throw new Error('Storage adapter upload implementation pending credentials configuration.');
  }
}

export const storageProvider: IStorageProvider = new CloudStorageProvider();

/**
 * Format bytes to readable size string matching frontend convention
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// In-memory Multer storage (no local disk dependency)
const memoryStorage = multer.memoryStorage();

// Allowed MIME types for bill documents and Chitthi slips
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF documents and JPG/PNG/WebP images are supported.'));
    }
  },
});
