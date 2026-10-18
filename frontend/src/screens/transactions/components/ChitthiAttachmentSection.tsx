import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { XIcon } from '../../../components/common/Icon';
import { AttachmentFile } from '../../../types/transaction';
import { styles } from '../TransactionFormStyles';

interface ChitthiAttachmentSectionProps {
  chitthi: AttachmentFile | null;
  onPreviewPress: () => void;
  onCameraPress: () => void;
  onUploadPress: () => void;
  onRemove: () => void;
}

export const ChitthiAttachmentSection: React.FC<ChitthiAttachmentSectionProps> = ({
  chitthi,
  onPreviewPress,
  onCameraPress,
  onUploadPress,
  onRemove,
}) => {
  return (
    <View style={styles.attachmentSection}>
      <View style={styles.chitthiHeaderRow}>
        <View>
          <Text style={styles.attachmentLabel}>
            Chitthi (Delivery Slip / Voucher)
          </Text>
          <Text style={styles.chitthiSubtitle}>
            Physical consignment receipt via Camera or PDF
          </Text>
        </View>
        {chitthi ? (
          <TouchableOpacity onPress={onPreviewPress} activeOpacity={0.7}>
            <Text style={styles.viewSlipLink}>👁️ Preview</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {chitthi ? (
        <View
          style={[
            styles.attachedCard,
            chitthi.type === 'photo' && styles.attachedCardPhoto,
          ]}>
          <View
            style={[
              styles.chitthiTypeBadge,
              chitthi.type === 'photo'
                ? styles.chitthiBadgePhoto
                : styles.chitthiBadgePdf,
            ]}>
            <Text style={styles.chitthiTypeBadgeText}>
              {chitthi.type === 'photo' ? '📷 PHOTO' : '📄 PDF'}
            </Text>
          </View>
          <View style={styles.attachedInfo}>
            <Text style={styles.attachedName} numberOfLines={1}>
              {chitthi.name}
            </Text>
            <Text style={styles.attachedMeta}>
              {chitthi.size || 'Attachment'} •{' '}
              {chitthi.status === 'PENDING' ? 'Syncing to Cloud...' : 'Cloud Synced'}
            </Text>
          </View>
          <View style={styles.chitthiActionGroup}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={onUploadPress}
              activeOpacity={0.7}>
              <Text style={styles.retakeBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeAttachedBtn}
              onPress={onRemove}
              activeOpacity={0.7}>
              <XIcon size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.chitthiDualActions}>
          <TouchableOpacity
            style={styles.chitthiCameraBtn}
            onPress={onCameraPress}
            activeOpacity={0.8}>
            <Text style={styles.chitthiActionIcon}>📷</Text>
            <Text style={styles.chitthiCameraTitle}>Click Photo</Text>
            <Text style={styles.chitthiActionSub}>
              Snap chitthi via Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chitthiUploadBtn}
            onPress={onUploadPress}
            activeOpacity={0.8}>
            <Text style={styles.chitthiActionIcon}>📁</Text>
            <Text style={styles.chitthiUploadTitle}>Upload PDF</Text>
            <Text style={styles.chitthiActionSub}>
              Choose PDF or Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
