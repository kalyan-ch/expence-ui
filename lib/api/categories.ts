import { apiFetch } from './client';
import type { Category, CategoryKind } from '../types';

export function listCategories(kind?: CategoryKind): Promise<Category[]> {
  const qs = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  return apiFetch<Category[]>(`/categories${qs}`);
}

export function createCategory(body: { name: string; kind: CategoryKind }): Promise<Category> {
  return apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify(body) });
}

export function renameCategory(id: string, name: string): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: 'DELETE' });
}
