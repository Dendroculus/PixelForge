/**
 * Feature-scoped localStorage key factory.
 *
 * Previously, all features shared a single flat set of STORAGE_KEYS constants,
 * causing result URLs, job IDs, and processing state to bleed between the
 * Upscale and Remove Background pipelines.
 *
 * This module generates isolated key sets per feature (e.g. "upscale_job_id",
 * "rembg_job_id") so each pipeline reads and writes to its own namespace.
 *
 * Legacy migration: the first time a feature initialises, any values stored
 * under the old un-prefixed keys are cleared to prevent stale state from
 * surfacing in the new namespaced reads.
 */

/** Keys that were shared (un-namespaced) in the previous implementation. */
const LEGACY_KEYS = [
  'job_id',
  'progress',
  'result_url',
  'result_timestamp',
  'is_processing',
  'refresh_count',
  'upload_timestamp',
  'app_alert',
];

const MIGRATION_FLAG_PREFIX = '__sk_migrated_';

/**
 * Clears legacy un-namespaced keys once per feature so that stale data from
 * the old shared storage can never pollute the new namespaced reads.
 *
 * Safe to call multiple times – the migration is gated by a one-time flag.
 *
 * @param {string} feature - e.g. "upscale" or "rembg"
 */
export function migrateStorageKeys(feature) {
  const flag = `${MIGRATION_FLAG_PREFIX}${feature}`;
  if (localStorage.getItem(flag)) return;

  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(flag, '1');
}

/**
 * Returns a set of localStorage key strings scoped to the given feature.
 *
 * @param {string} feature - Short feature identifier, e.g. "upscale" or "rembg"
 * @returns {{ JOB_ID: string, PROGRESS: string, RESULT_URL: string,
 *             RESULT_TIMESTAMP: string, IS_PROCESSING: string,
 *             REFRESH_COUNT: string, UPLOAD_TIMESTAMP: string, ALERT: string }}
 */
export function makeStorageKeys(feature) {
  const p = feature; // prefix
  return {
    JOB_ID:           `${p}_job_id`,
    PROGRESS:         `${p}_progress`,
    RESULT_URL:       `${p}_result_url`,
    RESULT_TIMESTAMP: `${p}_result_timestamp`,
    IS_PROCESSING:    `${p}_is_processing`,
    REFRESH_COUNT:    `${p}_refresh_count`,
    UPLOAD_TIMESTAMP: `${p}_upload_timestamp`,
    ALERT:            `${p}_app_alert`,
  };
}