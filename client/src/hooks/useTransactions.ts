import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  transactionService,
  type TransactionFilters,
} from '@services/transactionService';
import type {
  Mandate,
  Transaction,
  TransactionAnalytics,
  TransactionListResponse,
} from '@types/transaction';

const TRANSACTIONS_QUERY_KEY = 'transactions';
const TRANSACTION_ANALYTICS_QUERY_KEY = 'transaction-analytics';
const MANDATES_QUERY_KEY = 'transaction-mandates';

type RetryTransactionVariables = string;
type CancelTransactionVariables = {
  transactionId: string;
  reason?: string;
};
type RefundTransactionVariables = {
  transactionId: string;
  amount?: number;
  reason?: string;
};

type MandatesQueryResult = UseQueryResult<Mandate[]>;

const sanitizeFilters = (filters?: TransactionFilters): TransactionFilters | undefined => {
  if (!filters) {
    return undefined;
  }

  const sanitized: TransactionFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'minAmount' || key === 'maxAmount') {
      const numeric = typeof value === 'string' ? Number(value) : value;
      if (!Number.isNaN(numeric)) {
        sanitized[key as 'minAmount' | 'maxAmount'] = numeric as number;
      }
      return;
    }

    sanitized[key as keyof TransactionFilters] = value as never;
  });

  return sanitized;
};

export const useTransactions = (
  filters?: TransactionFilters
): UseQueryResult<TransactionListResponse> => {
  const normalizedFilters = useMemo(() => sanitizeFilters(filters), [filters]);

  return useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, normalizedFilters],
    queryFn: () => transactionService.getTransactions(normalizedFilters),
    keepPreviousData: true,
  });
};

export const useTransactionAnalytics = (
  filters?: Pick<TransactionFilters, 'startDate' | 'endDate' | 'agentId'> & {
    groupBy?: 'day' | 'week' | 'month';
  }
): UseQueryResult<TransactionAnalytics> => {
  const normalizedFilters = useMemo(() => sanitizeFilters(filters) ?? undefined, [filters]);

  return useQuery({
    queryKey: [TRANSACTION_ANALYTICS_QUERY_KEY, normalizedFilters],
    queryFn: () => transactionService.getAnalytics(normalizedFilters),
    staleTime: 60 * 1000,
  });
};

export const useRetryTransaction = (): UseMutationResult<
  Transaction,
  unknown,
  RetryTransactionVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.retryTransaction.bind(transactionService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
    },
  });
};

export const useCancelTransaction = (): UseMutationResult<
  Transaction,
  unknown,
  CancelTransactionVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, reason }) =>
      transactionService.cancelTransaction(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
    },
  });
};

export const useRefundTransaction = (): UseMutationResult<
  Transaction,
  unknown,
  RefundTransactionVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, amount, reason }) =>
      transactionService.refundTransaction(transactionId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
    },
  });
};

export const useMandates = (transactionId?: string): MandatesQueryResult => {
  return useQuery({
    queryKey: [MANDATES_QUERY_KEY, transactionId],
    queryFn: () => {
      if (!transactionId) {
        return Promise.resolve([] as Mandate[]);
      }
      return transactionService.getTransactionMandates(transactionId);
    },
    enabled: Boolean(transactionId),
  });
};

export const invalidateTransactions = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
};
