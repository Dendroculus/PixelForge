/**
 * Image upscaling pipeline hook.
 *
 * Binds the generic workspace pipeline to the upscale action set and exposes scale
 * state for the page controls.
 */

import { usePipeline } from './usePipeline';
import { useUpscaleActions } from '../actions/useUpscaleActions';

/**
 * Create image upscaling workspace pipeline state and handlers.
 *
 * @returns {object} Hook state and handlers.
 */
export function useUpscalePipeline(setProgress) {
  const pipeline = usePipeline(setProgress, useUpscaleActions, 'upscale');

  return {
    ...pipeline,
    handleUpscale: pipeline.handleProcess,
  };
}