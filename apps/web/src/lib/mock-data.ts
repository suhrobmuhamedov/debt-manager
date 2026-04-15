type MockDebtType = 'given' | 'taken';
type MockDebtStatus = 'pending' | 'partial' | 'paid';
type MockConfirmationStatus = 'not_required' | 'pending' | 'confirmed' | 'denied' | null;

export type MockUser = {
  id: number;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  languageCode: string;
  createdAt: string;
  token: string;
};

type MockContactRecord = {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
};

export type MockContactListItem = MockContactRecord & {
  activeDebtsCount: number;
  totalAmount: number;
};

export type MockDebtRecord = {
  id: number;
  contactId: number;
  contactName: string;
  amount: number;
  paidAmount: number;
  currency: string;
  type: MockDebtType;
  status: MockDebtStatus;
  givenDate: string;
  returnDate: string;
  paidAt: string | null;
  confirmationStatus: MockConfirmationStatus;
  confirmationExpiresAt: string | null;
  linkedDebtId: number | null;
  createdAt: string;
};

const dateOnly = (offsetDays: number) => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString().slice(0, 10);
};

const dateTime = (offsetDays: number) => {
  const value = new Date();
  value.setHours(10, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString();
};

const mockUser: MockUser = {
  id: 1,
  telegramId: '998901234567',
  firstName: 'Suhrob',
  lastName: 'Developer',
  username: 'suhrob_dev',
  phone: '+998901234567',
  languageCode: 'uz',
  createdAt: dateTime(-120),
  token: 'design-mode-token',
};

const contacts: MockContactRecord[] = [
  { id: 1, name: 'Aziz Karimov', phone: '+998901112233', note: "Doim vaqtida qaytaradi." },
  { id: 2, name: 'Malika Tursunova', phone: '+998933334455', note: "To'lovni ikki qismda qiladi." },
  { id: 3, name: 'Jasur Xolmatov', phone: '+998977778899', note: "Ish bo'yicha qarzlar." },
  { id: 4, name: 'Dilnoza Rahimova', phone: '+998909990011', note: 'Oilaviy xarajatlar uchun.' },
];

const debts: MockDebtRecord[] = [
  {
    id: 101,
    contactId: 1,
    contactName: 'Aziz Karimov',
    amount: 2500000,
    paidAmount: 500000,
    currency: 'UZS',
    type: 'given',
    status: 'partial',
    givenDate: dateOnly(-18),
    returnDate: dateOnly(5),
    paidAt: null,
    confirmationStatus: 'pending',
    confirmationExpiresAt: dateTime(2),
    linkedDebtId: null,
    createdAt: dateTime(-18),
  },
  {
    id: 102,
    contactId: 2,
    contactName: 'Malika Tursunova',
    amount: 1200000,
    paidAmount: 200000,
    currency: 'UZS',
    type: 'given',
    status: 'partial',
    givenDate: dateOnly(-30),
    returnDate: dateOnly(-2),
    paidAt: null,
    confirmationStatus: 'denied',
    confirmationExpiresAt: dateTime(-1),
    linkedDebtId: null,
    createdAt: dateTime(-30),
  },
  {
    id: 103,
    contactId: 3,
    contactName: 'Jasur Xolmatov',
    amount: 800000,
    paidAmount: 0,
    currency: 'UZS',
    type: 'taken',
    status: 'pending',
    givenDate: dateOnly(-8),
    returnDate: dateOnly(10),
    paidAt: null,
    confirmationStatus: 'not_required',
    confirmationExpiresAt: null,
    linkedDebtId: null,
    createdAt: dateTime(-8),
  },
  {
    id: 104,
    contactId: 1,
    contactName: 'Aziz Karimov',
    amount: 400000,
    paidAmount: 400000,
    currency: 'UZS',
    type: 'given',
    status: 'paid',
    givenDate: dateOnly(-45),
    returnDate: dateOnly(-15),
    paidAt: dateOnly(-3),
    confirmationStatus: 'confirmed',
    confirmationExpiresAt: null,
    linkedDebtId: 401,
    createdAt: dateTime(-45),
  },
  {
    id: 105,
    contactId: 4,
    contactName: 'Dilnoza Rahimova',
    amount: 600000,
    paidAmount: 600000,
    currency: 'UZS',
    type: 'taken',
    status: 'paid',
    givenDate: dateOnly(-25),
    returnDate: dateOnly(-5),
    paidAt: dateOnly(-1),
    confirmationStatus: 'not_required',
    confirmationExpiresAt: null,
    linkedDebtId: null,
    createdAt: dateTime(-25),
  },
  {
    id: 106,
    contactId: 4,
    contactName: 'Dilnoza Rahimova',
    amount: 1500000,
    paidAmount: 0,
    currency: 'UZS',
    type: 'given',
    status: 'pending',
    givenDate: dateOnly(-4),
    returnDate: dateOnly(1),
    paidAt: null,
    confirmationStatus: 'confirmed',
    confirmationExpiresAt: null,
    linkedDebtId: 402,
    createdAt: dateTime(-4),
  },
];

const remainingAmount = (debt: Pick<MockDebtRecord, 'amount' | 'paidAmount'>) => {
  return Math.max(debt.amount - debt.paidAmount, 0);
};

export const getMockUser = () => ({ ...mockUser });

export const getMockDebts = () => debts.map((debt) => ({ ...debt }));

export const getMockContacts = (): MockContactListItem[] => {
  return contacts.map((contact) => {
    const contactDebts = debts.filter((debt) => debt.contactId === contact.id && debt.status !== 'paid');

    return {
      ...contact,
      activeDebtsCount: contactDebts.length,
      totalAmount: contactDebts.reduce((sum, debt) => sum + remainingAmount(debt), 0),
    };
  });
};

export const getMockDashboardStats = () => {
  const debtItems = getMockDebts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeDebts = debtItems.filter((debt) => debt.status !== 'paid');
  const givenActive = activeDebts.filter((debt) => debt.type === 'given');
  const takenActive = activeDebts.filter((debt) => debt.type === 'taken');
  const overdueDebts = activeDebts.filter((debt) => new Date(debt.returnDate).getTime() < today.getTime());

  return {
    totalGiven: givenActive.reduce((sum, debt) => sum + remainingAmount(debt), 0),
    totalTaken: takenActive.reduce((sum, debt) => sum + remainingAmount(debt), 0),
    overdueAmount: overdueDebts.reduce((sum, debt) => sum + remainingAmount(debt), 0),
    overdueCount: overdueDebts.length,
    givenCount: givenActive.length,
    takenCount: takenActive.length,
    paidCount: debtItems.filter((debt) => debt.status === 'paid').length,
    recentDebts: debtItems
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
  };
};

export const getMockContactDetail = (contactId: number) => {
  const contact = contacts.find((item) => item.id === contactId);

  if (!contact) {
    return null;
  }

  const contactDebts = getMockDebts().filter((debt) => debt.contactId === contactId);
  const stats = {
    totalGiven: contactDebts
      .filter((debt) => debt.type === 'given' && debt.status !== 'paid')
      .reduce((sum, debt) => sum + remainingAmount(debt), 0),
    totalTaken: contactDebts
      .filter((debt) => debt.type === 'taken' && debt.status !== 'paid')
      .reduce((sum, debt) => sum + remainingAmount(debt), 0),
    activeDebtsCount: contactDebts.filter((debt) => debt.status !== 'paid').length,
  };

  return {
    contact,
    debts: contactDebts,
    stats,
  };
};

export const getMockDebtDetail = (debtId: number) => {
  const debt = getMockDebts().find((item) => item.id === debtId);

  if (!debt) {
    return null;
  }

  return {
    debt,
    contact: contacts.find((item) => item.id === debt.contactId) ?? null,
  };
};
