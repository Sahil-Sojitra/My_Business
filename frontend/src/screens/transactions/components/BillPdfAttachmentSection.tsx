import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { XIcon } from '../../../components/common/Icon';
import { AttachmentFile } from '../../../types/transaction';
import { styles } from '../TransactionFormStyles';

interface BillPdfAttachmentSectionProps {
  billPdf: AttachmentFile | null;
  onAttachPress: () => void;
  onPreviewPress?: () => void;
  onRemove: () => void;
}

export const BillPdfAttachmentSection: React.FC<BillPdfAttachmentSectionProps> = ({
  billPdf,
  onAttachPress,
  onPreviewPress,
  onRemove,
}) => {
  return (
    <View style={styles.attachmentSection}>
      <View style={styles.chitthiHeaderRow}>
        <Text style={styles.attachmentLabel}>Bill / Invoice PDF Document</Text>
        {billPdf && onPreviewPress ? (
          <TouchableOpacity onPress={onPreviewPress} activeOpacity={0.7}>
            <Text style={styles.viewSlipLink}>👁️ Preview PDF</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {billPdf ? (
        <TouchableOpacity
          style={styles.attachedCard}
          onPress={onPreviewPress}
          activeOpacity={onPreviewPress ? 0.8 : 1}>
          <View style={styles.pdfIconBadge}>
            <Text style={styles.pdfIconBadgeText}>PDF</Text>
          </View>
          <View style={styles.attachedInfo}>
            <Text style={styles.attachedName} numberOfLines={1}>
              {billPdf.name}
            </Text>
            <Text style={styles.attachedMeta}>
              {billPdf.size || 'PDF Document'} •{' '}
              {billPdf.status === 'PENDING' ? 'Syncing to Cloud...' : 'Cloud Synced'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeAttachedBtn}
            onPress={onRemove}
            activeOpacity={0.7}>
            <XIcon size={14} color="#64748B" />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.uploadDashedBox}
          onPress={onAttachPress}
          activeOpacity={0.7}>
          <View style={styles.uploadIconCircle}>
            <Text style={styles.uploadIconEmoji}>📄</Text>
          </View>
          <View style={styles.uploadTextWrap}>
            <Text style={styles.uploadPrimaryText}>Attach Bill PDF</Text>
            <Text style={styles.uploadSubText}>
              Attach digital invoice or scanned bill PDF
            </Text>
          </View>
          <View style={styles.uploadActionBtn}>
            <Text style={styles.uploadActionBtnText}>+ PDF</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
