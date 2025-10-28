import React from 'react';
import { clsx } from 'clsx';

export interface TransactionFiltersState {
  search: string;
  status: string;
  type: string;
  paymentProvider: string;
  agentId: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  currency: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onFilterChange: (key: keyof TransactionFiltersState, value: string) => void;
  onReset?: () => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'AUTHORIZED', label: 'Authorized' },
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'DISPUTED', label: 'Disputed' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'SETTLEMENT', label: 'Settlement' },
  { value: 'AUTHORIZATION', label: 'Authorization' },
  { value: 'CAPTURE', label: 'Capture' },
];

const providerOptions = [
  { value: '', label: 'All Providers' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'COINBASE', label: 'Coinbase' },
  { value: 'PLAID', label: 'Plaid' },
  { value: 'BANK_API', label: 'Bank API' },
  { value: 'CUSTOM', label: 'Custom' },
];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onFilterChange(name as keyof TransactionFiltersState, value);
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <label htmlFor="status" className="text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="type" className="text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="paymentProvider" className="text-sm font-medium text-gray-700">
          Provider
        </label>
        <select
          id="paymentProvider"
          name="paymentProvider"
          value={filters.paymentProvider}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {providerOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="agentId" className="text-sm font-medium text-gray-700">
          Agent ID
        </label>
        <input
          id="agentId"
          name="agentId"
          value={filters.agentId}
          onChange={handleChange}
          placeholder="Filter by agent"
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
          Start Date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
          End Date
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="minAmount" className="text-sm font-medium text-gray-700">
          Min Amount
        </label>
        <input
          id="minAmount"
          name="minAmount"
          type="number"
          min="0"
          step="0.01"
          value={filters.minAmount}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="maxAmount" className="text-sm font-medium text-gray-700">
          Max Amount
        </label>
        <input
          id="maxAmount"
          name="maxAmount"
          type="number"
          min="0"
          step="0.01"
          value={filters.maxAmount}
          onChange={handleChange}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="currency" className="text-sm font-medium text-gray-700">
          Currency
        </label>
        <input
          id="currency"
          name="currency"
          value={filters.currency}
          onChange={handleChange}
          placeholder="USD"
          className="uppercase rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      {onReset && (
        <div className={clsx('flex items-end')}> 
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
