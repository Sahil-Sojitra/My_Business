import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alertService } from '../../context/AlertContext';
import {
  getAttachmentViewUrl,
  openAttachment,
} from '../../services/attachmentService';
import { AttachmentFile } from '../../types/transaction';
import { formatDate } from '../../utils/formatters';
import { CheckIcon, XIcon } from './Icon';

interface AttachmentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  attachment: AttachmentFile | null;
  title?: string;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  visible,
  onClose,
  attachment,
  title,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [loadingUrl, setLoadingUrl] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [openingExternal, setOpeningExternal] = useState<boolean>(false);

  const isPhoto =
    attachment?.type === 'photo' ||
    Boolean(attachment?.name?.match(/\.(jpe?g|png|webp|heic)$/i));

  const modalTitle =
    title || (isPhoto ? 'Chitthi Photo' : 'Document');

  // Resolve presigned URL or direct URL when attachment changes
  useEffect(() => {
    if (!visible || !attachment) {
      setResolvedUrl('');
      setImageError(false);
      setImageLoading(true);
      return;
    }

    // If it's a PDF accidentally opened here, trigger direct open and close
    if (!isPhoto) {
      openAttachment(attachment).catch(err => {
        alertService.showError(
          'Could Not Open Document',
          err instanceof Error ? err.message : 'Failed to launch document viewer'
        );
      });
      onClose();
      return;
    }

    let isMounted = true;
    setLoadingUrl(true);
    setImageError(false);
    setImageLoading(true);

    getAttachmentViewUrl(attachment)
      .then(url => {
        if (isMounted) {
          setResolvedUrl(url);
          setLoadingUrl(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedUrl(attachment.url || attachment.uri || '');
          setLoadingUrl(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, attachment, isPhoto, onClose]);

  const handleOpenExternal = async () => {
    if (!attachment) return;
    setOpeningExternal(true);
    try {
      await openAttachment(attachment);
    } catch (err: unknown) {
      alertService.showError(
        'Could Not Open Photo',
        err instanceof Error
          ? err.message
          : 'Unable to open image in system viewer.'
      );
    } finally {
      setOpeningExternal(false);
    }
  };

  if (!visible || !attachment) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <StatusBar barStyle="light-content" />

        {/* Top Floating Control Bar */}
        <View
          style={[
            styles.topBar,
            { paddingTop: Math.max(insets.top, 16) + 6 },
          ]}>
          <View style={styles.topBarInfo}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {modalTitle}
            </Text>
            <Text style={styles.topBarSub} numberOfLines={1}>
              {attachment.name}
            </Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={handleOpenExternal}
              disabled={openingExternal}
              activeOpacity={0.75}>
              {openingExternal ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionPillText}>Open in Gallery</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeCircleBtn}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <XIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Zoomable Image View */}
        <View style={styles.imageContainer}>
          {loadingUrl ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          ) : resolvedUrl && !imageError ? (
            <ScrollView
              style={styles.scrollZoom}
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}>
              <Image
                source={{ uri: resolvedUrl }}
                style={{
                  width: windowWidth,
                  height: windowHeight * 0.76,
                }}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading ? (
                <View style={styles.spinnerCenter}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              ) : null}
            </ScrollView>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.fallbackEmoji}>📷</Text>
              <Text style={styles.fallbackTitle}>
                {attachment.name || 'Photo Attachment'}
              </Text>
              <Text style={styles.fallbackSub}>
                Could not render preview directly.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleOpenExternal}
                activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>
                  Open in Phone Gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Minimal Bottom Info Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}>
          <View style={styles.bottomMetaLeft}>
            <Text style={styles.bottomMetaText}>
              {attachment.size || 'Photo'}
              {attachment.date ? ` • ${formatDate(attachment.date)}` : ''}
            </Text>
            <View style={styles.bottomBadge}>
              <CheckIcon size={11} color="#4ADE80" strokeWidth={2.4} />
              <Text style={styles.bottomBadgeText}>
                {attachment.status === 'PENDING' ? 'Local' : 'Cloud Synced'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bottomClosePill}
            onPress={onClose}
            activeOpacity={0.75}>
            <Text style={styles.bottomClosePillText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 10,
  },
  topBarInfo: {
    flex: 1,
    paddingRight: 10,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topBarSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  scrollZoom: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  fallbackEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 10,
  },
  bottomMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomMetaText: {
    fontSize: 12.5,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  bottomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  bottomBadgeText: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '600',
  },
  bottomClosePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bottomClosePillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
