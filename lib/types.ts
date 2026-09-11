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
