interface FormatCurrencyOptions {
  locale?: string;
  fromMinorUnit?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatCurrency = (
  amount: number,
  currency: string,
  options: FormatCurrencyOptions = {}
) => {
  const {
    locale = 'en-US',
    fromMinorUnit = true,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  const value = fromMinorUnit ? amount / 100 : amount;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

export const formatNumber = (value: number, locale = 'en-US') =>
  new Intl.NumberFormat(locale).format(value);

interface FormatPercentageOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatPercentage = (
  value: number,
  options: FormatPercentageOptions = {}
) => {
  const {
    locale = 'en-US',
    minimumFractionDigits = 1,
    maximumFractionDigits = 1,
  } = options;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);

  return `${formatted}%`;
};
