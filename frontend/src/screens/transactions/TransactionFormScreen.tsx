import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { BillPdfAttachmentSection } from './components/BillPdfAttachmentSection';
import { BillPdfModal } from './components/BillPdfModal';
import { ChitthiAttachmentSection } from './components/ChitthiAttachmentSection';
import { ChitthiModal } from './components/ChitthiModal';
import { ChitthiViewerModal } from './components/ChitthiViewerModal';
import { CompanyPickerModal } from './components/CompanyPickerModal';
import { SelectedCompanyCard } from './components/SelectedCompanyCard';
import { useTransactionForm } from './hooks/useTransactionForm';
import { styles } from './TransactionFormStyles';

export const TransactionFormScreen: React.FC = () => {
  const form = useTransactionForm();

  if (form.loadingInitial) {
    return <LoadingSpinner message="Loading bill form..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={form.isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Record bill, Dalali & attachments"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Buyer Firm / Client Picker */}
          <SelectedCompanyCard
            companiesCount={form.companies.length}
            selectedCompany={form.selectedCompany}
            error={form.errors.company}
            onPress={() => form.setShowCompanyModal(true)}
          />

          {/* Bill Amount */}
          <Input
            label="Bill Amount (₹) *"
            value={form.amount}
            onChangeText={val => {
              form.setAmount(val);
              form.recalculateDalali(val, form.dalaliRate);
              if (form.errors.amount) {
                form.setErrors(prev => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder="e.g. 145000"
            keyboardType="numeric"
            error={form.errors.amount}
            required
            style={styles.inputMargin}
          />

          {/* Dalali / Commission Percentage User Input */}
          <View style={styles.dalaliInputWrapper}>
            <Input
              label="Dalali / Commission Rate (%) *"
              value={form.dalaliRate}
              onChangeText={val => {
                form.setDalaliRate(val);
                form.recalculateDalali(form.amount, val);
                if (form.errors.dalaliRate) {
                  form.setErrors(prev => ({
                    ...prev,
                    dalaliRate: undefined,
                  }));
                }
              }}
              placeholder="e.g. 1.0, 1.5, 2.0"
              keyboardType="numeric"
              error={form.errors.dalaliRate}
              helperText="Broker commission percentage on this bill amount"
              required
            />

            {/* Quick preset pills for non-tech broker convenience */}
            <View style={styles.presetsRow}>
              <Text style={styles.presetLabel}>Quick Select:</Text>
              {['1.0', '1.5', '2.0', '2.5', '3.0'].map(pRate => (
                <TouchableOpacity
                  key={pRate}
                  onPress={() => {
                    form.setDalaliRate(pRate);
                    form.recalculateDalali(form.amount, pRate);
                    if (form.errors.dalaliRate) {
                      form.setErrors(prev => ({
                        ...prev,
                        dalaliRate: undefined,
                      }));
                    }
                  }}
                  style={[
                    styles.presetPill,
                    form.dalaliRate === pRate && styles.presetPillActive,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.presetPillText,
                      form.dalaliRate === pRate && styles.presetPillTextActive,
                    ]}>
                    {pRate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dalali Amount Section (Auto-Calculated) */}
          <View style={styles.dalaliGreenSection}>
            <Text style={styles.dalaliGreenLabel}>
              Dalali Amount (Brokerage) (₹) *
            </Text>
            <View style={styles.dalaliGreenInputWrapper}>
              <Text style={styles.dalaliGreenSymbol}>₹</Text>
              <TextInput
                style={styles.dalaliGreenInput}
                value={form.dalaliAmount}
                onChangeText={form.setDalaliAmount}
                placeholder="0.00"
                placeholderTextColor="#15803D"
                keyboardType="numeric"
              />
              <View style={styles.dalaliAutoBadge}>
                <Text style={styles.dalaliAutoBadgeText}>
                  {form.numDalaliRate > 0
                    ? `${form.numDalaliRate}% auto`
                    : 'Auto'}
                </Text>
              </View>
            </View>
            <Text style={styles.dalaliGreenHelper}>
              {form.numAmt > 0 && form.numDalaliRate > 0
                ? `Auto-calculated: ${form.numDalaliRate}% of ${formatCurrency(
                    form.numAmt
                  )}`
                : 'Calculates automatically from bill amount & Dalali %'}
            </Text>
          </View>

          {/* Bill / Invoice Number */}
          <Input
            label="Bill / Invoice Number"
            value={form.billNumber}
            onChangeText={form.setBillNumber}
            placeholder="e.g. INV-2026-104 or LOT-409"
            autoCapitalize="characters"
          />

          {/* Bill PDF File Attachment */}
          <BillPdfAttachmentSection
            billPdf={form.billPdf}
            onAttachPress={() => form.setShowBillPdfModal(true)}
            onRemove={() => form.setBillPdf(null)}
          />

          {/* Chitthi Delivery Slip / Voucher Attachment */}
          <ChitthiAttachmentSection
            chitthi={form.chitthi}
            onPreviewPress={() => form.setShowChitthiViewer(true)}
            onCameraPress={form.handleAttachChitthiCamera}
            onUploadPress={() => form.setShowChitthiModal(true)}
            onRemove={() => form.setChitthi(null)}
          />

          {/* Bill Date */}
          <Input
            label="Bill Date (YYYY-MM-DD) *"
            value={form.date}
            onChangeText={val => {
              form.setDate(val);
              if (form.errors.date) {
                form.setErrors(prev => ({ ...prev, date: undefined }));
              }
            }}
            placeholder="2026-10-13"
            error={form.errors.date}
            required
          />

          {/* Payment Due Date */}
          <Input
            label="Payment Due Date (YYYY-MM-DD)"
            value={form.dueDate}
            onChangeText={form.setDueDate}
            placeholder="2026-11-13"
            helperText="Settlement deadline (closest due date appears first on firm list)"
          />

          {/* Description */}
          <Input
            label="Consignment / Deal Notes"
            value={form.description}
            onChangeText={form.setDescription}
            placeholder="Yarn counts, meter quantity, transport LR number..."
            multiline
            numberOfLines={3}
            style={styles.inputMargin}
          />

          <Button
            title={
              form.isEditing
                ? 'Save Changes'
                : 'Record Bill (Status: Pending)'
            }
            onPress={form.handleSave}
            loading={form.saving}
            size="lg"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>

      {/* 1. Modal: Searchable Company Selector */}
      <CompanyPickerModal
        visible={form.showCompanyModal}
        onClose={() => form.setShowCompanyModal(false)}
        companies={form.companies}
        selectedCompanyId={form.selectedCompanyId}
        onSelectCompany={form.setSelectedCompanyId}
        searchQuery={form.companySearch}
        onSearchChange={form.setCompanySearch}
        onAddNewCompany={() => {
          form.setShowCompanyModal(false);
          form.navigation.navigate('CompanyForm');
        }}
      />

      {/* 2. Modal: Bill PDF Picker */}
      <BillPdfModal
        visible={form.showBillPdfModal}
        onClose={() => form.setShowBillPdfModal(false)}
        onPickPdfNative={form.handlePickBillPdfNative}
        customPdfName={form.customPdfName}
        onCustomPdfNameChange={form.setCustomPdfName}
        onAttachCustomPdf={() => {
          if (form.customPdfName.trim()) {
            form.handleAttachBillPdf(form.customPdfName.trim(), 'Custom Size');
          }
        }}
        onAttachSample={form.handleAttachBillPdf}
      />

      {/* 3. Modal: Chitthi Picker */}
      <ChitthiModal
        visible={form.showChitthiModal}
        onClose={() => form.setShowChitthiModal(false)}
        onCameraSelect={form.handleAttachChitthiCamera}
        onGallerySelect={form.handleAttachChitthiGallery}
        onPdfSelect={form.handleAttachChitthiPdf}
      />

      {/* 4. Modal: Chitthi Fullscreen Preview */}
      <ChitthiViewerModal
        visible={form.showChitthiViewer}
        onClose={() => form.setShowChitthiViewer(false)}
        chitthi={form.chitthi}
        billNumber={form.billNumber}
        selectedCompany={form.selectedCompany}
        amount={form.numAmt}
        dalaliRate={form.numDalaliRate}
        dalaliAmount={form.dalaliAmount}
        date={form.date}
      />
    </KeyboardAvoidingView>
  );
};
