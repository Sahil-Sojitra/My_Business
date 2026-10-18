import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { XIcon } from '../../../components/common/Icon';
import { styles } from '../TransactionFormStyles';

interface ChitthiModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraSelect: () => void;
  onGallerySelect: () => void;
  onPdfSelect: () => void;
}

export const ChitthiModal: React.FC<ChitthiModalProps> = ({
  visible,
  onClose,
  onCameraSelect,
  onGallerySelect,
  onPdfSelect,
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
            <Text style={styles.dialogTitle}>Attach Chitthi (Delivery Slip)</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.dialogSubtitle}>
            Attach signed delivery voucher or physical mandi note
          </Text>

          {/* Option A: Physical Camera Snap */}
          <TouchableOpacity
            style={[styles.dialogOptionBtn, styles.cameraOptionHighlight]}
            onPress={onCameraSelect}
            activeOpacity={0.7}>
            <Text style={styles.dialogOptionEmoji}>📸</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Take Photo with Camera
              </Text>
              <Text style={styles.dialogOptionSub}>
                Snap physical paper chitthi right now
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option B: Gallery */}
          <TouchableOpacity
            style={styles.dialogOptionBtn}
            onPress={onGallerySelect}
            activeOpacity={0.7}>
            <Text style={styles.dialogOptionEmoji}>🖼️</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Choose from Photo Gallery
              </Text>
              <Text style={styles.dialogOptionSub}>
                Select saved voucher photo
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option C: PDF Upload */}
          <TouchableOpacity
            style={styles.dialogOptionBtn}
            onPress={onPdfSelect}
            activeOpacity={0.7}>
            <Text style={styles.dialogOptionEmoji}>📄</Text>
            <View style={styles.dialogOptionTextWrap}>
              <Text style={styles.dialogOptionTitle}>
                Select Chitthi PDF from Phone
              </Text>
              <Text style={styles.dialogOptionSub}>
                Open device file manager to choose a PDF voucher
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
