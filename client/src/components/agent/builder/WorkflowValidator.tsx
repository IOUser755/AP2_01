import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Button } from '@components/common/Button';

interface WorkflowValidatorProps {
  onValidate: () => string[];
  nodesCount: number;
  edgesCount: number;
}

export const WorkflowValidator: React.FC<WorkflowValidatorProps> = ({ onValidate, nodesCount, edgesCount }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [lastValidatedAt, setLastValidatedAt] = useState<Date | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const formattedTimestamp = useMemo(() => {
    if (!lastValidatedAt) {
      return 'Never';
    }
    return lastValidatedAt.toLocaleTimeString();
  }, [lastValidatedAt]);

  const runValidation = useCallback(() => {
    setIsValidating(true);
    try {
      const validationErrors = onValidate();
      setErrors(validationErrors);
      setLastValidatedAt(new Date());
    } finally {
      setIsValidating(false);
    }
  }, [onValidate]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      runValidation();
    }, 400);

    return () => clearTimeout(debounce);
  }, [runValidation, nodesCount, edgesCount]);

  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">Workflow health</p>
          <p className="text-xs text-gray-500">Last checked: {formattedTimestamp}</p>
        </div>
        <Button
          variant={hasErrors ? 'outline' : 'primary'}
          size="sm"
          onClick={runValidation}
          loading={isValidating}
          loadingText="Validating"
        >
          Re-run
        </Button>
      </div>

      <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${hasErrors ? 'bg-error-50 text-error-700' : 'bg-success-50 text-success-700'}`}>
        {hasErrors ? (
          <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
        )}
        <span className="text-sm font-medium">
          {hasErrors ? `${errors.length} issue${errors.length === 1 ? '' : 's'} detected` : 'Workflow is ready to run'}
        </span>
      </div>

      {hasErrors && (
        <ul className="space-y-2 text-xs text-gray-600">
          {errors.map(error => (
            <li key={error} className="flex items-start gap-2 rounded-md bg-error-50/60 px-3 py-2 text-error-700">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WorkflowValidator;
