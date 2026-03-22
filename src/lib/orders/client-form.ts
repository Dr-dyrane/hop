export function getClientErrorMessage(error: unknown, fallback = "Try again.") {
  return error instanceof Error ? error.message : fallback;
}

export async function readJsonPayload<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function validateUploadFile(
  file: File,
  allowedTypes: string[],
  maxSizeInMb = 10
) {
  if (!allowedTypes.includes(file.type)) {
    return "Use JPG, PNG, WEBP, or PDF.";
  }

  const maxSizeInBytes = maxSizeInMb * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return `Keep file size below ${maxSizeInMb}MB.`;
  }

  return null;
}
