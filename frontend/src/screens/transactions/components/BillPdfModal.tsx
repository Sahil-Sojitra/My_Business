import React from 'react';
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../components/common/Button';
import { XIcon } from '../../../components/common/Icon';
import { styles } from '../TransactionFormStyles';

interface BillPdfModalProps {
  visible: boolean;
  onClose: () => void;
  onPickPdfNative: () => void;
  customPdfName: string;
  onCustomPdfNameChange: (val: string) => void;
  onAttachCustomPdf: () => void;
  onAttachSample: (name: string, size?: string) => void;
}

export const BillPdfModal: React.FC<BillPdfModalProps> = ({
  visible,
  onClose,
  onPickPdfNative,
  customPdfName,
  onCustomPdfNameChange,
  onAttachCustomPdf,
  onAttachSample,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialogCard}>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>Attach Bill PDF Document</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.dialogSubtitle}>
            Attach digital invoice or scanned bill PDF for proof
          </Text>

          {/* Option A: Device File Manager */}
          <TouchableOpacity
            style={[styles.dialogOptionBtn, styles.cameraOptionHighlight]}
            onPress={onPickPdfNative}
            activeOpacity={0.7}>
            <Text style={styles.dialogOptionEmoji}>📱</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Choose PDF from Phone Storage
              </Text>
              <Text style={styles.dialogOptionSub}>
                Opens device file manager to select real PDF
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option B: Enter Custom Document Name */}
          <View style={styles.dialogOptionBtn}>
            <Text style={styles.dialogOptionEmoji}>✏️</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Custom File / LR Slip Name
              </Text>
              <View style={styles.customFileNameRow}>
                <TextInput
                  style={styles.customFileNameInput}
                  value={customPdfName}
                  onChangeText={onCustomPdfNameChange}
                  placeholder="e.g. Lot409_Invoice.pdf"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
                <Button
                  title="Attach"
                  size="sm"
                  onPress={onAttachCustomPdf}
                  disabled={!customPdfName.trim()}
                />
              </View>
            </View>
          </View>

          {/* Option C: Quick Preset Invoices */}
          <TouchableOpacity
            style={styles.dialogOptionBtn}
            onPress={() => onAttachSample('Standard_Tax_Invoice.pdf', '480 KB')}
            activeOpacity={0.7}>
            <Text style={styles.dialogOptionEmoji}>📄</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Standard Tax Invoice (Sample)
              </Text>
              <Text style={styles.dialogOptionSub}>
                Pre-formatted 480 KB consignment bill
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
