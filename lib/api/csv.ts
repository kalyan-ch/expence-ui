import { apiFetch } from './client';
import type { ImportPreview, ImportResult } from '../types';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ImportCsvInput {
  file: File;
  accountId: string;
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  dateFormat: string;
}

export function previewCsv(file: File): Promise<ImportPreview> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ImportPreview>('/import/preview', { method: 'POST', body: form });
}

export function importCsv(input: ImportCsvInput): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('accountId', input.accountId);
  form.append('dateColumn', input.dateColumn);
  form.append('amountColumn', input.amountColumn);
  form.append('descriptionColumn', input.descriptionColumn);
  form.append('dateFormat', input.dateFormat);
  return apiFetch<ImportResult>('/import/transactions', { method: 'POST', body: form });
}

export function exportCsvUrl(from: string, to: string): string {
  return `${API_ORIGIN}/api/export/transactions.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}
