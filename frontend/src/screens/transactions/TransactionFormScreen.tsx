import React, { useRef } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { DatePickerField } from '../../components/common/DatePickerField';
import { Input } from '../../components/common/Input';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
} from '../../components/common/KeyboardAwareScrollView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { BillPdfAttachmentSection } from './components/BillPdfAttachmentSection';
import { ChitthiAttachmentSection } from './components/ChitthiAttachmentSection';
import { ChitthiViewerModal } from './components/ChitthiViewerModal';
import { CompanyPickerModal } from './components/CompanyPickerModal';
import { SelectedCompanyCard } from './components/SelectedCompanyCard';
import { useTransactionForm } from './hooks/useTransactionForm';
import { styles } from './TransactionFormStyles';

export const TransactionFormScreen: React.FC = () => {
  const form = useTransactionForm();
  const scrollRef = useRef<KeyboardAwareScrollViewRef | null>(null);
  const dalaliSectionRef = useRef<any>(null);

  if (form.loadingInitial) {
    return <LoadingSpinner message="Loading bill form..." />;
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={form.isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Record bill, Dalali & attachments"
        showBack={true}
      />

      <KeyboardAwareScrollView
        ref={scrollRef}
        extraScrollHeight={90}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          {/* Buyer Firm / Client Picker */}
          <SelectedCompanyCard
            companiesCount={form.companies.length}
            selectedCompany={form.selectedCompany}
            error={form.errors.company}
            onPress={() => form.setShowCompanyModal(true)}
            onAddNewCompany={() => form.navigation.navigate('CompanyForm')}
          />

          {/* Bill Amount */}
          <Input
            label="Bill Amount (₹)"
            value={form.amount}
            onChangeText={val => {
              const clean = val.replace(/[^0-9.]/g, '').slice(0, 12);
              form.setAmount(clean);
              form.recalculateDalali(clean, form.dalaliRate);
              if (form.errors.amount) {
                form.setErrors(prev => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder="e.g. 145000"
            keyboardType="numeric"
            maxLength={12}
            error={form.errors.amount}
            required
            style={styles.inputMargin}
          />

          {/* Dalali / Commission Percentage User Input */}
          <View style={styles.dalaliInputWrapper}>
            <Input
              label="Dalali / Commission Rate (%)"
              value={form.dalaliRate}
              onChangeText={val => {
                const clean = val.replace(/[^0-9.]/g, '').slice(0, 5);
                form.setDalaliRate(clean);
                form.recalculateDalali(form.amount, clean);
                if (form.errors.dalaliRate) {
                  form.setErrors(prev => ({
                    ...prev,
                    dalaliRate: undefined,
                  }));
                }
              }}
              placeholder="e.g. 1.0, 1.5, 2.0"
              keyboardType="numeric"
              maxLength={5}
              error={form.errors.dalaliRate}
              helperText="Broker commission percentage on this bill amount"
              required
            />

            {/* Quick preset pills for non-tech broker convenience */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetLabel}>Quick Select:</Text>
              <View style={styles.presetsRow}>
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
          </View>

          {/* Dalali Amount Section (Auto-Calculated) with dedicated focus auto-scroll */}
          <View ref={dalaliSectionRef} style={styles.dalaliGreenSection}>
            <Text style={styles.dalaliGreenLabel}>
              Dalali Amount (Brokerage) (₹) *
            </Text>
            <View style={styles.dalaliGreenInputWrapper}>
              <Text style={styles.dalaliGreenSymbol}>₹</Text>
              <TextInput
                style={styles.dalaliGreenInput}
                value={form.dalaliAmount}
                onChangeText={val => {
                  const clean = val.replace(/[^0-9.]/g, '').slice(0, 12);
                  form.setDalaliAmount(clean);
                }}
                placeholder="0.00"
                placeholderTextColor="#15803D"
                keyboardType="numeric"
                maxLength={12}
                onFocus={() => {
                  scrollRef.current?.scrollToInput(dalaliSectionRef);
                }}
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
            onChangeText={val => form.setBillNumber(val.slice(0, 30))}
            placeholder="e.g. INV-2026-104 or LOT-409"
            maxLength={30}
            autoCapitalize="characters"
          />

          {/* Bill PDF File Attachment */}
          <BillPdfAttachmentSection
            billPdf={form.billPdf}
            onAttachPress={form.handlePickBillPdfNative}
            onRemove={() => form.setBillPdf(null)}
          />

          {/* Chitthi Delivery Slip / Voucher Attachment */}
          <ChitthiAttachmentSection
            chitthi={form.chitthi}
            onPreviewPress={() => form.setShowChitthiViewer(true)}
            onCameraPress={form.handleAttachChitthiCamera}
            onUploadPress={form.handleAttachChitthiPdf}
            onRemove={() => form.setChitthi(null)}
          />

          {/* Bill Date */}
          <DatePickerField
            label="Bill Date"
            value={form.date}
            onChange={val => {
              form.setDate(val);
              if (form.errors.date) {
                form.setErrors(prev => ({ ...prev, date: undefined }));
              }
            }}
            placeholder="Select bill date"
            mode="billDate"
            error={form.errors.date}
            required
          />

          {/* Payment Due Date */}
          <DatePickerField
            label="Payment Due Date"
            value={form.dueDate}
            onChange={form.setDueDate}
            placeholder="Select payment due date (Optional)"
            mode="dueDate"
            referenceDate={form.date}
            helperText="Credit settlement deadline (closest due date appears first on firm list)"
          />

          {/* Description */}
          <Input
            label="Consignment / Deal Notes"
            value={form.description}
            onChangeText={val => form.setDescription(val.slice(0, 500))}
            placeholder="Yarn counts, meter quantity, transport LR number..."
            maxLength={500}
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
      </KeyboardAwareScrollView>

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

      {/* 2. Modal: Chitthi Fullscreen Preview */}
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
    </View>
  );
};
