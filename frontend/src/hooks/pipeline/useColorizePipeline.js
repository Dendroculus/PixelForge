import { usePipeline } from './usePipeline';
import { useColorizeActions } from '../actions/useColorizeActions';

export function useColorizePipeline(setProgress) {
  return usePipeline(setProgress, useColorizeActions, 'colorize');
}