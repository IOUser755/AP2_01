export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  if (!Number.isFinite(value)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};
