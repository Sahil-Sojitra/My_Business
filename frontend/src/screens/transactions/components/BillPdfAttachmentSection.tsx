import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { XIcon } from '../../../components/common/Icon';
import { AttachmentFile } from '../../../types/transaction';
import { styles } from '../TransactionFormStyles';

interface BillPdfAttachmentSectionProps {
  billPdf: AttachmentFile | null;
  onAttachPress: () => void;
  onRemove: () => void;
}

export const BillPdfAttachmentSection: React.FC<BillPdfAttachmentSectionProps> = ({
  billPdf,
  onAttachPress,
  onRemove,
}) => {
  return (
    <View style={styles.attachmentSection}>
      <Text style={styles.attachmentLabel}>Bill / Invoice PDF Document</Text>
      {billPdf ? (
        <View style={styles.attachedCard}>
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
        </View>
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
