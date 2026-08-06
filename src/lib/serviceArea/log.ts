// Plain module (no "use server") — shared by every service-area module that
// needs to log a failure without exposing it to the caller.

export function logServiceAreaError(
  operation: string,
  details: { userId?: string | null; zip?: string | null; code?: string | null; message?: string | null }
) {
  const parts = [`operation=${operation}`];
  if (details.userId) parts.push(`userId=${details.userId}`);
  if (details.zip) parts.push(`zip=${details.zip}`);
  if (details.code) parts.push(`code=${details.code}`);
  if (details.message) parts.push(`message=${details.message}`);
  console.error(`[serviceArea] ${parts.join(" ")}`);
}
