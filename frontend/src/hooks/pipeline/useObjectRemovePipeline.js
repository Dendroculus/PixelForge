/**
 * Object removal pipeline hook.
 *
 * This small wrapper binds the generic `usePipeline` workflow to the object
 * removal action set and feature key. The generic pipeline owns shared state
 * such as upload selection, Turnstile token handling, polling, cancellation,
 * usage limits, alerts, and result URLs.
 */

import { usePipeline } from './usePipeline';
import { useObjectRemoveActions } from '../actions/useObjectRemoveActions';

/**
 * Create the object removal workspace pipeline.
 *
 * @param {(value: number | ((previous: number) => number)) => void} setProgress
 * Progress setter owned by the page component.
 * @returns {ReturnType<typeof usePipeline>} Object removal pipeline state and actions.
 */
export function useObjectRemovePipeline(setProgress) {
  return usePipeline(setProgress, useObjectRemoveActions, 'objectremove');
}
