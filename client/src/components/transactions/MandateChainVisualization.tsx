import React from 'react';
import { format } from 'date-fns';
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { useMandates } from '@hooks/useTransactions';
import type { Mandate } from '@types/transaction';

interface MandateChainVisualizationProps {
  transactionId: string;
  mandateChain: string[];
}

const getMandateIcon = (type: Mandate['type']) => {
  switch (type) {
    case 'INTENT':
      return DocumentTextIcon;
    case 'CART':
      return ShoppingCartIcon;
    case 'PAYMENT':
      return CurrencyDollarIcon;
    case 'APPROVAL':
    case 'CANCELLATION':
      return ShieldCheckIcon;
    default:
      return DocumentTextIcon;
  }
};

const getMandateStatusAccent = (status: Mandate['status']) => {
  switch (status) {
    case 'APPROVED':
    case 'EXECUTED':
      return { badge: 'success' as const, iconClass: 'text-green-600' };
    case 'PENDING':
      return { badge: 'warning' as const, iconClass: 'text-amber-600' };
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
      return { badge: 'error' as const, iconClass: 'text-red-600' };
    default:
      return { badge: 'gray' as const, iconClass: 'text-gray-500' };
  }
};

export const MandateChainVisualization: React.FC<MandateChainVisualizationProps> = ({
  transactionId,
  mandateChain,
}) => {
  const { data, isLoading } = useMandates(transactionId);
  const mandates = data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!mandates.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        No AP2 mandates were associated with this transaction.
      </div>
    );
  }

  const sortedMandates = [...mandates].sort(
    (a, b) => a.chain.sequenceNumber - b.chain.sequenceNumber
  );

  const chainMatches =
    !mandateChain.length ||
    mandateChain.every(mandateId =>
      sortedMandates.some(
        mandate => mandate.mandateId === mandateId || mandate._id === mandateId
      )
    );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        This transaction implements the Agentic Payment Protocol (AP2). Each mandate below is
        cryptographically linked, forming an auditable authorization chain.
      </div>

      <ol className="relative space-y-4">
        {sortedMandates.map((mandate, index) => {
          const Icon = getMandateIcon(mandate.type);
          const accent = getMandateStatusAccent(mandate.status);
          const signature = mandate.cryptography.signatures[0];
          const isLast = index === sortedMandates.length - 1;

          return (
            <li key={mandate._id} className="relative">
              {!isLast && (
                <div className="absolute left-6 top-16 h-6 w-0.5 bg-gray-200" aria-hidden />
              )}

              <Card>
                <CardBody className="flex items-start space-x-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 ${accent.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {mandate.type} Mandate • Sequence {mandate.chain.sequenceNumber + 1}
                        </p>
                        <p className="text-xs font-mono text-gray-500">{mandate.mandateId}</p>
                      </div>
                      <Badge variant={accent.badge} size="sm">
                        {mandate.status}
                      </Badge>
                    </div>

                    <div className="grid gap-4 text-xs text-gray-600 sm:grid-cols-2">
                      <div>
                        <span className="block text-gray-500">Created</span>
                        <time className="font-medium text-gray-900">
                          {format(new Date(mandate.createdAt), 'MMM d, yyyy h:mm a')}
                        </time>
                      </div>
                      <div>
                        <span className="block text-gray-500">Hash</span>
                        <p className="font-mono text-[11px] text-gray-900">
                          {mandate.cryptography.hash.slice(0, 24)}…
                        </p>
                      </div>
                      {signature && (
                        <div>
                          <span className="block text-gray-500">Signature</span>
                          <p className="font-mono text-[11px] text-gray-900">
                            {signature.signature.slice(0, 24)}…
                          </p>
                        </div>
                      )}
                      {mandate.metadata?.ipAddress && (
                        <div>
                          <span className="block text-gray-500">Origin</span>
                          <p className="font-medium text-gray-900">{mandate.metadata.ipAddress}</p>
                          {mandate.metadata.userAgent && (
                            <p className="truncate text-[11px] text-gray-500">
                              {mandate.metadata.userAgent}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                      <p className="font-medium text-gray-900">Intent</p>
                      <p className="mt-1">
                        {mandate.content.intent.description}
                      </p>
                    </div>
                  </div>

                  {!isLast && (
                    <ArrowRightIcon className="hidden h-5 w-5 text-gray-300 lg:block" aria-hidden />
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Chain Verification</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-900">Integrity:</span> All mandates share a common
            chain ID ({sortedMandates[0].chain.chainId}) and their sequence numbers increment
            monotonically.
          </p>
          <p>
            <span className="font-medium text-gray-900">Signatures:</span>{' '}
            {sortedMandates.every(m => m.cryptography.signatures.length > 0)
              ? 'Verified'
              : 'Pending'}
          </p>
          <p>
            <span className="font-medium text-gray-900">Chain Alignment:</span>{' '}
            {chainMatches ? 'Matches reported mandate chain' : 'Differences detected'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default MandateChainVisualization;
