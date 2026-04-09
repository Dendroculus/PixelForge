import { usePipeline } from './usePipeline';
import { useRemBGActions } from '../actions/useRemBGActions';

export function useRemBGPipeline(setProgress) {
  return usePipeline(setProgress, useRemBGActions, 'rembg');
}