import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/common/Button';
import { XIcon } from '../../../components/common/Icon';
import { Transaction } from '../../../types/transaction';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { styles } from '../TransactionDetailsStyles';

interface ChitthiPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  bill: Transaction | null;
  dalaliRate: number;
  dalaliAmount: number;
}

export const ChitthiPreviewModal: React.FC<ChitthiPreviewModalProps> = ({
  visible,
  onClose,
  bill,
  dalaliRate,
  dalaliAmount,
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
              <Text style={styles.dialogTitle}>Chitthi Delivery Voucher</Text>
              <Text style={styles.dialogSubtitle}>
                {bill?.chitthi?.name || 'Attached Slip'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Simulated Indian Mandi Consignment Slip */}
          <View style={styles.chitthiPaper}>
            <View style={styles.chitthiPaperHeader}>
              <Text style={styles.chitthiPaperTitle}>
                CONSIGNMENT DELIVERY CHITTHI
              </Text>
              <Text style={styles.chitthiPaperNo}>
                BILL REF: {bill?.billNumber || 'UNASSIGNED'}
              </Text>
            </View>
            <View style={styles.chitthiDottedDivider} />

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Buyer Client:</Text>
              <Text style={styles.chitthiMetaVal}>{bill?.companyName}</Text>
            </View>

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Bill Turnover:</Text>
              <Text style={styles.chitthiMetaVal}>
                {bill ? formatCurrency(bill.amount) : ''}
              </Text>
            </View>

            <View style={styles.chitthiMetaRow}>
              <Text style={styles.chitthiMetaLabel}>Brokerage Dalali:</Text>
              <Text style={styles.chitthiDalaliGreen}>
                {bill ? formatCurrency(dalaliAmount) : ''} ({dalaliRate}%)
              </Text>
            </View>

            <View style={styles.chitthiDottedDivider} />

            <View style={styles.chitthiStampBox}>
              <Text style={styles.chitthiStampText}>
                VERIFIED & DELIVERED
              </Text>
              <Text style={styles.chitthiStampDate}>
                {bill ? formatDate(bill.date) : ''}
              </Text>
            </View>
          </View>

          <Button
            title="Close Voucher"
            variant="outline"
            size="md"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};
