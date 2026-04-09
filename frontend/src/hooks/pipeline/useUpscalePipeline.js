import { usePipeline } from './usePipeline';
import { useUpscaleActions } from '../actions/useUpscaleActions';

export function useUpscalePipeline(setProgress) {
  const pipeline = usePipeline(setProgress, useUpscaleActions, 'upscale');

  return {
    ...pipeline,
    handleUpscale: pipeline.handleProcess,
  };
}