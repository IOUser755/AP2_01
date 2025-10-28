export const generateId = (prefix = 'step'): string => {
  const unique = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${unique}`;
};
