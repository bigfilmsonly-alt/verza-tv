import "server-only";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SANDBOX_ALLOWLIST_ENV_NAMES = [
  "APPLE_IAP_SANDBOX_ALLOWED_USER_IDS",
  "APPLE_IAP_SANDBOX_REVIEW_ALLOWED_USER_IDS",
] as const;

function configuredSandboxUserIds(): Set<string> | null {
  const allowedUserIds = new Set<string>();

  for (const envName of SANDBOX_ALLOWLIST_ENV_NAMES) {
    const rawValue = process.env[envName];
    if (rawValue === undefined || rawValue.trim() === "") continue;

    for (const value of rawValue.split(",")) {
      const normalized = value.trim().toLowerCase();
      if (!UUID_PATTERN.test(normalized)) return null;
      allowedUserIds.add(normalized);
    }
  }

  return allowedUserIds;
}

export function appleSandboxUserAllowed(userId: string): boolean {
  const normalizedUserId = userId.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalizedUserId)) return false;

  const allowedUserIds = configuredSandboxUserIds();
  return allowedUserIds?.has(normalizedUserId) ?? false;
}
