import React from 'react';
import clsx from 'clsx';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

const formatInputDate = (date: Date) => {
  const iso = date.toISOString();
  return iso.slice(0, 10);
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  className,
}) => {
  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    const nextStart = new Date(value);
    if (Number.isNaN(nextStart.getTime())) {
      return;
    }

    if (nextStart > endDate) {
      onDateChange({ start: nextStart, end: nextStart });
    } else {
      onDateChange({ start: nextStart, end: endDate });
    }
  };

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    const nextEnd = new Date(value);
    if (Number.isNaN(nextEnd.getTime())) {
      return;
    }

    if (nextEnd < startDate) {
      onDateChange({ start: nextEnd, end: nextEnd });
    } else {
      onDateChange({ start: startDate, end: nextEnd });
    }
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <label className="text-xs font-medium text-gray-500" htmlFor="analytics-start-date">
        Start
      </label>
      <input
        id="analytics-start-date"
        type="date"
        value={formatInputDate(startDate)}
        max={formatInputDate(endDate)}
        onChange={handleStartChange}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <span className="text-gray-400">—</span>
      <label className="text-xs font-medium text-gray-500" htmlFor="analytics-end-date">
        End
      </label>
      <input
        id="analytics-end-date"
        type="date"
        value={formatInputDate(endDate)}
        min={formatInputDate(startDate)}
        onChange={handleEndChange}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
};
