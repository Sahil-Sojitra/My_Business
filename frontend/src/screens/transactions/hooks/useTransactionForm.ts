import { useEffect, useState } from 'react';
import { alertService } from '../../../context/AlertContext';
import { useNavigation } from '../../../navigation/NavigationContext';
import { companyService, transactionService } from '../../../services';
import { Company } from '../../../types/company';
import { AttachmentFile } from '../../../types/transaction';
import {
  pickBillPdf,
  pickChitthiFromGallery,
  pickChitthiPdf,
  takeChitthiPhoto,
  uploadToStorageAsync,
} from '../../../services/attachmentService';

export function useTransactionForm() {
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

  // Modal visibility states
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

  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
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
      newErrors.date = 'Please select a valid bill date';
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
      alertService.showError('Error', 'Selected company could not be found');
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
        alertService.showSuccess('Success', 'Bill updated successfully');
        navigation.navigate('TransactionDetails', { transactionId });
      } else {
        const created = await transactionService.create(payload);
        alertService.showSuccess('Success', 'Bill recorded successfully');
        navigation.navigate('TransactionDetails', {
          transactionId: created.id,
        });
      }
    } catch (err) {
      alertService.showError(
        'Failed to Save Bill',
        err instanceof Error ? err.message : 'An error occurred while saving the bill'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePickBillPdfNative = async () => {
    try {
      const file = await pickBillPdf();
      if (file) {
        setBillPdf(file);
        setShowBillPdfModal(false);
        uploadToStorageAsync(file, 'bill', updated => {
          setBillPdf(prev => (prev?.name === updated.name ? updated : prev));
        });
      }
    } catch (err) {
      alertService.showError(
        'Document Selection',
        err instanceof Error ? err.message : 'Could not pick document from device'
      );
    }
  };

  const handleAttachBillPdf = (name: string, size = '340 KB') => {
    const file: AttachmentFile = {
      name,
      type: 'pdf',
      size,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };
    setBillPdf(file);
    setShowBillPdfModal(false);
    setCustomPdfName('');
    uploadToStorageAsync(file, 'bill', updated => {
      setBillPdf(prev => (prev?.name === updated.name ? updated : prev));
    });
  };

  const handleAttachChitthiCamera = async () => {
    try {
      const file = await takeChitthiPhoto();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
        uploadToStorageAsync(file, 'chitthi', updated => {
          setChitthi(prev => (prev?.name === updated.name ? updated : prev));
        });
      }
    } catch (err) {
      alertService.showError(
        'Camera Error',
        err instanceof Error ? err.message : 'Could not open device camera'
      );
    }
  };

  const handleAttachChitthiGallery = async () => {
    try {
      const file = await pickChitthiFromGallery();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
        uploadToStorageAsync(file, 'chitthi', updated => {
          setChitthi(prev => (prev?.name === updated.name ? updated : prev));
        });
      }
    } catch (err) {
      alertService.showError(
        'Gallery Error',
        err instanceof Error ? err.message : 'Could not open photo gallery'
      );
    }
  };

  const handleAttachChitthiPdf = async () => {
    try {
      const file = await pickChitthiPdf();
      if (file) {
        setChitthi(file);
        setShowChitthiModal(false);
        uploadToStorageAsync(file, 'chitthi', updated => {
          setChitthi(prev => (prev?.name === updated.name ? updated : prev));
        });
      }
    } catch (err) {
      alertService.showError(
        'Document Selection',
        err instanceof Error ? err.message : 'Could not pick PDF slip'
      );
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const numAmt = parseFloat(amount) || 0;
  const numDalaliRate = parseFloat(dalaliRate) || 0;

  return {
    isEditing,
    navigation,
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    showCompanyModal,
    setShowCompanyModal,
    companySearch,
    setCompanySearch,
    amount,
    setAmount,
    dalaliRate,
    setDalaliRate,
    dalaliAmount,
    setDalaliAmount,
    billNumber,
    setBillNumber,
    billPdf,
    setBillPdf,
    showBillPdfModal,
    setShowBillPdfModal,
    customPdfName,
    setCustomPdfName,
    chitthi,
    setChitthi,
    showChitthiModal,
    setShowChitthiModal,
    showChitthiViewer,
    setShowChitthiViewer,
    date,
    setDate,
    dueDate,
    setDueDate,
    description,
    setDescription,
    loadingInitial,
    saving,
    errors,
    setErrors,
    numAmt,
    numDalaliRate,
    recalculateDalali,
    handleSave,
    handlePickBillPdfNative,
    handleAttachBillPdf,
    handleAttachChitthiCamera,
    handleAttachChitthiGallery,
    handleAttachChitthiPdf,
  };
}
