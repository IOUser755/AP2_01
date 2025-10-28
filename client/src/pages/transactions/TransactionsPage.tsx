import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Badge } from '@components/common/Badge';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Table } from '@components/common/Table';
import { TransactionDetailsModal } from '@components/transactions/TransactionDetailsModal';
import {
  TransactionFilters,
  type TransactionFiltersState,
} from '@components/transactions/TransactionFilters';
import { TransactionStats } from '@components/transactions/TransactionStats';
import { RealTimeTransactionFeed } from '@components/transactions/RealTimeTransactionFeed';
import {
  useTransactions,
  useRetryTransaction,
  useCancelTransaction,
  useRefundTransaction,
} from '@hooks/useTransactions';
import { useRealTime } from '@hooks/useRealTime';
import { transactionService } from '@services/transactionService';
import type { Transaction } from '@types/transaction';
import { formatCurrency } from '@utils/formatters';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const getStatusIcon = (status: Transaction['status']) => {
  switch (status) {
    case 'COMPLETED':
    case 'CAPTURED':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" aria-hidden />;
    case 'FAILED':
    case 'CANCELLED':
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" aria-hidden />;
    case 'PENDING':
    case 'PROCESSING':
    case 'AUTHORIZED':
      return <ClockIcon className="h-4 w-4 text-amber-500" aria-hidden />;
    default:
      return <ClockIcon className="h-4 w-4 text-gray-400" aria-hidden />;
  }
};

const getStatusBadge = (status: Transaction['status']) => {
  const variants: Record<Transaction['status'], 'success' | 'error' | 'warning' | 'gray'> = {
    COMPLETED: 'success',
    CAPTURED: 'success',
    FAILED: 'error',
    CANCELLED: 'gray',
    REFUNDED: 'gray',
    DISPUTED: 'error',
    PENDING: 'warning',
    PROCESSING: 'warning',
    AUTHORIZED: 'warning',
  };
  return variants[status] ?? 'gray';
};

const initialFilters: TransactionFiltersState = {
  search: '',
  status: '',
  type: '',
  paymentProvider: '',
  agentId: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  currency: '',
};

function TransactionsPage(): JSX.Element {
  const [filters, setFilters] = useState<TransactionFiltersState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showRealTimeFeed, setShowRealTimeFeed] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  const queryFilters = useMemo(
    () => ({
      search: filters.search || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
      paymentProvider: filters.paymentProvider || undefined,
      agentId: filters.agentId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
      currency: filters.currency ? filters.currency.toUpperCase() : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    [filters, page, limit, sortBy, sortOrder]
  );

  const { data, isLoading, refetch } = useTransactions(queryFilters);
  const retryTransactionMutation = useRetryTransaction();
  const cancelTransactionMutation = useCancelTransaction();
  const refundTransactionMutation = useRefundTransaction();

  const { data: realtimeUpdate } = useRealTime({ event: 'transaction:status:updated' });

  useEffect(() => {
    if (realtimeUpdate) {
      refetch();
    }
  }, [realtimeUpdate, refetch]);

  const transactions = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = (key: keyof TransactionFiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const handleRetryTransaction = async (transactionId: string) => {
    try {
      await retryTransactionMutation.mutateAsync(transactionId);
      toast.success('Transaction retry initiated');
      refetch();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry transaction');
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    try {
      await cancelTransactionMutation.mutateAsync({ transactionId });
      toast.success('Transaction cancelled');
      refetch();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel transaction');
    }
  };

  const handleRefundTransaction = async (transactionId: string, amount?: number) => {
    try {
      await refundTransactionMutation.mutateAsync({ transactionId, amount });
      toast.success('Refund processed');
      refetch();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to process refund');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await transactionService.exportTransactions(queryFilters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `transactions-${Date.now()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      sortable: true,
      render: (value: string, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(transaction.status)}
          <button
            type="button"
            onClick={() => handleViewDetails(transaction)}
            className="font-mono text-sm text-primary-600 hover:text-primary-800"
          >
            {value.slice(0, 12)}…
          </button>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: Transaction['type']) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (_value: Transaction['amount'], transaction: Transaction) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {formatCurrency(transaction.amount.value, transaction.amount.currency)}
          </div>
          {transaction.fees.total > 0 && (
            <div className="text-xs text-gray-500">
              +{formatCurrency(transaction.fees.total, transaction.fees.currency)} fees
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: Transaction['status']) => (
        <Badge variant={getStatusBadge(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Provider',
      render: (_value: Transaction['paymentMethod'], transaction: Transaction) => (
        <span className="text-sm text-gray-900">{transaction.paymentMethod.provider}</span>
      ),
    },
    {
      key: 'agentId',
      header: 'Agent',
      render: (value: Transaction['agentId']) =>
        value ? (
          <Link to={`/agents/${value}`} className="text-sm text-primary-600 hover:text-primary-800">
            View Agent
          </Link>
        ) : (
          <span className="text-xs text-gray-400">Manual</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value: Transaction['createdAt']) => (
        <div className="text-sm text-gray-500">{format(new Date(value), 'MMM d, h:mm a')}</div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: unknown, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewDetails(transaction)}>
            <EyeIcon className="h-3 w-3" aria-hidden />
          </Button>
          {transaction.status === 'FAILED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRetryTransaction(transaction._id)}
              loading={retryTransactionMutation.isPending}
            >
              <ArrowPathIcon className="h-3 w-3" aria-hidden />
            </Button>
          )}
          {(transaction.status === 'PENDING' || transaction.status === 'PROCESSING') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCancelTransaction(transaction._id)}
              loading={cancelTransactionMutation.isPending}
            >
              <XMarkIcon className="h-3 w-3" aria-hidden />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Transactions | AgentPay Hub</title>
      </Helmet>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">
            Monitor transaction flow, mandate compliance, and settlement health across every agent.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowRealTimeFeed(prev => !prev)}>
            {showRealTimeFeed ? 'Hide' : 'Show'} Live Feed
          </Button>
          <Link to="/transactions/analytics">
            <Button variant="outline">
              <ChartBarIcon className="mr-2 h-4 w-4" aria-hidden /> Analytics
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExport} loading={isExporting}>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" aria-hidden /> Export
          </Button>
        </div>
      </div>

      <TransactionStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {showRealTimeFeed && (
          <div className="lg:col-span-1">
            <RealTimeTransactionFeed />
          </div>
        )}

        <div className={clsx('space-y-6', showRealTimeFeed ? 'lg:col-span-3' : 'lg:col-span-4')}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <Input
                    placeholder="Search transactions…"
                    value={filters.search}
                    onChange={event => handleFilterChange('search', event.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" aria-hidden />}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowFilters(prev => !prev)}>
                    <FunnelIcon className="mr-2 h-4 w-4" aria-hidden /> Filters
                  </Button>
                  <select
                    value={limit}
                    onChange={event => setLimit(Number(event.target.value))}
                    className="rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    {[10, 20, 50, 100].map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showFilters && (
                <TransactionFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Transactions
                  {pagination && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({pagination.total.toLocaleString()} total)
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  loading={isLoading}
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <Table
                    data={transactions}
                    columns={columns}
                    sortColumn={sortBy}
                    sortDirection={sortOrder}
                    onSort={handleSort}
                    emptyMessage="No transactions found"
                  />
                  {pagination && pagination.pages > 1 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        Showing {((page - 1) * limit + 1).toLocaleString()} to{' '}
                        {Math.min(page * limit, pagination.total).toLocaleString()} of{' '}
                        {pagination.total.toLocaleString()} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.max(1, prev - 1))}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <span>
                          Page {page} of {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                          disabled={page >= pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500">
                  <CurrencyDollarIcon className="mb-3 h-10 w-10 text-gray-300" aria-hidden />
                  <p>No transactions matched your current filters.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedTransaction(null);
          }}
          onRetry={() => handleRetryTransaction(selectedTransaction._id)}
          onCancel={() => handleCancelTransaction(selectedTransaction._id)}
          onRefund={amount => handleRefundTransaction(selectedTransaction._id, amount)}
        />
      )}
    </div>
  );
}

export default TransactionsPage;
