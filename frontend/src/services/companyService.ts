import {
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../types/company';

export interface ICompanyService {
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | null>;
  create(data: CreateCompanyInput): Promise<Company>;
  update(id: string, data: UpdateCompanyInput): Promise<Company>;
  delete(id: string): Promise<boolean>;
}

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'cmp_1',
    name: 'Apex Global Traders',
    ownerName: 'Rajesh Sharma',
    contactNumber: '9825012345',
    email: 'contact@apextraders.com',
    gstin: '24AAACA1234A1Z5',
    address: 'Ring Road Market, Surat, Gujarat',
    notes: 'Primary yarn & textile supplier. Payment terms: 30 days.',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cmp_2',
    name: 'Metro Textile Mills',
    ownerName: 'Amit Patel',
    contactNumber: '9879154321',
    email: 'amit@metrotextiles.in',
    gstin: '24AABCM5678B1Z2',
    address: 'GIDC Industrial Estate, Sachin, Surat',
    notes: 'Fabric processing partner.',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'cmp_3',
    name: 'Sunrise Polymers & Weaving',
    ownerName: 'Vikram Shah',
    contactNumber: '9909011223',
    email: 'vikram@sunrisepolymers.com',
    gstin: '24AACCS9012C1Z8',
    address: 'Udhna Main Road, Surat',
    notes: 'Regular brokerage client.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

class MockCompanyService implements ICompanyService {
  private companies: Company[] = [...INITIAL_COMPANIES];

  async getAll(): Promise<Company[]> {
    await this.delay(200);
    return [...this.companies].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async getById(id: string): Promise<Company | null> {
    await this.delay(150);
    const company = this.companies.find(c => c.id === id);
    return company ? { ...company } : null;
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    await this.delay(250);

    const now = new Date().toISOString();
    const newCompany: Company = {
      id: `cmp_${Date.now()}`,
      name: data.name.trim(),
      ownerName: data.ownerName?.trim(),
      contactNumber: data.contactNumber.trim(),
      email: data.email?.trim(),
      gstin: data.gstin?.trim().toUpperCase(),
      address: data.address?.trim(),
      notes: data.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.companies.push(newCompany);
    return { ...newCompany };
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    await this.delay(250);

    const index = this.companies.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Company not found');
    }

    const current = this.companies[index];
    const updated: Company = {
      ...current,
      ...data,
      name: data.name !== undefined ? data.name.trim() : current.name,
      ownerName:
        data.ownerName !== undefined ? data.ownerName.trim() : current.ownerName,
      contactNumber:
        data.contactNumber !== undefined
          ? data.contactNumber.trim()
          : current.contactNumber,
      email: data.email !== undefined ? data.email.trim() : current.email,
      gstin:
        data.gstin !== undefined
          ? data.gstin.trim().toUpperCase()
          : current.gstin,
      address:
        data.address !== undefined ? data.address.trim() : current.address,
      notes: data.notes !== undefined ? data.notes.trim() : current.notes,
      updatedAt: new Date().toISOString(),
    };

    this.companies[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(200);
    const initialLength = this.companies.length;
    this.companies = this.companies.filter(c => c.id !== id);
    return this.companies.length < initialLength;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const companyService: ICompanyService = new MockCompanyService();
