export interface Company {
  id: string;
  name: string;
  ownerName?: string;
  contactNumber: string;
  email?: string;
  gstin?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateCompanyInput = Partial<CreateCompanyInput>;
