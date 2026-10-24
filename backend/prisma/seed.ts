import { PrismaClient, BillStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database for My_Business...');

  // 1. Ensure demo broker user exists
  const demoPhone = '9876543210';
  const passwordHash = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({
    where: { mobileNumber: demoPhone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Sahil Sojitra',
        mobileNumber: demoPhone,
        email: 'broker@mybusiness.com',
        passwordHash,
        businessName: 'Sojitra Trade & Brokerage',
      },
    });
    console.log(`[Seed] Created demo user: ${user.name} (${user.mobileNumber})`);
  } else {
    console.log(`[Seed] Demo user already exists: ${user.name} (${user.mobileNumber})`);
  }

  // 2. Ensure initial companies exist
  const existingCompanies = await prisma.company.findMany({
    where: { userId: user.id },
  });

  let apex = existingCompanies.find(c => c.name === 'Apex Global Traders');
  if (!apex) {
    apex = await prisma.company.create({
      data: {
        userId: user.id,
        name: 'Apex Global Traders',
        ownerName: 'Rajesh Sharma',
        contactNumber: '9825012345',
        gstin: '24AAACA1234A1Z5',
        address: 'Ring Road Market, Surat, Gujarat',
        notes: 'Primary yarn & textile supplier. Payment terms: 30 days.',
      },
    });
    console.log(`[Seed] Created company: ${apex.name}`);
  }

  let metro = existingCompanies.find(c => c.name === 'Metro Textile Mills');
  if (!metro) {
    metro = await prisma.company.create({
      data: {
        userId: user.id,
        name: 'Metro Textile Mills',
        ownerName: 'Amit Patel',
        contactNumber: '9879154321',
        gstin: '24AABCM5678B1Z2',
        address: 'GIDC Industrial Estate, Sachin, Surat',
        notes: 'Fabric processing partner.',
      },
    });
    console.log(`[Seed] Created company: ${metro.name}`);
  }

  let sunrise = existingCompanies.find(c => c.name === 'Sunrise Polymers & Weaving');
  if (!sunrise) {
    sunrise = await prisma.company.create({
      data: {
        userId: user.id,
        name: 'Sunrise Polymers & Weaving',
        ownerName: 'Vikram Shah',
        contactNumber: '9909011223',
        gstin: '24AACCS9012C1Z8',
        address: 'Udhna Main Road, Surat',
        notes: 'Regular brokerage client.',
      },
    });
    console.log(`[Seed] Created company: ${sunrise.name}`);
  }

  // 3. Ensure initial bills exist
  const billsCount = await prisma.bill.count({
    where: { userId: user.id },
  });

  if (billsCount === 0) {
    await prisma.bill.createMany({
      data: [
        {
          userId: user.id,
          companyId: apex.id,
          companyName: apex.name,
          billNumber: 'INV-2026-081',
          amount: 145000.0,
          dalaliRate: 1.5,
          dalaliAmount: 2175.0,
          date: '2026-09-01',
          dueDate: '2026-10-25',
          status: BillStatus.PENDING,
          description: 'Yarn consignment lot #409 batch delivery',
          billPdf: {
            name: 'Invoice_INV-2026-081.pdf',
            type: 'pdf',
            size: '284 KB',
            date: '2026-09-01',
          },
          chitthi: {
            name: 'Chitthi_Delivery_Slip_Lot409.jpg',
            type: 'photo',
            size: '1.2 MB',
            date: '2026-09-01',
          },
        },
        {
          userId: user.id,
          companyId: apex.id,
          companyName: apex.name,
          billNumber: 'INV-2026-094',
          amount: 75000.0,
          dalaliRate: 1.0,
          dalaliAmount: 750.0,
          date: '2026-09-20',
          dueDate: '2026-10-28',
          status: BillStatus.PENDING,
          description: 'Cotton fabric shipment bill',
        },
        {
          userId: user.id,
          companyId: metro.id,
          companyName: metro.name,
          billNumber: 'INV-9022',
          amount: 82000.0,
          dalaliRate: 2.0,
          dalaliAmount: 1640.0,
          date: '2026-08-15',
          dueDate: '2026-09-15',
          status: BillStatus.OVERDUE,
          description: 'Fabric processing & finishing lot brokerage',
        },
        {
          userId: user.id,
          companyId: sunrise.id,
          companyName: sunrise.name,
          billNumber: 'INV-4411',
          amount: 325000.0,
          dalaliRate: 1.25,
          dalaliAmount: 4062.5,
          date: '2026-10-01',
          dueDate: '2026-10-31',
          status: BillStatus.PENDING,
          description: 'Polymer raw materials supply brokerage invoice',
        },
        {
          userId: user.id,
          companyId: apex.id,
          companyName: apex.name,
          billNumber: 'INV-2026-052',
          amount: 110000.0,
          dalaliRate: 1.5,
          dalaliAmount: 1650.0,
          date: '2026-07-10',
          dueDate: '2026-08-10',
          status: BillStatus.PAID,
          description: 'Summer season cotton yarn lot - settled in full',
        },
        {
          userId: user.id,
          companyId: metro.id,
          companyName: metro.name,
          billNumber: 'INV-8874',
          amount: 95000.0,
          dalaliRate: 1.75,
          dalaliAmount: 1662.5,
          date: '2026-09-10',
          dueDate: '2026-10-10',
          status: BillStatus.PARTIAL,
          description: 'Textile dye chemicals shipment - advance paid',
        },
      ],
    });
    console.log('[Seed] Created 6 sample bills covering all status categories with Dalali commission');
  } else {
    console.log(`[Seed] User already has ${billsCount} bills.`);
  }

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
