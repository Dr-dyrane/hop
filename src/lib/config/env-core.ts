const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeValue(value: string | undefined) {
  const trimmed = value
    ?.replace(/\\r/g, "")
    ?.replace(/\\n/g, "")
    ?.replace(/[\r\n]/g, "")
    ?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function readOptionalEnv(value: string | undefined) {
  return normalizeValue(value);
}

export function readRequiredEnv(key: string, value: string | undefined) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return normalized;
}

export function readEnumEnv<T extends string>(
  key: string,
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: T
) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return fallback;
  }

  if (!allowedValues.includes(normalized as T)) {
    throw new Error(
      `Invalid value for ${key}. Expected one of: ${allowedValues.join(", ")}.`
    );
  }

  return normalized as T;
}

export function readCsvEnv(value: string | undefined, fallback: string[] = []) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return fallback;
  }

  return Array.from(
    new Set(
      normalized
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function readEmailEnv(key: string, value: string | undefined) {
  const normalized = normalizeValue(value)?.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    throw new Error(`Invalid email address configured for ${key}.`);
  }

  return normalized;
}

export function readEmailListEnv(
  key: string,
  value: string | undefined,
  fallback: string[] = []
) {
  return readCsvEnv(value, fallback).map((entry) => {
    if (!EMAIL_PATTERN.test(entry)) {
      throw new Error(`Invalid email address configured in ${key}.`);
    }

    return entry;
  });
}

export function readIntegerEnv(key: string, value: string | undefined) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer configured for ${key}.`);
  }

  return parsed;
}

export function readUrlEnv(key: string, value: string | undefined) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    throw new Error(`Invalid URL configured for ${key}.`);
  }
}
