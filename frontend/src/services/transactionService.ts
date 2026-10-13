import {
  CreateBillInput,
  Transaction,
  UpdateBillInput,
} from '../types/transaction';

export interface ITransactionService {
  getAll(companyId?: string): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(data: CreateBillInput): Promise<Transaction>;
  update(id: string, data: UpdateBillInput): Promise<Transaction>;
  delete(id: string): Promise<boolean>;
  deleteByCompanyId(companyId: string): Promise<number>;
}

const INITIAL_BILLS: Transaction[] = [
  {
    id: 'tx_1',
    companyId: 'cmp_1',
    companyName: 'Apex Global Traders',
    billNumber: 'INV-2026-081',
    amount: 145000,
    monthlyInterestRate: 1.5, // 1.5% per month
    interestRate: 18,
    date: '2026-09-01',
    dueDate: '2026-10-18', // Near due date
    interestStartDate: '2026-09-01',
    status: 'PENDING',
    description: 'Yarn consignment lot #409 batch delivery',
    createdAt: new Date(Date.now() - 42 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 42 * 86400000).toISOString(),
  },
  {
    id: 'tx_2',
    companyId: 'cmp_1',
    companyName: 'Apex Global Traders',
    billNumber: 'INV-2026-094',
    amount: 75000,
    monthlyInterestRate: 1.0, // 1.0% per month
    interestRate: 12,
    date: '2026-09-20',
    dueDate: '2026-10-15', // Closest due date!
    interestStartDate: '2026-09-20',
    status: 'PENDING',
    description: 'Cotton fabric shipment bill',
    createdAt: new Date(Date.now() - 23 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 86400000).toISOString(),
  },
  {
    id: 'tx_3',
    companyId: 'cmp_2',
    companyName: 'Metro Textile Mills',
    billNumber: 'INV-9022',
    amount: 82000,
    monthlyInterestRate: 2.0, // 2.0% per month
    interestRate: 24,
    date: '2026-08-15',
    dueDate: '2026-09-15', // Overdue
    interestStartDate: '2026-08-15',
    status: 'OVERDUE',
    description: 'Fabric processing & finishing lot brokerage',
    createdAt: new Date(Date.now() - 59 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 59 * 86400000).toISOString(),
  },
  {
    id: 'tx_4',
    companyId: 'cmp_3',
    companyName: 'Sunrise Polymers & Weaving',
    billNumber: 'INV-4411',
    amount: 325000,
    monthlyInterestRate: 1.25, // 1.25% per month
    interestRate: 15,
    date: '2026-10-01',
    dueDate: '2026-10-31',
    interestStartDate: '2026-10-01',
    status: 'PENDING',
    description: 'Polymer raw materials supply brokerage invoice',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

class MockTransactionService implements ITransactionService {
  private transactions: Transaction[] = [...INITIAL_BILLS];

  async getAll(companyId?: string): Promise<Transaction[]> {
    await this.delay(100);
    const filtered = companyId
      ? this.transactions.filter(t => t.companyId === companyId)
      : this.transactions;

    return [...filtered];
  }

  async getById(id: string): Promise<Transaction | null> {
    await this.delay(50);
    const item = this.transactions.find(t => t.id === id);
    return item ? { ...item } : null;
  }

  async create(data: CreateBillInput): Promise<Transaction> {
    await this.delay(150);

    const now = new Date().toISOString();
    const monthlyRate =
      data.monthlyInterestRate !== undefined
        ? Number(data.monthlyInterestRate)
        : 1.5;

    const newBill: Transaction = {
      id: `bill_${Date.now()}`,
      companyId: data.companyId,
      companyName: data.companyName,
      billNumber: data.billNumber?.trim(),
      amount: Number(data.amount),
      monthlyInterestRate: monthlyRate,
      interestRate: monthlyRate * 12,
      date: data.date,
      dueDate: data.dueDate,
      interestStartDate: data.interestStartDate || data.date,
      status: 'PENDING', // Always defaults to PENDING on creation
      description: data.description?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.transactions.push(newBill);
    return { ...newBill };
  }

  async update(id: string, data: UpdateBillInput): Promise<Transaction> {
    await this.delay(150);

    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Bill not found');
    }

    const current = this.transactions[index];
    const monthlyRate =
      data.monthlyInterestRate !== undefined
        ? Number(data.monthlyInterestRate)
        : current.monthlyInterestRate;

    const updated: Transaction = {
      ...current,
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : current.amount,
      monthlyInterestRate: monthlyRate,
      interestRate: monthlyRate * 12,
      billNumber:
        data.billNumber !== undefined
          ? data.billNumber.trim()
          : current.billNumber,
      interestStartDate:
        data.interestStartDate !== undefined
          ? data.interestStartDate
          : current.interestStartDate,
      description:
        data.description !== undefined
          ? data.description.trim()
          : current.description,
      updatedAt: new Date().toISOString(),
    };

    this.transactions[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(100);
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    return this.transactions.length < initialLength;
  }

  async deleteByCompanyId(companyId: string): Promise<number> {
    await this.delay(50);
    const beforeCount = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.companyId !== companyId);
    return beforeCount - this.transactions.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const transactionService: ITransactionService =
  new MockTransactionService();
