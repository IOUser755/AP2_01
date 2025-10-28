import { apiClient } from './api';
import type { ApiResponse } from './api';
import type {
  Mandate,
  Transaction,
  TransactionAnalytics,
  TransactionListResponse,
} from '@types/transaction';

export interface TransactionFilters {
  search?: string;
  status?: string;
  type?: string;
  paymentProvider?: string;
  agentId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQuery = (filters?: Record<string, unknown>): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, String(item)));
    } else {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

const ensureData = <T>(response: ApiResponse<T>, fallback: string): T => {
  if (!response.success) {
    throw new Error(response.message || fallback);
  }
  return response.data;
};

class TransactionService {
  async getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse> {
    const response = await apiClient.get<TransactionListResponse>(`/transactions${buildQuery(filters)}`);
    return ensureData(response, 'Unable to retrieve transactions.');
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return ensureData(response, 'Unable to retrieve transaction details.');
  }

  async getTransactionMandates(transactionId: string): Promise<Mandate[]> {
    const response = await apiClient.get<Mandate[]>(`/transactions/${transactionId}/mandates`);
    return ensureData(response, 'Unable to retrieve mandates.');
  }

  async retryTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/retry`);
    return ensureData(response, 'Unable to retry transaction.');
  }

  async cancelTransaction(id: string, reason?: string): Promise<Transaction> {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/cancel`, { reason });
    return ensureData(response, 'Unable to cancel transaction.');
  }

  async refundTransaction(id: string, amount?: number, reason?: string): Promise<Transaction> {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/refund`, {
      amount,
      reason,
    });
    return ensureData(response, 'Unable to refund transaction.');
  }

  async getAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    agentId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<TransactionAnalytics> {
    const response = await apiClient.get<TransactionAnalytics>(`/transactions/analytics${buildQuery(filters)}`);
    return ensureData(response, 'Unable to retrieve analytics.');
  }

  async exportTransactions(filters?: TransactionFilters): Promise<Blob> {
    return apiClient.download(`/transactions/export${buildQuery(filters)}`);
  }

  async getPaymentMethods(): Promise<Array<{ id: string; provider: string; type: string }>> {
    const response = await apiClient.get<Array<{ id: string; provider: string; type: string }>>('/payment-methods');
    return ensureData(response, 'Unable to retrieve payment methods.');
  }

  async addPaymentMethod(paymentMethodData: Record<string, unknown>): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/payment-methods', paymentMethodData);
    return ensureData(response, 'Unable to add payment method.');
  }

  async removePaymentMethod(id: string): Promise<void> {
    const response = await apiClient.delete(`/payment-methods/${id}`);
    ensureData(response, 'Unable to remove payment method.');
  }
}

export const transactionService = new TransactionService();

export type {
  Mandate,
  Transaction,
  TransactionAnalytics,
  TransactionListResponse,
} from '@types/transaction';
