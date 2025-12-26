export const parseJSONParam = <T>(value: unknown): T | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

export const parseNumberParam = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeModelName = (value: string): string => {
  const trimmed = value.endsWith('s') ? value.slice(0, -1) : value;
  const camel = trimmed.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  return camel.charAt(0).toLowerCase() + camel.slice(1);
};
