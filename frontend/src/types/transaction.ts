export type TransactionStatus = 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'PAID';

export type TransactionType = 'BILL' | 'PAYMENT';

export interface Bill {
  id: string;
  companyId: string;
  companyName: string;
  billNumber?: string;
  amount: number;
  monthlyInterestRate: number; // Monthly interest percentage, e.g. 1.0 or 1.5% per month
  interestRate?: number; // Annual equivalent (monthlyInterestRate * 12)
  date: string; // Bill invoice date (YYYY-MM-DD)
  dueDate?: string; // Credit payment deadline (YYYY-MM-DD)
  interestStartDate?: string; // Date from which interest starts accruing (YYYY-MM-DD)
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Alias for backwards compatibility
export type Transaction = Bill;

export type CreateBillInput = Omit<
  Bill,
  'id' | 'createdAt' | 'updatedAt'
>;

export type CreateTransactionInput = CreateBillInput;

export type UpdateBillInput = Partial<CreateBillInput>;
export type UpdateTransactionInput = UpdateBillInput;
