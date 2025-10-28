import React from 'react';
import clsx from 'clsx';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
  emptyMessage?: string;
  getRowId?: (row: T, index: number) => string | number;
}

const LoadingSkeleton = ({ columns }: { columns: Array<unknown> }) => (
  <div className="animate-pulse">
    <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
      <div className="flex gap-4">
        {columns.map((_, index) => (
          <div key={index} className="h-4 flex-1 rounded bg-gray-200" />
        ))}
      </div>
    </div>
    {[...Array(5)].map((_, index) => (
      <div key={index} className="border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4">
          {columns.map((_, columnIndex) => (
            <div key={columnIndex} className="h-4 flex-1 rounded bg-gray-100" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  sortColumn,
  sortDirection,
  onSort,
  className,
  emptyMessage = 'No data available',
  getRowId,
}: TableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key as string);
    }
  };

  if (loading) {
    return (
      <div className={clsx('overflow-hidden rounded-lg bg-white shadow', className)}>
        <LoadingSkeleton columns={columns} />
      </div>
    );
  }

  return (
    <div className={clsx('overflow-hidden rounded-lg bg-white shadow', className)}>
      <table className="min-w-full divide-y divide-gray-200" role="table">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => {
              const isSorted = sortColumn === column.key;
              const ariaSort = isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

              return (
                <th
                  key={column.key as string}
                  scope="col"
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600',
                    column.sortable && 'cursor-pointer select-none transition hover:bg-gray-100',
                    column.width,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  onClick={() => handleSort(column)}
                  aria-sort={ariaSort as 'none' | 'ascending' | 'descending'}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUpIcon className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = getRowId ? getRowId(row, rowIndex) : rowIndex;

              return (
                <tr
                  key={rowId}
                  className="group transition hover:bg-gray-50 focus-within:bg-gray-50"
                >
                  {columns.map((column) => {
                    const value = row[column.key as keyof T];
                    const content = column.render ? column.render(value, row, rowIndex) : value;

                    return (
                      <td
                        key={column.key as string}
                        className={clsx(
                          'whitespace-nowrap px-6 py-4 text-sm text-gray-900',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {content as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
