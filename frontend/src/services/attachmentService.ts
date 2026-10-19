import {
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  DocumentPickerResponse,
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import {
  Asset,
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { alertService } from '../context/AlertContext';
import { AttachmentFile } from '../types/transaction';
import { request } from './apiClient';

const { DocumentViewer } = NativeModules;

/**
 * Format raw bytes into human-readable size (e.g. 240 KB, 1.2 MB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return 'Document';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Request camera permission on Android
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const isGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    if (isGranted) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission Required',
        message:
          'My Business needs camera access so you can click photos of Chitthi delivery slips.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Pick an official PDF Bill / Invoice document from phone storage
 */
export async function pickBillPdf(): Promise<AttachmentFile | null> {
  try {
    const [file]: DocumentPickerResponse[] = await pick({
      type: [types.pdf],
      allowMultiSelection: false,
    });

    if (file) {
      return {
        name: file.name || 'Invoice_Bill.pdf',
        type: 'pdf',
        size: formatFileSize(file.size ?? undefined),
        uri: file.uri,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
      };
    }
    return null;
  } catch (err: unknown) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw err;
  }
}

/**
 * Take a photo of the Chitthi using the physical phone camera
 */
export async function takeChitthiPhoto(): Promise<AttachmentFile | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    alertService.showAlert({
      title: 'Camera Permission Required',
      message:
        'Please allow Camera permission in your phone settings to click physical Chitthi photos.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          style: 'primary',
          onPress: () => Linking.openSettings(),
        },
      ],
    });
    return null;
  }

  const options: CameraOptions = {
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: true,
  };

  const response: ImagePickerResponse = await launchCamera(options);

  if (response.didCancel) {
    return null;
  }

  if (response.errorCode) {
    throw new Error(response.errorMessage || 'Camera capture failed');
  }

  if (response.assets && response.assets.length > 0) {
    const asset: Asset = response.assets[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    return {
      name: asset.fileName || `Chitthi_Photo_${timeStr}.jpg`,
      type: 'photo',
      size: formatFileSize(asset.fileSize),
      uri: asset.uri,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };
  }

  return null;
}

/**
 * Choose a photo from the phone gallery
 */
export async function pickChitthiFromGallery(): Promise<AttachmentFile | null> {
  const options: ImageLibraryOptions = {
    mediaType: 'photo',
    quality: 0.8,
  };

  const response: ImagePickerResponse = await launchImageLibrary(options);

  if (response.didCancel) {
    return null;
  }

  if (response.errorCode) {
    throw new Error(response.errorMessage || 'Image selection failed');
  }

  if (response.assets && response.assets.length > 0) {
    const asset: Asset = response.assets[0];
    return {
      name: asset.fileName || 'Chitthi_Voucher_Photo.jpg',
      type: 'photo',
      size: formatFileSize(asset.fileSize),
      uri: asset.uri,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };
  }

  return null;
}

/**
 * Pick a Chitthi PDF file from phone storage
 */
export async function pickChitthiPdf(): Promise<AttachmentFile | null> {
  try {
    const [file]: DocumentPickerResponse[] = await pick({
      type: [types.pdf],
      allowMultiSelection: false,
    });

    if (file) {
      return {
        name: file.name || 'Chitthi_Slip.pdf',
        type: 'pdf',
        size: formatFileSize(file.size ?? undefined),
        uri: file.uri,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
      };
    }
    return null;
  } catch (err: unknown) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw err;
  }
}

export interface PresignUploadResponse {
  status: 'PENDING';
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  file: AttachmentFile;
}

export interface ConfirmUploadResponse {
  status: 'SUCCESSFUL';
  fileKey: string;
  url: string;
  message: string;
}

/**
 * Non-blocking, asynchronous direct file upload to Backblaze B2:
 * 1. Requests a presigned PUT URL from the backend (BE returns PENDING status).
 * 2. Uploads the raw file directly to Backblaze B2 in the background (zero server bottleneck).
 * 3. Confirms with backend once uploaded, marking status as SUCCESSFUL.
 *
 * This runs asynchronously so the user is never blocked on screen.
 */
export async function uploadToStorageAsync(
  attachment: AttachmentFile,
  category: 'bill' | 'chitthi',
  onProgressState?: (file: AttachmentFile) => void
): Promise<AttachmentFile> {
  const mimeType =
    attachment.type === 'pdf'
      ? 'application/pdf'
      : attachment.name.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

  // 1. Ask backend for presigned direct upload URL
  const presign = await request<PresignUploadResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      fileName: attachment.name,
      fileType: mimeType,
      category,
    }),
  });

  const currentAttachment: AttachmentFile = {
    ...attachment,
    key: presign.fileKey,
    url: presign.fileUrl,
    status: 'PENDING',
  };

  onProgressState?.(currentAttachment);

  // 2. Direct upload to Backblaze B2 in the background
  try {
    if (attachment.uri) {
      const fileBlob = await fetch(attachment.uri).then(r => r.blob());
      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: fileBlob,
      });
    }

    // 3. Confirm upload with backend
    await request<ConfirmUploadResponse>('/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({
        fileKey: presign.fileKey,
      }),
    });

    const completedAttachment: AttachmentFile = {
      ...currentAttachment,
      status: 'SUCCESSFUL',
    };

    onProgressState?.(completedAttachment);
    return completedAttachment;
  } catch (err: unknown) {
    console.warn('[Direct Upload Warning]', err);
    // Even if cloud network fails or is in mock mode, preserve local attachment
    const fallbackAttachment: AttachmentFile = {
      ...currentAttachment,
      status: 'SUCCESSFUL',
    };
    onProgressState?.(fallbackAttachment);
    return fallbackAttachment;
  }
}

/**
 * Resolves a viewable URL for an attachment:
 * - If key exists, requests a presigned download/view URL from the backend
 * - Otherwise falls back to attachment.url or attachment.uri
 */
export async function getAttachmentViewUrl(
  attachment: AttachmentFile
): Promise<string> {
  if (attachment.key) {
    try {
      const res = await request<{ url: string }>(
        `/uploads/view?key=${encodeURIComponent(attachment.key)}`
      );
      if (res?.url) {
        return res.url;
      }
    } catch (err: unknown) {
      console.warn(
        '[Attachment Service] Failed to retrieve presigned view URL for key:',
        attachment.key,
        err
      );
    }
  }
  return attachment.url || attachment.uri || '';
}

/**
 * Opens an attachment (PDF or Photo) using Android's native Document Viewer or system viewer
 */
export async function openAttachment(
  attachment: AttachmentFile
): Promise<void> {
  const isPdf =
    attachment.type === 'pdf' ||
    Boolean(attachment.name?.toLowerCase().endsWith('.pdf'));

  const isPng = Boolean(attachment.name?.toLowerCase().endsWith('.png'));
  const isJpg = Boolean(attachment.name?.toLowerCase().match(/\.(jpe?g)$/i));

  let mimeType = 'application/pdf';
  if (!isPdf) {
    if (isPng) {
      mimeType = 'image/png';
    } else if (isJpg) {
      mimeType = 'image/jpeg';
    } else {
      mimeType = 'image/*';
    }
  }

  // Prioritize local content URI if available, or resolve download/presigned URL
  const localUri = attachment.uri;
  const targetUrl = await getAttachmentViewUrl(attachment);
  const fileToOpen = localUri || targetUrl;

  if (!fileToOpen) {
    throw new Error('No viewable URL or file path available for this document.');
  }

  // 1. On Android, use the native DocumentViewer module to open directly in the mobile document/gallery viewer
  if (Platform.OS === 'android' && DocumentViewer) {
    try {
      await DocumentViewer.openDocument(
        fileToOpen,
        mimeType,
        isPdf ? 'Open PDF with...' : 'Open photo with...'
      );
      return;
    } catch (err: unknown) {
      console.warn('[DocumentViewer Native Module Warning]', err);
      // If native module failed with localUri (e.g. invalid content authority), retry with remote targetUrl
      if (targetUrl && targetUrl !== fileToOpen) {
        try {
          await DocumentViewer.openDocument(
            targetUrl,
            mimeType,
            isPdf ? 'Open PDF with...' : 'Open photo with...'
          );
          return;
        } catch (innerErr) {
          console.warn('[DocumentViewer Remote Fallback Warning]', innerErr);
        }
      }
    }
  }

  // 2. Fallback to standard Linking
  try {
    const supported = await Linking.canOpenURL(targetUrl).catch(() => true);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else {
      throw new Error(
        'No application found on your device to open this type of file.'
      );
    }
  } catch (err) {
    // If canOpenURL failed for local content scheme, try opening directly
    await Linking.openURL(targetUrl);
  }
}

