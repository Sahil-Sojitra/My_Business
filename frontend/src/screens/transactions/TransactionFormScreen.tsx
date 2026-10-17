import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import {
  CheckIcon,
  ChevronRight,
  SearchIcon,
  XIcon,
} from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { AttachmentFile } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';
import {
  pickBillPdf,
  pickChitthiFromGallery,
  pickChitthiPdf,
  takeChitthiPhoto,
} from '../../services/attachmentService';

export const TransactionFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const transactionId = navigation.params?.transactionId as string | undefined;
  const defaultCompanyId = navigation.params?.defaultCompanyId as
    | string
    | undefined;
  const isEditing = Boolean(transactionId);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    defaultCompanyId || ''
  );

  // Company Picker Search Modal state
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [companySearch, setCompanySearch] = useState<string>('');

  const [amount, setAmount] = useState<string>(
    navigation.params?.initialAmount !== undefined
      ? String(navigation.params.initialAmount)
      : ''
  );
  const [dalaliRate, setDalaliRate] = useState<string>(
    navigation.params?.initialDalaliRate !== undefined
      ? String(navigation.params.initialDalaliRate)
      : '1.5'
  );
  const [dalaliAmount, setDalaliAmount] = useState<string>(() => {
    if (navigation.params?.initialDalaliAmount !== undefined) {
      return String(navigation.params.initialDalaliAmount);
    }
    if (
      navigation.params?.initialAmount &&
      navigation.params?.initialDalaliRate
    ) {
      const calc =
        (Number(navigation.params.initialAmount) *
          Number(navigation.params.initialDalaliRate)) /
        100;
      return calc.toFixed(2);
    }
    return '';
  });
  const [billNumber, setBillNumber] = useState<string>('');

  // Bill PDF Document state
  const [billPdf, setBillPdf] = useState<AttachmentFile | null>(null);
  const [showBillPdfModal, setShowBillPdfModal] = useState<boolean>(false);
  const [customPdfName, setCustomPdfName] = useState<string>('');

  // Chitthi (Delivery Slip / Voucher) state
  const [chitthi, setChitthi] = useState<AttachmentFile | null>(null);
  const [showChitthiModal, setShowChitthiModal] = useState<boolean>(false);
  const [showChitthiViewer, setShowChitthiViewer] = useState<boolean>(false);

  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    company?: string;
    amount?: string;
    dalaliRate?: string;
    date?: string;
  }>({});

  const recalculateDalali = (amtStr: string, rateStr: string) => {
    const numA = parseFloat(amtStr) || 0;
    const numR = parseFloat(rateStr) || 0;
    if (numA > 0 && numR > 0) {
      const val = (numA * numR) / 100;
      setDalaliAmount(val % 1 === 0 ? String(val) : val.toFixed(2));
    } else {
      setDalaliAmount('');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedCompanies = await companyService.getAll();
        setCompanies(fetchedCompanies);

        if (transactionId) {
          const tx = await transactionService.getById(transactionId);
          if (tx) {
            setSelectedCompanyId(tx.companyId);
            const amtStr = String(tx.amount);
            setAmount(amtStr);
            const rate =
              tx.dalaliRate ??
              tx.monthlyInterestRate ??
              (tx.interestRate ? tx.interestRate / 12 : 1.5);
            const rateStr = String(rate);
            setDalaliRate(rateStr);

            if (tx.dalaliAmount !== undefined) {
              setDalaliAmount(String(tx.dalaliAmount));
            } else {
              const val = (Number(tx.amount) * Number(rate)) / 100;
              setDalaliAmount(val % 1 === 0 ? String(val) : val.toFixed(2));
            }

            setBillNumber(tx.billNumber || '');
            if (tx.billPdf) {
              setBillPdf(tx.billPdf);
            }
            if (tx.chitthi) {
              setChitthi(tx.chitthi);
            }
            setDate(tx.date);
            setDueDate(tx.dueDate || '');
            setDescription(tx.description || '');
          }
        } else if (defaultCompanyId) {
          setSelectedCompanyId(defaultCompanyId);
        } else if (fetchedCompanies.length > 0) {
          setSelectedCompanyId(fetchedCompanies[0].id);
        }
      } finally {
        setLoadingInitial(false);
      }
    };

    init();
  }, [transactionId, defaultCompanyId]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedCompanyId) {
      newErrors.company = 'Please select a buyer firm';
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Bill amount is required';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    const numRate = parseFloat(dalaliRate);
    if (!dalaliRate.trim()) {
      newErrors.dalaliRate = 'Dalali / commission percentage is required';
    } else if (isNaN(numRate) || numRate < 0) {
      newErrors.dalaliRate = 'Dalali percentage cannot be negative';
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      newErrors.date = 'Date must be in YYYY-MM-DD format (e.g. 2026-10-13)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (!selectedCompany) {
      Alert.alert('Error', 'Selected company could not be found');
      return;
    }

    setSaving(true);
    try {
      const parsedDalaliRate = parseFloat(dalaliRate);
      const parsedAmount = parseFloat(amount);
      const calculatedDalaliAmount =
        parseFloat(dalaliAmount) || (parsedAmount * parsedDalaliRate) / 100;

      const payload = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        amount: parsedAmount,
        dalaliRate: parsedDalaliRate,
        dalaliAmount: calculatedDalaliAmount,
        monthlyInterestRate: parsedDalaliRate,
        interestRate: parsedDalaliRate * 12,
        billNumber: billNumber.trim() || undefined,
        billPdf: billPdf || undefined,
        chitthi: chitthi || undefined,
        date: date.trim(),
        interestStartDate: date.trim(),
        dueDate: dueDate.trim() || undefined,
        status: 'PENDING' as const,
        description: description.trim() || undefined,
      };

      if (isEditing && transactionId) {
        await transactionService.update(transactionId, payload);
        Alert.alert('Success', 'Bill updated successfully');
        navigation.navigate('TransactionDetails', { transactionId });
      } else {
        const created = await transactionService.create(payload);
        Alert.alert('Success', 'Bill recorded successfully');
        navigation.navigate('TransactionDetails', {
          transactionId: created.id,
        });
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save bill'
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  // Filter companies for modal search
  const filteredCompanies = companies.filter(c => {
    if (!companySearch.trim()) {
      return true;
    }
    const q = companySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
      (c.contactNumber && c.contactNumber.includes(q))
    );
  });

  // Native Document Picker to select real PDF from phone storage
  const handlePickBillPdfNative = async () => {
    try {
      const file = await pickBillPdf();
      if (file) {
        setBillPdf(file);
        setShowBillPdfModal(false);
      }
    } catch (err) {
      Alert.alert(
        'Document Selection',
        err instanceof Error ? err.message : 'Could not pick document from device'
      );
    }
  };

  // Attach sample/custom bill PDF
  const handleAttachBillPdf = (name: string, size = '340 KB') => {
    setBillPdf({
      name,
      type: 'pdf',
      size,
      date: new Date().toISOString().split('T')[0],
    });
    setShowBillPdfModal(false);
    setCustomPdfName('');
  };

  // Click Photo with physical camera
  const handleAttachChitthiCamera = async () => {
    try {
      const file = await takeChitthiPhoto();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
      }
    } catch (err) {
      Alert.alert(
        'Camera',
        err instanceof Error ? err.message : 'Could not open device camera'
      );
    }
  };

  // Attach Chitthi via Gallery
  const handleAttachChitthiGallery = async () => {
    try {
      const file = await pickChitthiFromGallery();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
      }
    } catch (err) {
      Alert.alert(
        'Gallery',
        err instanceof Error ? err.message : 'Could not open photo gallery'
      );
    }
  };

  // Attach Chitthi via PDF from phone storage
  const handleAttachChitthiPdf = async () => {
    try {
      const file = await pickChitthiPdf();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
      }
    } catch (err) {
      Alert.alert(
        'Document Selection',
        err instanceof Error ? err.message : 'Could not pick PDF slip'
      );
    }
  };

  const numAmt = parseFloat(amount) || 0;
  const numDalaliRate = parseFloat(dalaliRate) || 0;

  if (loadingInitial) {
    return <LoadingSpinner message="Loading bill form..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Record bill, Dalali & attachments"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Buyer Firm / Client Picker (Searchable Dropdown for 15-20+ Companies) */}
          <View style={styles.companySectionHeader}>
            <Text style={styles.fieldLabel}>Buyer Company / Firm *</Text>
            <TouchableOpacity
              onPress={() => setShowCompanyModal(true)}
              activeOpacity={0.7}>
              <Text style={styles.browseAllText}>
                {companies.length > 0
                  ? `Search ${companies.length} Firms ▾`
                  : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedCompany ? (
            <TouchableOpacity
              style={styles.selectedCompanyCard}
              onPress={() => setShowCompanyModal(true)}
              activeOpacity={0.8}>
              <View style={styles.selectedCompanyAvatar}>
                <Text style={styles.selectedCompanyAvatarText}>
                  {selectedCompany.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.selectedCompanyDetails}>
                <Text style={styles.selectedCompanyName} numberOfLines={1}>
                  {selectedCompany.name}
                </Text>
                <Text style={styles.selectedCompanySub} numberOfLines={1}>
                  {selectedCompany.ownerName
                    ? `${selectedCompany.ownerName} • `
                    : ''}
                  {selectedCompany.contactNumber}
                </Text>
              </View>
              <View style={styles.changeCompanyBadge}>
                <Text style={styles.changeCompanyBadgeText}>Change</Text>
                <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.companySelectBtn,
                Boolean(errors.company) && styles.inputErrorBorder,
              ]}
              onPress={() => setShowCompanyModal(true)}
              activeOpacity={0.8}>
              <View style={styles.selectBtnLeft}>
                <Text style={styles.buildingIcon}>🏢</Text>
                <Text style={styles.companySelectPlaceholder}>
                  Select Buyer Firm (from {companies.length} registered clients)...
                </Text>
              </View>
              <Text style={styles.dropdownCaret}>▾</Text>
            </TouchableOpacity>
          )}

          {errors.company ? (
            <Text style={styles.errorText}>{errors.company}</Text>
          ) : null}

          {/* Bill Amount */}
          <Input
            label="Bill Amount (₹) *"
            value={amount}
            onChangeText={val => {
              setAmount(val);
              recalculateDalali(val, dalaliRate);
              if (errors.amount) {
                setErrors(prev => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder="e.g. 145000"
            keyboardType="numeric"
            error={errors.amount}
            required
            style={styles.inputMargin}
          />

          {/* Dalali / Commission Percentage User Input */}
          <View style={styles.dalaliInputWrapper}>
            <Input
              label="Dalali / Commission Rate (%) *"
              value={dalaliRate}
              onChangeText={val => {
                setDalaliRate(val);
                recalculateDalali(amount, val);
                if (errors.dalaliRate) {
                  setErrors(prev => ({
                    ...prev,
                    dalaliRate: undefined,
                  }));
                }
              }}
              placeholder="e.g. 1.0, 1.5, 2.0"
              keyboardType="numeric"
              error={errors.dalaliRate}
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
                    setDalaliRate(pRate);
                    recalculateDalali(amount, pRate);
                    if (errors.dalaliRate) {
                      setErrors(prev => ({ ...prev, dalaliRate: undefined }));
                    }
                  }}
                  style={[
                    styles.presetPill,
                    dalaliRate === pRate && styles.presetPillActive,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.presetPillText,
                      dalaliRate === pRate && styles.presetPillTextActive,
                    ]}>
                    {pRate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Simple Green Input: Dalali Amount (Auto-Calculated) */}
          <View style={styles.dalaliGreenSection}>
            <Text style={styles.dalaliGreenLabel}>
              Dalali Amount (Brokerage) (₹) *
            </Text>
            <View style={styles.dalaliGreenInputWrapper}>
              <Text style={styles.dalaliGreenSymbol}>₹</Text>
              <TextInput
                style={styles.dalaliGreenInput}
                value={dalaliAmount}
                onChangeText={setDalaliAmount}
                placeholder="0.00"
                placeholderTextColor="#15803D"
                keyboardType="numeric"
              />
              <View style={styles.dalaliAutoBadge}>
                <Text style={styles.dalaliAutoBadgeText}>
                  {numDalaliRate > 0 ? `${numDalaliRate}% auto` : 'Auto'}
                </Text>
              </View>
            </View>
            <Text style={styles.dalaliGreenHelper}>
              {numAmt > 0 && numDalaliRate > 0
                ? `Auto-calculated: ${numDalaliRate}% of ${formatCurrency(numAmt)}`
                : 'Calculates automatically from bill amount & Dalali %'}
            </Text>
          </View>

          {/* Bill / Invoice Number */}
          <Input
            label="Bill / Invoice Number"
            value={billNumber}
            onChangeText={setBillNumber}
            placeholder="e.g. INV-2026-104 or LOT-409"
            autoCapitalize="characters"
          />

          {/* 1. Bill PDF File Input (Directly below Bill/Invoice Number) */}
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentLabel}>
              Bill / Invoice PDF Document
            </Text>
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
                    {billPdf.size || 'PDF Document'} • Uploaded
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeAttachedBtn}
                  onPress={() => setBillPdf(null)}
                  activeOpacity={0.7}>
                  <XIcon size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadDashedBox}
                onPress={() => setShowBillPdfModal(true)}
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

          {/* 2. Chitthi Input (Directly below Bill PDF) with Camera + Upload PDF */}
          <View style={styles.attachmentSection}>
            <View style={styles.chitthiHeaderRow}>
              <View>
                <Text style={styles.attachmentLabel}>
                  Chitthi (Delivery Slip / Voucher)
                </Text>
                <Text style={styles.chitthiSubtitle}>
                  Physical consignment receipt via Camera or PDF
                </Text>
              </View>
              {chitthi ? (
                <TouchableOpacity
                  onPress={() => setShowChitthiViewer(true)}
                  activeOpacity={0.7}>
                  <Text style={styles.viewSlipLink}>👁️ Preview</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {chitthi ? (
              <View
                style={[
                  styles.attachedCard,
                  chitthi.type === 'photo' && styles.attachedCardPhoto,
                ]}>
                <View
                  style={[
                    styles.chitthiTypeBadge,
                    chitthi.type === 'photo'
                      ? styles.chitthiBadgePhoto
                      : styles.chitthiBadgePdf,
                  ]}>
                  <Text style={styles.chitthiTypeBadgeText}>
                    {chitthi.type === 'photo' ? '📷 PHOTO' : '📄 PDF'}
                  </Text>
                </View>
                <View style={styles.attachedInfo}>
                  <Text style={styles.attachedName} numberOfLines={1}>
                    {chitthi.name}
                  </Text>
                  <Text style={styles.attachedMeta}>
                    {chitthi.size || 'Attachment'} • Physical Voucher
                  </Text>
                </View>
                <View style={styles.chitthiActionGroup}>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => setShowChitthiModal(true)}
                    activeOpacity={0.7}>
                    <Text style={styles.retakeBtnText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeAttachedBtn}
                    onPress={() => setChitthi(null)}
                    activeOpacity={0.7}>
                    <XIcon size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.chitthiDualActions}>
                {/* Camera Click Button */}
                <TouchableOpacity
                  style={styles.chitthiCameraBtn}
                  onPress={handleAttachChitthiCamera}
                  activeOpacity={0.8}>
                  <Text style={styles.chitthiActionIcon}>📷</Text>
                  <Text style={styles.chitthiCameraTitle}>Click Photo</Text>
                  <Text style={styles.chitthiActionSub}>
                    Snap chitthi via Camera
                  </Text>
                </TouchableOpacity>

                {/* PDF / File Upload Button */}
                <TouchableOpacity
                  style={styles.chitthiUploadBtn}
                  onPress={() => setShowChitthiModal(true)}
                  activeOpacity={0.8}>
                  <Text style={styles.chitthiActionIcon}>📁</Text>
                  <Text style={styles.chitthiUploadTitle}>Upload PDF</Text>
                  <Text style={styles.chitthiActionSub}>
                    Choose PDF or Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bill Date */}
          <Input
            label="Bill Date (YYYY-MM-DD) *"
            value={date}
            onChangeText={val => {
              setDate(val);
              if (errors.date) {
                setErrors(prev => ({ ...prev, date: undefined }));
              }
            }}
            placeholder="2026-10-13"
            error={errors.date}
            required
          />

          {/* Payment Due Date */}
          <Input
            label="Payment Due Date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-11-13"
            helperText="Settlement deadline (closest due date appears first on firm list)"
          />

          {/* Description */}
          <Input
            label="Consignment / Deal Notes"
            value={description}
            onChangeText={setDescription}
            placeholder="Yarn counts, meter quantity, transport LR number..."
            multiline
            numberOfLines={3}
            style={styles.inputMargin}
          />

          <Button
            title={isEditing ? 'Save Changes' : 'Record Bill (Status: Pending)'}
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>

      {/* 1. Modal: Searchable Company Selector (for 15-20+ companies) */}
      <Modal
        visible={showCompanyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompanyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.companyModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Buyer Company</Text>
                <Text style={styles.modalSub}>
                  {companies.length} registered client firms
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCompanyModal(false)}
                activeOpacity={0.7}>
                <XIcon size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Live Search Bar */}
            <View style={styles.modalSearchRow}>
              <SearchIcon size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                value={companySearch}
                onChangeText={setCompanySearch}
                placeholder="Search by company name, owner, contact..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              {companySearch.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setCompanySearch('')}
                  activeOpacity={0.7}>
                  <XIcon size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Add Company action */}
            <TouchableOpacity
              style={styles.modalAddCompBtn}
              onPress={() => {
                setShowCompanyModal(false);
                navigation.navigate('CompanyForm');
              }}
              activeOpacity={0.8}>
              <Text style={styles.modalAddCompText}>
                + Register New Buyer Firm
              </Text>
            </TouchableOpacity>

            {/* Filtered Company List */}
            <ScrollView
              style={styles.companyListScroll}
              keyboardShouldPersistTaps="handled">
              {filteredCompanies.length === 0 ? (
                <View style={styles.emptySearchWrap}>
                  <Text style={styles.emptySearchEmoji}>🔍</Text>
                  <Text style={styles.emptySearchTitle}>No firms found</Text>
                  <Text style={styles.emptySearchSub}>
                    No client matching &quot;{companySearch}&quot;
                  </Text>
                </View>
              ) : (
                filteredCompanies.map(c => {
                  const isSelected = selectedCompanyId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.companyListItem,
                        isSelected && styles.companyListItemActive,
                      ]}
                      onPress={() => {
                        setSelectedCompanyId(c.id);
                        if (errors.company) {
                          setErrors(prev => ({ ...prev, company: undefined }));
                        }
                        setShowCompanyModal(false);
                        setCompanySearch('');
                      }}
                      activeOpacity={0.7}>
                      <View style={styles.companyListAvatar}>
                        <Text style={styles.companyListAvatarText}>
                          {c.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.companyListInfo}>
                        <Text
                          style={[
                            styles.companyListName,
                            isSelected && styles.companyListNameActive,
                          ]}
                          numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.companyListSub} numberOfLines={1}>
                          {c.ownerName ? `${c.ownerName} • ` : ''}
                          {c.contactNumber}
                        </Text>
                        {c.gstin ? (
                          <Text style={styles.companyListGstin}>
                            GST: {c.gstin}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <View style={styles.selectedCheckWrap}>
                          <CheckIcon size={16} color="#2563EB" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Modal: Bill PDF Attachment Options */}
      <Modal
        visible={showBillPdfModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBillPdfModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Attach Bill PDF File</Text>
              <TouchableOpacity
                onPress={() => setShowBillPdfModal(false)}
                activeOpacity={0.7}>
                <XIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Native Phone Storage Document Picker */}
            <TouchableOpacity
              style={[styles.dialogOptionBtn, styles.cameraOptionHighlight]}
              onPress={handlePickBillPdfNative}
              activeOpacity={0.8}>
              <Text style={styles.dialogOptionEmoji}>📁</Text>
              <View style={styles.dialogOptionTextWrap}>
                <Text style={styles.dialogOptionTitle}>
                  Select PDF from Phone Files
                </Text>
                <Text style={styles.dialogOptionSub}>
                  Open device file manager to choose your invoice PDF
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dialogOptionBtn}
              onPress={() =>
                handleAttachBillPdf(
                  billNumber ? `Invoice_${billNumber}.pdf` : 'Invoice_Bill.pdf',
                  '284 KB'
                )
              }
              activeOpacity={0.7}>
              <Text style={styles.dialogOptionEmoji}>📄</Text>
              <View style={styles.dialogOptionTextWrap}>
                <Text style={styles.dialogOptionTitle}>
                  {billNumber
                    ? `Invoice_${billNumber}.pdf`
                    : 'Standard Tax Invoice PDF'}
                </Text>
                <Text style={styles.dialogOptionSub}>
                  Sample generated bill document (284 KB)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dialogOptionBtn}
              onPress={() =>
                handleAttachBillPdf('Signed_Consignment_Bill.pdf', '512 KB')
              }
              activeOpacity={0.7}>
              <Text style={styles.dialogOptionEmoji}>📑</Text>
              <View style={styles.dialogOptionTextWrap}>
                <Text style={styles.dialogOptionTitle}>
                  Signed_Consignment_Bill.pdf
                </Text>
                <Text style={styles.dialogOptionSub}>
                  Signed copy with transport receipt (512 KB)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Custom file name input */}
            <View style={styles.customFileNameRow}>
              <TextInput
                style={styles.customFileNameInput}
                value={customPdfName}
                onChangeText={setCustomPdfName}
                placeholder="Or enter custom file name..."
                placeholderTextColor="#94A3B8"
              />
              <Button
                title="Attach"
                size="sm"
                onPress={() => {
                  if (customPdfName.trim()) {
                    const fname = customPdfName.endsWith('.pdf')
                      ? customPdfName.trim()
                      : `${customPdfName.trim()}.pdf`;
                    handleAttachBillPdf(fname, '310 KB');
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Modal: Chitthi Attachment Options (Camera or PDF) */}
      <Modal
        visible={showChitthiModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowChitthiModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Attach Chitthi (Slip)</Text>
              <TouchableOpacity
                onPress={() => setShowChitthiModal(false)}
                activeOpacity={0.7}>
                <XIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogSubtitle}>
              Take camera photo or upload PDF voucher:
            </Text>

            {/* Option A: Camera */}
            <TouchableOpacity
              style={[styles.dialogOptionBtn, styles.cameraOptionHighlight]}
              onPress={handleAttachChitthiCamera}
              activeOpacity={0.8}>
              <Text style={styles.dialogOptionEmoji}>📷</Text>
              <View style={styles.dialogOptionTextWrap}>
                <Text style={styles.dialogOptionTitle}>
                  Click Photo with Camera
                </Text>
                <Text style={styles.dialogOptionSub}>
                  Snap paper chitthi directly on the spot
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option B: Gallery */}
            <TouchableOpacity
              style={styles.dialogOptionBtn}
              onPress={handleAttachChitthiGallery}
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
              onPress={handleAttachChitthiPdf}
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

      {/* 4. Modal: Chitthi Fullscreen Preview */}
      <Modal
        visible={showChitthiViewer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChitthiViewer(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.viewerCard}>
            <View style={styles.dialogHeader}>
              <View>
                <Text style={styles.dialogTitle}>Chitthi Voucher Preview</Text>
                <Text style={styles.dialogSubtitle}>
                  {chitthi?.name || 'Attached Slip'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChitthiViewer(false)}
                activeOpacity={0.7}>
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
                  {formatCurrency(numAmt)}
                </Text>
              </View>

              <View style={styles.chitthiMetaRow}>
                <Text style={styles.chitthiMetaLabel}>Dalali Rate:</Text>
                <Text style={styles.chitthiMetaVal}>{numDalaliRate}%</Text>
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
              onPress={() => setShowChitthiViewer(false)}
              style={styles.viewerCloseBtn}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  companySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  browseAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  selectedCompanyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectedCompanyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedCompanyAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedCompanyDetails: {
    flex: 1,
    marginRight: 8,
  },
  selectedCompanyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedCompanySub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  changeCompanyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeCompanyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  companySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  selectBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  buildingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  companySelectPlaceholder: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  dropdownCaret: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    marginTop: -10,
    marginBottom: 12,
  },
  inputMargin: {
    marginBottom: 14,
  },
  dalaliInputWrapper: {
    marginBottom: 14,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  presetLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  presetPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  presetPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },
  dalaliGreenSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  dalaliGreenLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dalaliGreenInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  dalaliGreenSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803D',
    marginRight: 6,
  },
  dalaliGreenInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
    paddingVertical: 8,
  },
  dalaliAutoBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  dalaliAutoBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  dalaliGreenHelper: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 6,
  },
  attachmentSection: {
    marginBottom: 16,
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  uploadDashedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  uploadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  uploadIconEmoji: {
    fontSize: 18,
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadPrimaryText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadSubText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  uploadActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  attachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  attachedCardPhoto: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pdfIconBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginRight: 10,
  },
  pdfIconBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  attachedInfo: {
    flex: 1,
    marginRight: 8,
  },
  attachedName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  attachedMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  removeAttachedBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  chitthiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chitthiSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  viewSlipLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  chitthiTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  chitthiBadgePhoto: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  chitthiBadgePdf: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chitthiTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  chitthiActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  retakeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  chitthiDualActions: {
    flexDirection: 'row',
    gap: 10,
  },
  chitthiCameraBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chitthiUploadBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chitthiActionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  chitthiCameraTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
  },
  chitthiUploadTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  chitthiActionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  companyModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 8,
  },
  modalAddCompBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAddCompText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  companyListScroll: {
    maxHeight: 380,
  },
  emptySearchWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptySearchEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptySearchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySearchSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  companyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  companyListItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  companyListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyListAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  companyListInfo: {
    flex: 1,
  },
  companyListName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  companyListNameActive: {
    color: '#2563EB',
  },
  companyListSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  companyListGstin: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  selectedCheckWrap: {
    marginLeft: 8,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 20,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  dialogOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cameraOptionHighlight: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  dialogOptionEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  dialogOptionTextWrap: {
    flex: 1,
  },
  dialogOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dialogOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  customFileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customFileNameInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0F172A',
  },
  viewerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 20,
  },
  chitthiPaper: {
    backgroundColor: '#FEF9C3',
    borderWidth: 2,
    borderColor: '#FACC15',
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
  },
  chitthiPaperHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  chitthiPaperTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#854D0E',
    letterSpacing: 0.5,
  },
  chitthiPaperNo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A16207',
    marginTop: 2,
  },
  chitthiDottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#EAB308',
    marginVertical: 10,
  },
  chitthiMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  chitthiMetaLabel: {
    fontSize: 13,
    color: '#713F12',
    fontWeight: '600',
  },
  chitthiMetaVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  chitthiDalaliGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  chitthiStampBox: {
    alignSelf: 'flex-end',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    transform: [{ rotate: '-6deg' }],
  },
  chitthiStampText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.4,
  },
  chitthiStampDate: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  viewerCloseBtn: {
    marginTop: 6,
  },
});
