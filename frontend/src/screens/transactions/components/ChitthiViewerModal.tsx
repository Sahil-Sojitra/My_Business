import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/common/Button';
import { XIcon } from '../../../components/common/Icon';
import { AttachmentFile } from '../../../types/transaction';
import { Company } from '../../../types/company';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../TransactionFormStyles';

interface ChitthiViewerModalProps {
  visible: boolean;
  onClose: () => void;
  chitthi: AttachmentFile | null;
  billNumber?: string;
  selectedCompany?: Company;
  amount: number;
  dalaliRate: number;
  dalaliAmount: string;
  date: string;
}

export const ChitthiViewerModal: React.FC<ChitthiViewerModalProps> = ({
  visible,
  onClose,
  chitthi,
  billNumber,
  selectedCompany,
  amount,
  dalaliRate,
  dalaliAmount,
  date,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.viewerCard}>
          <View style={styles.dialogHeader}>
            <View>
              <Text style={styles.dialogTitle}>Chitthi Voucher Preview</Text>
              <Text style={styles.dialogSubtitle}>
                {chitthi?.name || 'Attached Slip'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Simulated Realistic Indian Mandi Chitthi Slip Rendering */}
          <View style={styles.chitthiPaper}>
            <View style={styles.chitthiPaperHeader}>
              <Text style={styles.chitthiPaperTitle}>
                BROKER CONSIGNMENT CHITTHI
              </Text>
              <Text style={styles.chitthiPaperNo}>
                VOUCHER #{billNumber || 'CH-409'}
              </Text>
            </View>
            <View style={styles.chitthiDottedDivider} />

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Buyer Firm:</Text>
              <Text style={styles.chitthiMetaVal}>
                {selectedCompany?.name || 'Client'}
              </Text>
            </View>

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Bill Turnover:</Text>
              <Text style={styles.chitthiMetaVal}>
                {formatCurrency(amount)}
              </Text>
            </View>

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Dalali Rate:</Text>
              <Text style={styles.chitthiMetaVal}>{dalaliRate}%</Text>
            </View>

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Dalali Amount:</Text>
              <Text style={styles.chitthiDalaliGreen}>
                {formatCurrency(parseFloat(dalaliAmount) || 0)}
              </Text>
            </View>

            <View style={styles.chitthiDottedDivider} />

            <View style={styles.chitthiStampBox}>
              <Text style={styles.chitthiStampText}>
                VERIFIED & DELIVERED
              </Text>
              <Text style={styles.chitthiStampDate}>{date}</Text>
            </View>
          </View>

          <Button
            title="Close Preview"
            variant="outline"
            size="md"
            onPress={onClose}
            style={styles.viewerCloseBtn}
          />
        </View>
      </View>
    </Modal>
  );
};
