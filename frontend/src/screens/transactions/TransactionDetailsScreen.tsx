import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { AttachmentViewerModal } from '../../components/common/AttachmentViewerModal';
import { Button } from '../../components/common/Button';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { alertService } from '../../context/AlertContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { transactionService } from '../../services';
import { openAttachment } from '../../services/attachmentService';
import { AttachmentFile, Transaction } from '../../types/transaction';
import { BillDetailsCard } from './components/BillDetailsCard';
import { BrokerageSummaryCard } from './components/BrokerageSummaryCard';
import { HeroDalaliCard } from './components/HeroDalaliCard';
import { styles } from './TransactionDetailsStyles';

export const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const transactionId = navigation.params?.transactionId as string | undefined;

  const [bill, setBill] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Photo viewer state (photos only)
  const [activePhoto, setActivePhoto] = useState<AttachmentFile | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState<boolean>(false);

  const handleOpenPdf = async (file: AttachmentFile) => {
    try {
      alertService.showToast('info', 'Opening PDF...', file.name);
      await openAttachment(file);
    } catch (err: unknown) {
      alertService.showError(
        'Could Not Open PDF',
        err instanceof Error ? err.message : 'No application found to view this PDF.'
      );
    }
  };

  const loadBill = useCallback(async () => {
    if (!transactionId) {
      setLoading(false);
      return;
    }
    try {
      const data = await transactionService.getById(transactionId);
      setBill(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const handleDelete = async () => {
    if (!transactionId) {
      return;
    }
    setDeleting(true);
    try {
      await transactionService.delete(transactionId);
      setShowDeleteModal(false);
      alertService.showSuccess(
        'Bill Deleted',
        'Bill record has been deleted successfully.'
      );
      navigation.goBack();
    } catch (err) {
      alertService.showError(
        'Failed to Delete Bill',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading bill & interest calculations..." />;
  }

  if (!bill) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Bill Details" showBack={true} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Bill record not found</Text>
          <Button
            title="Back to Bills"
            onPress={() => navigation.navigate('TransactionList')}
            style={styles.backBtn}
          />
        </View>
      </View>
    );
  }

  // Calculate Dalali commission on bill amount
  const dalaliRate =
    bill.dalaliRate ??
    bill.monthlyInterestRate ??
    (bill.interestRate ? bill.interestRate / 12 : 1.5);
  const dalaliAmount =
    bill.dalaliAmount ?? (bill.amount * dalaliRate) / 100;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Bill Details"
        subtitle={bill.billNumber || 'Invoice Details'}
        showBack={true}
        rightAction={{
          label: 'Edit',
          onPress: () =>
            navigation.navigate('TransactionForm', {
              transactionId: bill.id,
            }),
          variant: 'primary',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dalali Commission Hero Card */}
        <HeroDalaliCard
          bill={bill}
          dalaliRate={dalaliRate}
          dalaliAmount={dalaliAmount}
        />

        {/* Dalali Brokerage Summary Card */}
        <BrokerageSummaryCard
          amount={bill.amount}
          dalaliRate={dalaliRate}
          dalaliAmount={dalaliAmount}
        />

        {/* Bill & Client Details Card */}
        <BillDetailsCard
          bill={bill}
          onCompanyPress={() =>
            navigation.navigate('CompanyDetails', {
              companyId: bill.companyId,
            })
          }
          onBillPdfPress={() => {
            if (bill.billPdf) {
              handleOpenPdf(bill.billPdf);
            }
          }}
          onChitthiPreviewPress={() => {
            if (bill.chitthi) {
              if (bill.chitthi.type === 'pdf') {
                handleOpenPdf(bill.chitthi);
              } else {
                setActivePhoto(bill.chitthi);
                setShowPhotoViewer(true);
              }
            }
          }}
        />

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            title="Delete Bill"
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            size="md"
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Bill?"
        message="Are you sure you want to remove this bill and its interest tracking? This cannot be undone."
        confirmText="Delete"
        destructive={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Clean Fullscreen Photo Viewer Modal */}
      <AttachmentViewerModal
        visible={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        attachment={activePhoto}
        title="Chitthi Delivery Photo"
      />
    </View>
  );
};
