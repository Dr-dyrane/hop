export function normalizePhoneToE164(rawValue: string) {
  const trimmed = rawValue.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+234${digits}`;
  }

  return null;
}
