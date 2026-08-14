// Next.js's redirect() throws a special internal error (digest starting
// with "NEXT_REDIRECT") to perform navigation through the framework's own
// machinery. A client component that wraps a server action call in
// try/catch must recognize and rethrow this specific case -- otherwise a
// successful submission that ends in redirect() gets misclassified as a
// failure and shown as an inline error instead of navigating.
export function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
