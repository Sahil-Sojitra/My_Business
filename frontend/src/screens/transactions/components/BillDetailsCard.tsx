import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { ChevronRight } from '../../../components/common/Icon';
import { Transaction } from '../../../types/transaction';
import { formatDate } from '../../../utils/formatters';
import { styles } from '../TransactionDetailsStyles';

interface BillDetailsCardProps {
  bill: Transaction;
  onCompanyPress: () => void;
  onChitthiPreviewPress: () => void;
  onBillPdfPress?: () => void;
}

export const BillDetailsCard: React.FC<BillDetailsCardProps> = ({
  bill,
  onCompanyPress,
  onChitthiPreviewPress,
  onBillPdfPress,
}) => {
  return (
    <Card style={styles.detailsCard}>
      <Text style={styles.sectionHeading}>Bill & Buyer Information</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Buyer Firm / Client</Text>
        <TouchableOpacity
          style={styles.companyLinkRow}
          onPress={onCompanyPress}
          activeOpacity={0.7}>
          <Text style={styles.companyLink}>{bill.companyName}</Text>
          <ChevronRight size={14} color="#2563EB" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Invoice / Bill Number</Text>
        <Text style={styles.infoValue}>
          {bill.billNumber || 'None specified'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Bill Date</Text>
        <Text style={styles.infoValue}>{formatDate(bill.date)}</Text>
      </View>

      {bill.dueDate ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Agreed Due Date</Text>
          <Text style={styles.infoValue}>{formatDate(bill.dueDate)}</Text>
        </View>
      ) : null}

      {bill.description ? (
        <View style={styles.descContainer}>
          <Text style={styles.descLabel}>Goods & Consignment Notes</Text>
          <Text style={styles.descText}>{bill.description}</Text>
        </View>
      ) : null}

      {/* Attached Bill PDF Document */}
      {bill.billPdf ? (
        <View style={styles.attachmentBox}>
          <Text style={styles.attachmentSectionHeading}>
            Attached Bill Document
          </Text>
          <TouchableOpacity
            style={styles.attachCard}
            onPress={onBillPdfPress}
            activeOpacity={0.8}>
            <View style={styles.attachPdfBadge}>
              <Text style={styles.attachPdfBadgeText}>PDF</Text>
            </View>
            <View style={styles.attachInfo}>
              <Text style={styles.attachName} numberOfLines={1}>
                {bill.billPdf.name}
              </Text>
              <Text style={styles.attachMeta}>
                Invoice PDF (Tap to Open) • {bill.billPdf.size || 'Attached'}
              </Text>
            </View>
            <ChevronRight size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Attached Chitthi Delivery Slip / Voucher */}
      {bill.chitthi ? (
        <View style={styles.attachmentBox}>
          <Text style={styles.attachmentSectionHeading}>
            Attached Chitthi (Voucher)
          </Text>
          <TouchableOpacity
            style={[
              styles.attachCard,
              bill.chitthi.type === 'photo' && styles.attachCardPhoto,
            ]}
            onPress={onChitthiPreviewPress}
            activeOpacity={0.8}>
            <View
              style={
                bill.chitthi.type === 'photo'
                  ? styles.attachBadgePhoto
                  : styles.attachPdfBadge
              }>
              <Text
                style={
                  bill.chitthi.type === 'photo'
                    ? styles.attachBadgePhotoText
                    : styles.attachPdfBadgeText
                }>
                {bill.chitthi.type === 'photo' ? '📷 PHOTO' : '📄 PDF'}
              </Text>
            </View>
            <View style={styles.attachInfo}>
              <Text style={styles.attachName} numberOfLines={1}>
                {bill.chitthi.name}
              </Text>
              <Text style={styles.attachMeta}>
                {bill.chitthi.type === 'photo'
                  ? 'Physical Slip Photo (Tap to Open)'
                  : 'Chitthi PDF (Tap to Open)'}{' '}
                • {bill.chitthi.size || 'Attached'}
              </Text>
            </View>
            <ChevronRight size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      ) : null}
    </Card>
  );
};
