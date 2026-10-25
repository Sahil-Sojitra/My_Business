import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { AttachmentViewerModal } from '../../components/common/AttachmentViewerModal';
import { Button } from '../../components/common/Button';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { CheckIcon } from '../../components/common/Icon';
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
import { formatDate } from '../../utils/formatters';

export const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const transactionId = navigation.params?.transactionId as string | undefined;

  const [bill, setBill] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [settling, setSettling] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopening, setReopening] = useState<boolean>(false);
  const [showOutstandingModal, setShowOutstandingModal] = useState<boolean>(false);
  const [markingOutstanding, setMarkingOutstanding] = useState<boolean>(false);

  // Photo viewer state (in-app viewer for photos only)
  const [activePhoto, setActivePhoto] = useState<AttachmentFile | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState<boolean>(false);

  const handleMarkOutstanding = async () => {
    if (!transactionId) return;
    setMarkingOutstanding(true);
    try {
      const updated = await transactionService.markOutstanding(transactionId);
      setBill(updated);
      setShowOutstandingModal(false);
      alertService.showSuccess(
        'Bill Marked as Outstanding',
        'This bill is now marked as outstanding (ready to settle).'
      );
    } catch (err: unknown) {
      alertService.showError(
        'Failed to Update Bill',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setMarkingOutstanding(false);
    }
  };

  const handleSettle = async () => {
    if (!transactionId) return;
    setSettling(true);
    try {
      const updated = await transactionService.settleBill(transactionId);
      setBill(updated);
      setShowSettleModal(false);
      alertService.showSuccess(
        'Bill Settled Successfully!',
        'This bill status is updated to Settled and moved to the Settled tab.'
      );
    } catch (err: unknown) {
      alertService.showError(
        'Failed to Settle Bill',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setSettling(false);
    }
  };

  const handleReopen = async () => {
    if (!transactionId) return;
    setReopening(true);
    try {
      const updated = await transactionService.reopenBill(transactionId);
      setBill(updated);
      setShowReopenModal(false);
      alertService.showSuccess(
        'Bill Reopened',
        'This bill has been returned to active pending status.'
      );
    } catch (err: unknown) {
      alertService.showError(
        'Failed to Reopen Bill',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setReopening(false);
    }
  };

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
      if (data) {
        const todayIso = new Date().toISOString().split('T')[0];
        if (data.status === 'PENDING' && data.dueDate && data.dueDate < todayIso) {
          data.status = 'OVERDUE';
        }
      }
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

        {/* Settled Confirmation Banner if already settled */}
        {bill.status === 'PAID' ? (
          <View style={styles.settledBanner}>
            <View style={styles.settledIconCircle}>
              <CheckIcon size={20} color="#15803D" strokeWidth={2.6} />
            </View>
            <View style={styles.settledBannerTextCol}>
              <Text style={styles.settledBannerTitle}>Bill Settled</Text>
              <Text style={styles.settledBannerSubtitle}>
                Payment and Dalali brokerage marked complete.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Outstanding (Ready to Settle) Banner */}
        {bill.status === 'OUTSTANDING' ? (
          <View style={styles.outstandingBanner}>
            <View style={styles.outstandingIconCircle}>
              <Text style={styles.outstandingIconText}>⏳</Text>
            </View>
            <View style={styles.settledBannerTextCol}>
              <Text style={styles.outstandingBannerTitle}>
                Bill Outstanding (Ready to Settle)
              </Text>
              <Text style={styles.outstandingBannerSubtitle}>
                This bill is in the final step before settlement. Ready to mark as settled once payment is cleared.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Overdue Warning Banner */}
        {bill.status === 'OVERDUE' ? (
          <View style={styles.overdueBanner}>
            <View style={styles.overdueIconCircle}>
              <Text style={styles.overdueIconText}>⚠️</Text>
            </View>
            <View style={styles.overdueBannerTextCol}>
              <Text style={styles.overdueBannerTitle}>Payment Overdue</Text>
              <Text style={styles.overdueBannerSubtitle}>
                {bill.dueDate
                  ? `Payment deadline was ${formatDate(bill.dueDate)}. Please follow up with buyer firm.`
                  : 'Credit deadline has passed.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          {bill.status === 'PENDING' || bill.status === 'OVERDUE' ? (
            <TouchableOpacity
              style={styles.outstandingBtn}
              onPress={() => setShowOutstandingModal(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Mark bill as outstanding">
              <Text style={styles.outstandingBtnText}>⏳ Mark as Outstanding</Text>
            </TouchableOpacity>
          ) : null}

          {bill.status !== 'PAID' ? (
            <TouchableOpacity
              style={styles.settleBtn}
              onPress={() => setShowSettleModal(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Settle bill">
              <CheckIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
              <Text style={styles.settleBtnText}>Settle Bill</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Reopen as Active Bill"
              onPress={() => setShowReopenModal(true)}
              variant="outline"
              size="md"
              style={styles.reopenBtn}
            />
          )}

          {bill.status === 'OUTSTANDING' ? (
            <Button
              title="Return to Pending Status"
              onPress={() => setShowReopenModal(true)}
              variant="outline"
              size="md"
              style={styles.reopenBtn}
            />
          ) : null}

          <Button
            title="Delete Bill"
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            size="md"
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showOutstandingModal}
        title="Mark as Outstanding?"
        message="Mark this bill as Outstanding (ready to settle)? This indicates payment is confirmed and ready for final settlement."
        confirmText="Mark Outstanding"
        confirmVariant="primary"
        loading={markingOutstanding}
        onConfirm={handleMarkOutstanding}
        onCancel={() => setShowOutstandingModal(false)}
      />

      <ConfirmModal
        visible={showSettleModal}
        title="Settle Bill?"
        message={`Are you sure you want to mark this bill as settled? The bill status will be updated to Settled and moved to the Settled tab.`}
        confirmText="Mark as Settled"
        confirmVariant="success"
        destructive={false}
        loading={settling}
        onConfirm={handleSettle}
        onCancel={() => setShowSettleModal(false)}
      />

      <ConfirmModal
        visible={showReopenModal}
        title="Reopen Bill?"
        message="Are you sure you want to return this bill to active pending status?"
        confirmText="Return to Pending"
        loading={reopening}
        onConfirm={handleReopen}
        onCancel={() => setShowReopenModal(false)}
      />

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
