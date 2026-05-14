/**
 * Shared admin authentication utility.
 *
 * In production: ADMIN_API_KEY must be set — requests without the correct
 * x-admin-key header are rejected even if the env var is missing.
 * In development: if the key is not set, requests are allowed through for convenience.
 */
export function requireAdminKey(req: Request): boolean {
  const key = process.env.ADMIN_API_KEY;

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[admin-auth] ADMIN_API_KEY is not set in production — blocking all admin requests.",
      );
      return false;
    }
    // Dev/test: allow without key for local convenience.
    return true;
  }

  return req.headers.get("x-admin-key") === key;
}
