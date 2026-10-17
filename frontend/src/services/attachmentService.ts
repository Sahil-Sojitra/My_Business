import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
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
import { AttachmentFile } from '../types/transaction';

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
    Alert.alert(
      'Camera Permission Required',
      'Please allow Camera permission in your phone settings to click physical Chitthi photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
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
