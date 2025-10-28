import React, { useMemo } from 'react';

import type { AgentConfiguration } from '@types/agent';

import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';

interface ConstraintsPanelProps {
  constraints: AgentConfiguration['constraints'];
  onUpdate: (constraints: AgentConfiguration['constraints']) => void;
}

export const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ constraints, onUpdate }) => {
  const mergedConstraints = useMemo(() => ({
    approvalRequired: constraints?.approvalRequired ?? false,
    budgetLimit: constraints?.budgetLimit,
    timeLimit: constraints?.timeLimit,
    geoRestrictions: constraints?.geoRestrictions ?? [],
  }), [constraints]);

  const handleToggleApproval = (value: boolean) => {
    onUpdate({
      ...mergedConstraints,
      approvalRequired: value,
    });
  };

  const handleBudgetChange = (field: 'amount' | 'currency' | 'period', value: string) => {
    const budget = {
      amount: mergedConstraints.budgetLimit?.amount ?? 0,
      currency: mergedConstraints.budgetLimit?.currency ?? 'USD',
      period: mergedConstraints.budgetLimit?.period ?? 'MONTHLY',
      ...mergedConstraints.budgetLimit,
    };

    if (field === 'amount') {
      budget.amount = Number(value) || 0;
    } else if (field === 'currency') {
      budget.currency = value.toUpperCase();
    } else {
      budget.period = value as AgentConfiguration['constraints']['budgetLimit']['period'];
    }

    onUpdate({
      ...mergedConstraints,
      budgetLimit: budget,
    });
  };

  const handleTimeLimitChange = (field: 'maxExecutionTime' | 'timeZone', value: string) => {
    const timeLimit = {
      maxExecutionTime: mergedConstraints.timeLimit?.maxExecutionTime ?? 60,
      timeZone: mergedConstraints.timeLimit?.timeZone ?? 'UTC',
      ...mergedConstraints.timeLimit,
    };

    if (field === 'maxExecutionTime') {
      timeLimit.maxExecutionTime = Number(value) || 0;
    } else {
      timeLimit.timeZone = value;
    }

    onUpdate({
      ...mergedConstraints,
      timeLimit,
    });
  };

  const handleGeoRestrictionsChange = (value: string) => {
    const countries = value
      .split(',')
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean);

    onUpdate({
      ...mergedConstraints,
      geoRestrictions: countries,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Approvals</h3>
            <p className="text-xs text-gray-500">Require manual approval before executing downstream actions.</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={mergedConstraints.approvalRequired}
              onChange={(event) => handleToggleApproval(event.target.checked)}
            />
            <span className="ml-2 text-xs text-gray-600">Approval required</span>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Budget guardrails</h3>
            <p className="text-xs text-gray-500">Limit total spend per run to avoid runaway transactions.</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              onUpdate({
                ...mergedConstraints,
                budgetLimit: mergedConstraints.budgetLimit ? undefined : {
                  amount: 0,
                  currency: 'USD',
                  period: 'MONTHLY',
                },
              })
            }
          >
            {mergedConstraints.budgetLimit ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {mergedConstraints.budgetLimit && (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <Input
              label="Maximum amount"
              type="number"
              min={0}
              value={mergedConstraints.budgetLimit.amount}
              onChange={(event) => handleBudgetChange('amount', event.target.value)}
            />
            <Input
              label="Currency"
              value={mergedConstraints.budgetLimit.currency}
              onChange={(event) => handleBudgetChange('currency', event.target.value)}
            />
            <label className="block text-xs font-medium text-gray-700">
              Period
              <select
                value={mergedConstraints.budgetLimit.period}
                onChange={(event) => handleBudgetChange('period', event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="TRANSACTION">Per transaction</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Execution window</h3>
            <p className="text-xs text-gray-500">Control when and how long the agent is allowed to run.</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              onUpdate({
                ...mergedConstraints,
                timeLimit: mergedConstraints.timeLimit ? undefined : {
                  maxExecutionTime: 60,
                  timeZone: 'UTC',
                },
              })
            }
          >
            {mergedConstraints.timeLimit ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {mergedConstraints.timeLimit && (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <Input
              label="Max execution time (minutes)"
              type="number"
              min={1}
              value={mergedConstraints.timeLimit.maxExecutionTime}
              onChange={(event) => handleTimeLimitChange('maxExecutionTime', event.target.value)}
            />
            <Input
              label="Time zone"
              value={mergedConstraints.timeLimit.timeZone}
              onChange={(event) => handleTimeLimitChange('timeZone', event.target.value)}
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Geo restrictions</h3>
          <p className="text-xs text-gray-500">
            Provide a comma separated list of ISO country codes to limit execution regionally.
          </p>
        </div>
        <textarea
          value={mergedConstraints.geoRestrictions.join(', ')}
          onChange={(event) => handleGeoRestrictionsChange(event.target.value)}
          className="w-full rounded-md border border-gray-300 text-sm p-3 focus:border-primary-500 focus:ring-primary-500"
          placeholder="US, CA, GB"
        />
      </section>
    </div>
  );
};
