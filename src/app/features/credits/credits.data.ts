import type { CartItem, HairType } from '../products/products.data';

export type PaymentFrequency = 'semanal' | 'quincenal' | 'mensual';
export type CreditStatus = 'active' | 'completed' | 'overdue';

export interface Credit {
  id: number;
  customerName: string;
  customerPhone: string;
  customerDni?: string;
  total: number;
  initialAmount: number;
  creditEfectivo: number;
  creditDigital: number;
  installments: number;
  paidInstallments: number;
  frequency: PaymentFrequency;
  firstPaymentDate: string; // YYYY-MM-DD
  createdAt: string;
  status: CreditStatus;
  items: CartItem[];
}

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  semanal:   'Semanal',
  quincenal: 'Quincenal',
  mensual:   'Mensual',
};

export interface CreditStats {
  installmentAmount:     number;
  totalPaid:             number;
  paidPercentage:        number;
  remainingInstallments: number;
  nextPaymentDate:       Date | null;
  hasAlert:              boolean;
}

export interface InstallmentRow {
  number:    number;
  date:      Date;
  amount:    number;
  paid:      boolean;
  isNext:    boolean;
  isOverdue: boolean;
}

function addFrequencyPeriods(base: Date, freq: PaymentFrequency, n: number): Date {
  const d = new Date(base);
  if (freq === 'mensual') d.setMonth(d.getMonth() + n);
  else if (freq === 'quincenal') d.setDate(d.getDate() + 15 * n);
  else d.setDate(d.getDate() + 7 * n);
  return d;
}

export function computeCreditStats(c: Credit): CreditStats {
  const installmentAmount     = c.installments > 0 ? (c.total - c.initialAmount) / c.installments : 0;
  const totalPaid             = c.initialAmount + c.paidInstallments * installmentAmount;
  const paidPercentage        = c.total > 0 ? totalPaid / c.total : 0;
  const remainingInstallments = c.installments - c.paidInstallments;
  const base                  = new Date(c.firstPaymentDate + 'T00:00:00');
  const nextPaymentDate       = remainingInstallments > 0
    ? addFrequencyPeriods(base, c.frequency, c.paidInstallments)
    : null;
  const hasAlert = c.status !== 'completed' && remainingInstallments === 1 && paidPercentage < 0.5;
  return { installmentAmount, totalPaid, paidPercentage, remainingInstallments, nextPaymentDate, hasAlert };
}

export function computeInstallmentRows(c: Credit, today: Date): InstallmentRow[] {
  const amount = c.installments > 0 ? (c.total - c.initialAmount) / c.installments : 0;
  const base   = new Date(c.firstPaymentDate + 'T00:00:00');
  const rows: InstallmentRow[] = [];
  for (let i = 0; i < c.installments; i++) {
    const date      = addFrequencyPeriods(base, c.frequency, i);
    const paid      = i < c.paidInstallments;
    const isNext    = i === c.paidInstallments;
    const isOverdue = !paid && date < today;
    rows.push({ number: i + 1, date, amount, paid, isNext, isOverdue });
  }
  return rows;
}

const p = (id: number, name: string, price: number, cat: Exclude<HairType, 'todos'>, unit: string) =>
  ({ id, name, category: cat, price, stock: 20, unit } as const);

export const MOCK_CREDITS: Credit[] = [
  {
    id: 1,
    customerName:     'María García',
    customerPhone:    '987 654 321',
    customerDni:      '45123789',
    total:            450,
    initialAmount:    50,
    creditEfectivo:   50,
    creditDigital:    0,
    installments:     3,
    paidInstallments: 2,
    frequency:        'mensual',
    firstPaymentDate: '2026-02-10',
    createdAt:        '2026-01-10',
    status:           'active',
    items: [
      { product: p(1, 'Coleta Lacio 30cm',     45.00, 'lacio',      'unidad'), quantity: 4 },
      { product: p(2, 'Coleta Lacio 40cm',     58.00, 'lacio',      'unidad'), quantity: 6 },
      { product: p(3, 'Coleta Ondulada 35cm', 55.00, 'ondulada',  'unidad'), quantity: 8 },
      { product: p(4, 'Coleta Lacio 30cm',   50.00, 'lacio',    'unidad'), quantity: 10},
    ],
  },
  {
    id: 2,
    customerName:     'Carlos Mendoza',
    customerPhone:    '912 345 678',
    total:            800,
    initialAmount:    150,
    creditEfectivo:   150,
    creditDigital:    0,
    installments:     1,
    paidInstallments: 0,
    frequency:        'mensual',
    firstPaymentDate: '2026-05-10',
    createdAt:        '2026-04-10',
    status:           'active',
    items: [
      { product: p(10, 'Extensión Lacio 60cm',  95.00, 'lacio', 'unidad'), quantity: 5 },
      { product: p(11, 'Extensión Lacio 50cm',  85.00, 'lacio', 'unidad'), quantity: 10},
      { product: p(12, 'Peluca Natural Corta', 180.00,'ondulada',      'unidad'), quantity: 2 },
      { product: p(13, 'Coleta Lacio 25cm',  35.00, 'lacio',     'unidad'), quantity: 4 },
    ],
  },
  {
    id: 3,
    customerName:     'Lucía Ramos',
    customerPhone:    '956 789 012',
    customerDni:      '72345610',
    total:            300,
    initialAmount:    100,
    creditEfectivo:   100,
    creditDigital:    0,
    installments:     2,
    paidInstallments: 2,
    frequency:        'mensual',
    firstPaymentDate: '2026-02-20',
    createdAt:        '2026-01-20',
    status:           'completed',
    items: [
      { product: p(20, 'Coleta Lacio 50cm',     72.00, 'lacio',     'unidad'), quantity: 12},
      { product: p(21, 'Coleta Ondulada 45cm', 68.00, 'ondulada', 'unidad'), quantity: 6 },
      { product: p(22, 'Coleta Lacio 40cm',   65.00, 'lacio',   'unidad'), quantity: 4 },
    ],
  },
  {
    id: 4,
    customerName:     'Pedro Torres',
    customerPhone:    '978 012 345',
    customerDni:      '68901234',
    total:            600,
    initialAmount:    200,
    creditEfectivo:   100,
    creditDigital:    100,
    installments:     3,
    paidInstallments: 1,
    frequency:        'mensual',
    firstPaymentDate: '2026-02-15',
    createdAt:        '2026-01-15',
    status:           'overdue',
    items: [
      { product: p(30, 'Peluca Natural Larga',  250.00, 'ondulada',      'unidad'), quantity: 1 },
      { product: p(31, 'Extensión Lacio 60cm',    95.00, 'lacio', 'unidad'), quantity: 3 },
      { product: p(32, 'Coleta Ondulada 35cm',   55.00, 'ondulada',    'unidad'), quantity: 4 },
      { product: p(33, 'Coleta Lacio 25cm',    35.00, 'lacio',     'unidad'), quantity: 5 },
    ],
  },
  {
    id: 5,
    customerName:     'Ana Flores',
    customerPhone:    '945 678 901',
    total:            1200,
    initialAmount:    200,
    creditEfectivo:   200,
    creditDigital:    0,
    installments:     6,
    paidInstallments: 3,
    frequency:        'mensual',
    firstPaymentDate: '2026-02-01',
    createdAt:        '2026-01-01',
    status:           'active',
    items: [
      { product: p(40, 'Coleta Lacio 30cm',     45.00, 'lacio',        'unidad'), quantity: 10},
      { product: p(41, 'Coleta Lacio 30cm',   50.00, 'lacio',      'unidad'), quantity: 8 },
      { product: p(42, 'Extensión Lacio 50cm',  85.00, 'lacio', 'unidad'), quantity: 6 },
    ],
  },
  {
    id: 7,
    customerName:     'María García',
    customerPhone:    '987 654 321',
    customerDni:      '45123789',
    total:            250,
    initialAmount:    0,
    creditEfectivo:   0,
    creditDigital:    0,
    installments:     2,
    paidInstallments: 1,
    frequency:        'quincenal',
    firstPaymentDate: '2026-03-15',
    createdAt:        '2026-03-01',
    status:           'active',
    items: [
      { product: p(60, 'Coleta Lacio 40cm',     58.00, 'lacio',     'unidad'), quantity: 2 },
      { product: p(61, 'Coleta Ondulada 45cm', 68.00, 'ondulada', 'unidad'), quantity: 2 },
    ],
  },
  {
    id: 6,
    customerName:     'Jorge Castillo',
    customerPhone:    '923 456 789',
    total:            500,
    initialAmount:    50,
    creditEfectivo:   50,
    creditDigital:    0,
    installments:     1,
    paidInstallments: 0,
    frequency:        'mensual',
    firstPaymentDate: '2026-05-20',
    createdAt:        '2026-04-20',
    status:           'active',
    items: [
      { product: p(50, 'Coleta Lacio 30cm',     45.00, 'lacio',        'unidad'), quantity: 5 },
      { product: p(51, 'Coleta Lacio 50cm',     72.00, 'lacio',        'unidad'), quantity: 3 },
      { product: p(52, 'Extensión Lacio 60cm',  95.00, 'lacio', 'unidad'), quantity: 2 },
      { product: p(53, 'Coleta Lacio 40cm',   65.00, 'lacio',      'unidad'), quantity: 4 },
    ],
  },
];
