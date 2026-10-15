/**
 * Types mirroring the API DTOs (see the Phase 1 design spec, "API").
 * Money is a JSON number; transaction amounts are signed — income positive,
 * expense negative, transfer legs opposite and equal.
 */

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  /** Computed per request: openingBalance + sum of the account's transactions. */
  balance: number;
  /** Bills and paychecks can only be assigned to payment accounts. */
  paymentAccount: boolean;
}

export type CategoryKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  /** Seeded categories: renameable, never deletable. */
  isDefault: boolean;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  /** Signed. */
  amount: number;
  type: TransactionType;
  /** ISO `YYYY-MM-DD`. */
  occurredOn: string;
  description: string | null;
  transferGroupId: string | null;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Summary {
  /** `YYYY-MM`. */
  month: string;
  /** All accounts, all time — ignores `month`. */
  totalBalance: number;
  income: number;
  /** Positive magnitude. */
  expenses: number;
  /** income − expenses; may be negative. */
  savings: number;
}

export interface MonthlyPoint {
  /** `YYYY-MM`. */
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ImportRowError {
  /** 1-based row number in the uploaded file. */
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
}

export interface ImportPreview {
  headers: string[];
  /** First 5 data rows. */
  sampleRows: string[][];
}

export interface Transfer {
  transferGroupId: string;
  fromTransactionId: string;
  toTransactionId: string;
}

/* Monthly bill plan (see the monthly bill plan design spec). Amounts are positive; kind decides direction. */

export type ItemKind = 'INCOME' | 'EXPENSE' | 'CARD_PAYMENT' | 'SAVINGS';
export type ItemStatus = 'PENDING' | 'PAID';

/** A bill or paycheck every new month copies. */
export interface RecurringItem {
  id: string;
  name: string;
  kind: ItemKind;
  accountId: string;
  accountName: string;
  /** Null = blank cell, nothing due by default. */
  defaultAmount: number | null;
  billingDay: number | null;
  sortOrder: number;
  /** False = retired: kept for history, not copied into new months. */
  active: boolean;
}

/** One row of a month's sheet. */
export interface MonthItem {
  id: string;
  /** Null for a one-off row. */
  recurringItemId: string | null;
  name: string;
  kind: ItemKind;
  accountId: string;
  accountName: string;
  amount: number | null;
  billingDay: number | null;
  sortOrder: number;
  status: ItemStatus;
  /** ISO `YYYY-MM-DD`; set only when PAID. */
  paidOn: string | null;
}

/** The sheet's right-hand table. remaining = startingBalance + income − expenses. */
export interface AccountTotals {
  accountId: string;
  accountName: string;
  /** Null until typed in from the bank app; counts as zero. */
  startingBalance: number | null;
  income: number;
  expenses: number;
  remaining: number;
}

export interface Month {
  /** `YYYY-MM`: the month the bills are paid. */
  month: string;
  /** Sorted by billing day, blank days last. */
  items: MonthItem[];
  accounts: AccountTotals[];
  /** Expenses + card payments + savings. */
  total: number;
  /** Total without savings. */
  expenditure: number;
  unpaidCount: number;
  unpaidTotal: number;
}

export interface MonthSummary {
  month: string;
  total: number;
  expenditure: number;
}
