/**
 * Helpers for consistent API error handling.
 * Detects known schema/setup errors and returns user-facing messages.
 */

const MIGRATION_LAT_LNG =
  'node scripts/run-migration.js src/lib/mysql/migrations/add_latitude_longitude_to_contacts.js';

function isMissingColumnError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /Unknown column .*latitude/.test(msg) ||
    /Unknown column .*longitude/.test(msg) ||
    /Unknown column 'c\.latitude'/.test(msg) ||
    /Unknown column 'c\.longitude'/.test(msg)
  );
}

export function handleApiError(error: unknown, context?: string): { status: number; body: { error: string } } {
  console.error(context ? `[${context}]` : 'API Error', error);

  if (isMissingColumnError(error)) {
    return {
      status: 503,
      body: {
        error:
          'Database schema is out of date (missing contact latitude/longitude columns). Run this migration from the project root: ' +
          MIGRATION_LAT_LNG,
      },
    };
  }

  return {
    status: 500,
    body: { error: 'Internal server error' },
  };
}
