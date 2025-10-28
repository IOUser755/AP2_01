import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { MandateChainVisualization } from './MandateChainVisualization';
import { TransactionTimeline } from './TransactionTimeline';
import type { Transaction } from '@types/transaction';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onRefund: (amount?: number) => void;
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const getStatusAccent = (status: Transaction['status']) => {
  switch (status) {
    case 'COMPLETED':
    case 'CAPTURED':
      return { icon: CheckCircleIcon, badge: 'success' as const };
    case 'FAILED':
    case 'CANCELLED':
      return { icon: ExclamationTriangleIcon, badge: 'error' as const };
    case 'PENDING':
    case 'PROCESSING':
      return { icon: ClockIcon, badge: 'warning' as const };
    default:
      return { icon: DocumentTextIcon, badge: 'gray' as const };
  }
};

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onRetry,
  onCancel,
  onRefund,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mandates' | 'timeline' | 'raw'>(
    'overview'
  );
  const [refundAmount, setRefundAmount] = useState(transaction.amount.value);
  const accent = useMemo(() => getStatusAccent(transaction.status), [transaction.status]);
  const StatusIcon = accent.icon;

  const primaryAmount = formatCurrency(transaction.amount.value, transaction.amount.currency);
  const totalFees = formatCurrency(transaction.fees.total, transaction.fees.currency);
  const netAmount = formatCurrency(transaction.netAmount, transaction.amount.currency);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'mandates', name: 'AP2 Mandates', icon: CheckCircleIcon },
    { id: 'timeline', name: 'Timeline', icon: ClockIcon },
    { id: 'raw', name: 'Raw Data', icon: EyeIcon },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="max-h-[90vh] overflow-hidden">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-gray-100 p-2">
              <StatusIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <p className="font-mono text-xs text-gray-500">{transaction.transactionId}</p>
            </div>
          </div>
          <Badge variant={accent.badge} size="sm">
            {transaction.status}
          </Badge>
        </div>
      </ModalHeader>

      <ModalBody className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="max-h-[26rem] overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 text-sm text-gray-600">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Financials</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-semibold text-gray-900">{primaryAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Fees</span>
                      <span className="font-medium text-gray-900">{totalFees}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Net Amount</span>
                      <span className="font-medium text-gray-900">{netAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Type</span>
                      <Badge variant="secondary" size="sm">
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-medium text-gray-900">
                        {transaction.paymentMethod.provider}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Method</span>
                      <span className="font-medium text-gray-900">
                        {transaction.paymentMethod.type}
                      </span>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Timing</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Created</span>
                      <time className="font-medium text-gray-900">
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                      </time>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Updated</span>
                      <time className="font-medium text-gray-900">
                        {format(new Date(transaction.updatedAt), 'MMM d, yyyy h:mm a')}
                      </time>
                    </div>
                    {transaction.timeline[transaction.timeline.length - 1] && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Last Event</span>
                        <time className="font-medium text-gray-900">
                          {format(
                            new Date(
                              transaction.timeline[transaction.timeline.length - 1].timestamp
                            ),
                            'MMM d, yyyy h:mm a'
                          )}
                        </time>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {transaction.errorDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600">Error Details</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <p className="font-medium">{transaction.errorDetails.message}</p>
                      <p className="mt-1 font-mono text-xs">
                        Code: {transaction.errorDetails.code}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardBody className="space-y-2 text-xs text-gray-600">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">Reference</span>
                      <p className="font-medium text-gray-900">{transaction.metadata.reference ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoice</span>
                      <p className="font-medium text-gray-900">{transaction.metadata.invoiceId ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Order</span>
                      <p className="font-medium text-gray-900">{transaction.metadata.orderId ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">IP Address</span>
                      <p className="font-medium text-gray-900">{transaction.metadata.ipAddress ?? '—'}</p>
                    </div>
                  </div>
                  {transaction.metadata.description && (
                    <div>
                      <span className="text-gray-500">Description</span>
                      <p className="mt-1 text-gray-700">{transaction.metadata.description}</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'mandates' && (
            <MandateChainVisualization
              transactionId={transaction._id}
              mandateChain={transaction.mandateChain}
            />
          )}

          {activeTab === 'timeline' && <TransactionTimeline timeline={transaction.timeline} />}

          {activeTab === 'raw' && (
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Raw Transaction Payload</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(transaction, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = `transaction-${transaction.transactionId}.json`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" /> Download JSON
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
                {JSON.stringify(transaction, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {transaction.status === 'FAILED' && (
              <Button variant="outline" onClick={onRetry} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
                Retry Transaction
              </Button>
            )}
            {(transaction.status === 'PENDING' || transaction.status === 'PROCESSING') && (
              <Button variant="outline" onClick={onCancel} leftIcon={<XMarkIcon className="h-4 w-4" />}>
                Cancel Transaction
              </Button>
            )}
            {transaction.status === 'COMPLETED' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={transaction.amount.value}
                  step="0.01"
                  value={refundAmount}
                  onChange={event => setRefundAmount(Number(event.target.value))}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => onRefund(refundAmount)}
                  leftIcon={<CurrencyDollarIcon className="h-4 w-4" />}
                >
                  Refund
                </Button>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={onClose} leftIcon={<XMarkIcon className="h-4 w-4" />}>
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default TransactionDetailsModal;
